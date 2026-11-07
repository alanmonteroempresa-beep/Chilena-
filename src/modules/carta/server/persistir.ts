import "server-only";
import type { CardTier, PositionGroup, Prisma } from "@/generated/prisma/client";
import { perfilesDeJugadores } from "@/modules/core/server-api";
import { equipoDeCadaQuien } from "@/modules/equipos/server-api";
import { plantillasDeJugadores } from "@/modules/ligas/server-api";
import { estadisticasVigentes, historialDePlantillas } from "@/modules/partidos/server-api";
import { votosParaLaCarta } from "@/modules/votaciones";
import { votosParaLasCartas } from "@/modules/votaciones/server-api";
import { emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { evaluarInsignias, type CriterioInsignia } from "./badges";
import { calcularCarta, grupoDePosicion, type Carta, type Ventana } from "./formula";
import { catalogoDeInsignias } from "./queries";
import { armarHistoriales, partidosDeLaVentana, posicionMasJugada, ventanaDe, type PartidoDelJugador } from "./services/historial";

/** El historial validado de cada persona (plantillas de `ligas` + partidos, alineaciones y eventos) */
export async function historiales(userIds: string[]) {
  const plantillas = (await plantillasDeJugadores(userIds)).filter((p) => p.status !== "PENDIENTE_APROBACION").map((p) => ({
    userId: p.userId,
    tournamentId: p.tournamentId,
    teamId: p.tournamentTeam.teamId,
  }));
  return armarHistoriales(plantillas, await historialDePlantillas(plantillas));
}

export type CartaCalculada = {
  carta: Carta;
  ventana: Ventana;
  historial: PartidoDelJugador[];
  esPionero: boolean;
  /** Votaciones ganadas por tipo (insignias votadas: MVP, Golazo, El Muro…) */
  votadas: Record<string, number>;
};

/** La carta de cada jugador con la fórmula (docs/CARTA_E_INSIGNIAS.md §1) */
export async function calcularCartas(userIds: string[]): Promise<Map<string, CartaCalculada>> {
  const [hs, perfiles, miembros, votaciones] = await Promise.all([
    historiales(userIds),
    perfilesDeJugadores(userIds),
    equipoDeCadaQuien(userIds),
    votosParaLasCartas(userIds),
  ]);
  const resultado = new Map<string, CartaCalculada>();
  for (const id of userIds) {
    const historial = hs.get(id) ?? [];
    const perfil = perfiles.find((p) => p.id === id);
    const posicion = perfil?.playerProfile?.posicionPrincipal ?? miembros.find((m) => m.userId === id)?.posicion ?? null;
    // CRK: MVP y % de votos solo de las votaciones del MVP de los partidos de su ventana (CARTA §1)
    const mvp = votaciones.filter((v) => v.tipo === "MVP_PARTIDO");
    const ventana = ventanaDe(historial, votosParaLaCarta(mvp, id, partidosDeLaVentana(historial)));
    const carta = calcularCarta(ventana, grupoDePosicion(posicion, posicionMasJugada(historial)), historial.filter((p) => p.jugo).length);
    const votadas: Record<string, number> = {};
    for (const v of votaciones) if (v.ganadorUserId === id) votadas[v.tipo] = (votadas[v.tipo] ?? 0) + 1;
    resultado.set(id, { carta, ventana, historial, esPionero: Boolean(perfil?.isPionero || perfil?.claimedAt), votadas });
  }
  return resultado;
}

const TIER: Record<Carta["nivel"], CardTier> = { bronce: "BRONCE", plata: "PLATA", oro: "ORO", leyenda: "LEYENDA" };

/**
 * Recalcula y GUARDA la carta y las insignias (cola de `match.validated`, CARTA §1 y §4).
 * Solo escribe lo que cambió. `silencioso` (al recalcular todo) no emite `card.recalculated` ni
 * `badge.awarded`: no avisa ni publica por lo que ya pasó.
 */
export async function recalcularCartas(userIds: string[], { silencioso = false } = {}) {
  if (!userIds.length) return { cartas: 0, insignias: 0 };
  const [calculadas, stats, previas, catalogo, insigniasPrevias] = await Promise.all([
    calcularCartas(userIds),
    estadisticasVigentes(userIds),
    db.playerCard.findMany({ where: { userId: { in: userIds } }, select: { userId: true, media: true, deltaUltimaJornada: true } }),
    catalogoDeInsignias(),
    db.userBadge.findMany({ where: { userId: { in: userIds } }, select: { userId: true, badgeId: true, veces: true, progreso: true, meta: true } }),
  ]);
  const ahora = new Date();

  // Cartas
  const nuevas: Prisma.PlayerCardCreateManyInput[] = [];
  let cartas = 0;
  for (const [userId, { carta, ventana }] of calculadas) {
    const s = stats.find((x) => x.userId === userId);
    const previa = previas.find((p) => p.userId === userId);
    const delta =
      previa && previa.media != null && carta.media != null && previa.media !== carta.media
        ? carta.media - previa.media
        : (previa?.deltaUltimaJornada ?? 0);
    const datos = {
      positionGroup: carta.grupo as PositionGroup,
      tier: TIER[carta.nivel],
      media: carta.media,
      enConstruccion: carta.enConstruccion,
      partidosValidados: carta.partidosValidados,
      atributos: { atributos: carta.atributos, ventana } as unknown as Prisma.InputJsonValue,
      goles: s?.goles ?? 0,
      partidos: s?.partidos ?? 0,
      asistencias: s?.asistencias ?? 0,
      deltaUltimaJornada: delta,
      recalculadaAt: ahora,
    };
    if (!previa) nuevas.push({ userId, ...datos });
    else {
      await db.playerCard.update({ where: { userId }, data: datos });
      cartas++;
    }
    if (!silencioso && previa?.media !== carta.media) {
      await emit("card.recalculated", { userId, media: carta.media, delta });
    }
  }
  if (nuevas.length) await db.playerCard.createMany({ data: nuevas, skipDuplicates: true });

  // Insignias: veces, progreso y meta (las no ganadas guardan su progreso con veces = 0)
  const porCodigo = new Map(catalogo.map((b) => [b.code, b]));
  const crear: Prisma.UserBadgeCreateManyInput[] = [];
  const ganadas: { userId: string; badgeCode: string }[] = [];
  let insignias = 0;
  for (const [userId, c] of calculadas) {
    const estados = evaluarInsignias(
      catalogo.map((b) => ({ ...b, criteria: b.criteria as CriterioInsignia })),
      { partidos: c.historial, esPortero: c.carta.grupo === "PORTERO", esPionero: c.esPionero, votadas: c.votadas },
    );
    for (const e of estados) {
      const badge = porCodigo.get(e.code)!;
      if (e.veces === 0 && e.progreso == null) continue;
      const previa = insigniasPrevias.find((x) => x.userId === userId && x.badgeId === badge.id);
      const datos = { veces: e.veces, progreso: e.veces > 0 ? null : (e.progreso ?? null), meta: e.veces > 0 ? null : (e.meta ?? null) };
      if (!previa) {
        crear.push({ userId, badgeId: badge.id, ...datos, firstAwardedAt: ahora, lastAwardedAt: ahora });
        if (e.veces > 0) ganadas.push({ userId, badgeCode: e.code });
      } else if (previa.veces !== datos.veces || previa.progreso !== datos.progreso || previa.meta !== datos.meta) {
        await db.userBadge.update({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          data: { ...datos, ...(datos.veces > previa.veces ? { lastAwardedAt: ahora } : {}), ...(previa.veces === 0 && datos.veces > 0 ? { firstAwardedAt: ahora } : {}) },
        });
        insignias++;
        if (datos.veces > previa.veces) ganadas.push({ userId, badgeCode: e.code });
      }
    }
  }
  if (crear.length) await db.userBadge.createMany({ data: crear, skipDuplicates: true });
  if (!silencioso) for (const g of ganadas) await emit("badge.awarded", g);
  logger.info("cartas recalculadas", { jugadores: userIds.length, nuevas: nuevas.length, cartas, insignias: insignias + crear.length });
  return { cartas: cartas + nuevas.length, insignias: insignias + crear.length };
}
