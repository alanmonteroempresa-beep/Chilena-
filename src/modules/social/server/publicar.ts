import "server-only";
import type { PostType, Prisma } from "@/generated/prisma/client";
import { equipoDeCadaQuien } from "@/modules/equipos/server-api";
import { tablaDelTorneo, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import {
  goleoDelTorneo,
  jornadaCompleta,
  partidoValidadoParaFeed,
  partidosValidadosConGoles,
} from "@/modules/partidos/server-api";
import { db } from "@/shared/lib/db";
import { nombreCorto, nombreDeArbitro, nombreVisible } from "@/shared/lib/personas";
import { autoPostsDeLaJornada, postDeInsignia, type AutoPost, type EquipoJornada, type PartidoJornada } from "./services/auto-posts";

const equipoDe = (t: {
  id: string;
  slug: string;
  nombre: string;
  siglas: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
}): EquipoJornada => ({ ...t, corto: nombreCorto(t.nombre) });

type PartidoConGoles = NonNullable<Awaited<ReturnType<typeof partidoValidadoParaFeed>>>;

/** De la fila del partido a lo que necesita el generador de auto-posts */
export function aPartidoJornada(p: Omit<PartidoConGoles, "tournamentId" | "roundId" | "tournament">, jornada: number): PartidoJornada {
  return {
    id: p.id,
    jornada,
    cancha: p.field?.nombre ?? null,
    inicio: p.scheduledAt,
    validadoEn: p.validatedAt,
    local: equipoDe(p.homeTeam),
    visita: equipoDe(p.awayTeam),
    golesLocal: p.homeScore ?? 0,
    golesVisita: p.awayScore ?? 0,
    arbitro: p.referee ? nombreDeArbitro(p.referee) : null,
    goles: p.events
      .filter((e) => e.player && e.teamId)
      .map((e) => ({
        minuto: e.minute,
        // El autogol se anota con el equipo del jugador y suma al contrario (PRD §7.7)
        equipoId: e.type === "AUTOGOL" ? (e.teamId === p.homeTeam.id ? p.awayTeam.id : p.homeTeam.id) : e.teamId!,
        autogol: e.type === "AUTOGOL",
        jugadorId: e.player!.id,
        jugador: nombreVisible(e.player!),
        username: e.player!.username,
        tipoGol: e.tipoGol,
      })),
  };
}

const TIPO: Record<AutoPost["tipo"], PostType> = {
  AUTO_CRONICA: "AUTO_CRONICA",
  AUTO_RESULTADO: "AUTO_RESULTADO",
  AUTO_GOL: "AUTO_GOL",
  AUTO_TABLA: "AUTO_TABLA",
  AUTO_RACHA: "AUTO_RACHA",
  AUTO_INSIGNIA: "AUTO_INSIGNIA",
};

/**
 * Guarda auto-posts sin duplicar: cada uno trae su `clave` en `data` (p. ej. "cronica:<partido>").
 * Si ya existe se actualiza (conserva reacciones y comentarios); lo que ya no sale de la cédula (una
 * corrección quitó un gol) se borra dentro del mismo alcance.
 */
async function guardar(
  posts: AutoPost[],
  ambito: { leagueId: string | null; tournamentId: string | null; roundId: string | null; matchId?: string },
  borrarSobrantes: (AutoPost["tipo"])[] = [],
) {
  const existentes = await db.post.findMany({
    where: {
      source: "PLANTILLA",
      ...(ambito.matchId ? { matchId: ambito.matchId } : { roundId: ambito.roundId, matchId: null }),
    },
    select: { id: true, type: true, data: true },
  });
  const porClave = new Map(existentes.map((e) => [(e.data as { clave?: string } | null)?.clave, e]));
  let nuevos = 0;
  for (const p of posts) {
    const previo = porClave.get(p.id);
    const datos = {
      headline: "titular" in p ? p.titular.slice(0, 140) : null,
      body: p.tipo === "AUTO_CRONICA" ? p.cuerpo.join("\n") : null,
      data: { ...p, clave: p.id } as unknown as Prisma.InputJsonValue,
      subjectUserId: p.jugadores[0] ?? null,
      teamId: p.equipos[0] ?? null,
    };
    if (previo) {
      await db.post.update({ where: { id: previo.id }, data: datos });
    } else {
      await db.post.create({
        data: {
          ...datos,
          type: TIPO[p.tipo],
          source: "PLANTILLA",
          authorAs: "SYSTEM",
          leagueId: ambito.leagueId,
          tournamentId: ambito.tournamentId,
          roundId: ambito.roundId,
          matchId: ambito.matchId ?? null,
          createdAt: new Date(p.fecha),
        },
      });
      nuevos++;
    }
  }
  const claves = new Set(posts.map((p) => p.id));
  const sobrantes = existentes.filter((e) => borrarSobrantes.includes(e.type as AutoPost["tipo"]) && !claves.has((e.data as { clave?: string })?.clave ?? ""));
  if (sobrantes.length) await db.post.deleteMany({ where: { id: { in: sobrantes.map((s) => s.id) } } });
  return { nuevos, actualizados: posts.length - nuevos, borrados: sobrantes.length };
}

/** Crónica, resultado y un post por gol del partido validado (PRD §6.1) */
export async function publicarPartido(matchId: string) {
  const p = await partidoValidadoParaFeed(matchId);
  if (!p || p.round?.numero == null) return null;
  const tabla = p.tournamentId ? await tablaDelTorneo(p.tournamentId) : [];
  const posts = autoPostsDeLaJornada({
    partidos: [aPartidoJornada(p, p.round.numero)],
    liderAntesId: tabla.find((f) => f.posicionAnterior === 1)?.tournamentTeam.team.id,
    tabla: [],
    goleo: [],
    rachas: [],
  });
  const r = await guardar(
    posts,
    { leagueId: p.tournament?.leagueId ?? null, tournamentId: p.tournamentId, roundId: p.roundId, matchId },
    ["AUTO_CRONICA", "AUTO_RESULTADO", "AUTO_GOL"],
  );
  if (p.roundId && p.tournamentId) await publicarFinDeJornada(p.tournamentId, p.roundId, p.round.numero, p.tournament?.leagueId ?? null);
  return r;
}

/** Fin de jornada (todos sus partidos validados): la tabla con el goleo y las rachas */
export async function publicarFinDeJornada(tournamentId: string, roundId: string, numero: number, leagueId: string | null) {
  if (!(await jornadaCompleta(roundId))) return null;
  const [partidos, tabla, goleo] = await Promise.all([
    partidosValidadosConGoles(tournamentId, numero),
    tablaDelTorneo(tournamentId),
    goleoDelTorneo(tournamentId, 200),
  ]);
  const posts = autoPostsDeLaJornada({
    partidos: partidos.map((x) => aPartidoJornada(x, numero)),
    tabla: tabla.map((f) => ({ equipo: equipoDe(f.tournamentTeam.team), pts: f.pts, posicion: f.posicion })),
    goleo: goleo.slice(0, 3).map((g) => ({ nombre: nombreVisible(g.user), username: g.user.username, goles: g.goles })),
    rachas: goleo.map((g) => ({ jugadorId: g.userId, nombre: nombreVisible(g.user), username: g.user.username, racha: g.rachaGoles })),
  }).filter((x) => x.tipo === "AUTO_TABLA" || x.tipo === "AUTO_RACHA");
  return guardar(posts, { leagueId, tournamentId, roundId }, ["AUTO_TABLA", "AUTO_RACHA"]);
}

/** "El Brujo ganó la insignia De Chilena" (cola de `badge.awarded`) */
export async function publicarInsignia(userId: string, badgeCode: string) {
  const [persona, badge, [miembro], ganada] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { nombre: true, sobrenombre: true, username: true } }),
    db.badge.findUnique({ where: { code: badgeCode }, select: { id: true, code: true, nombre: true, descripcion: true, icon: true } }),
    equipoDeCadaQuien([userId]),
    db.userBadge.findFirst({ where: { userId, badge: { code: badgeCode } }, select: { veces: true } }),
  ]);
  if (!persona || !badge) return null;
  const torneo = miembro ? (await torneoVigenteDelEquipo(miembro.team.id))?.tournament : null;
  const post = postDeInsignia({
    userId,
    nombre: nombreVisible(persona),
    username: persona.username,
    equipoId: miembro?.team.id,
    insignia: badge,
    veces: ganada?.veces ?? 1,
    fecha: Date.now(),
  });
  if (!post) return null;
  const existe = await db.post.findFirst({ where: { source: "PLANTILLA", type: "AUTO_INSIGNIA", subjectUserId: userId, data: { path: ["clave"], equals: post.id } }, select: { id: true } });
  if (existe) return null;
  await db.post.create({
    data: {
      type: "AUTO_INSIGNIA",
      source: "PLANTILLA",
      authorAs: "SYSTEM",
      subjectUserId: userId,
      teamId: miembro?.team.id ?? null,
      leagueId: torneo?.league.id ?? null,
      tournamentId: torneo?.id ?? null,
      headline: `${nombreVisible(persona)} ganó la insignia ${badge.nombre}`.slice(0, 140),
      data: { ...post, clave: post.id } as unknown as Prisma.InputJsonValue,
    },
  });
  return post;
}
