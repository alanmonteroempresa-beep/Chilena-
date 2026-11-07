import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { perfilesDeJugadores } from "@/modules/core/server-api";
import { db } from "@/shared/lib/db";
import { inscritosDelTorneo } from "./puertos";
import { datosParaRecalcular, type DatosParaRecalcular } from "./queries";
import { estadisticasDelTorneo, type EstadisticasDelJugador } from "./services/estadisticas";
import { amarillasAcumuladas, conciliarSanciones, partidosCumplidos, sancionesAutomaticas, type PartidoParaSanciones } from "./services/sanciones";
import { puntosJuegoLimpio, type TarjetaCedula } from "./services/tarjetas";

// Lo que sale solo de las cédulas validadas (PRD §7.8 y §7.13): sanciones automáticas, partidos cumplidos,
// estadísticas por torneo y lo que necesita la tabla. Recalcular desde cero siempre da lo mismo.

type Tx = Prisma.TransactionClient;

const tarjetasDe = (d: DatosParaRecalcular, matchId: string): TarjetaCedula[] =>
  d.eventos
    .filter((e) => e.matchId === matchId && (e.type === "AMARILLA" || e.type === "ROJA") && e.playerId)
    .map((e) => ({ jugadorId: e.playerId!, equipoId: e.teamId ?? "", tipo: e.type as "AMARILLA" | "ROJA", minuto: e.minute }));

function paraSanciones(d: DatosParaRecalcular): PartidoParaSanciones[] {
  return d.partidos.map((p, i) => ({
    matchId: p.id,
    orden: i,
    etiqueta: `J${p.round?.numero ?? i + 1}`,
    status: p.status,
    fase: p.round?.fase ?? "REGULAR",
    tarjetas: tarjetasDe(d, p.id),
  }));
}

/**
 * Sanciones automáticas (PRD §7.8): crea las que faltan (una por hecho), anula las que ya no salen de las
 * cédulas (partidos validados fuera de orden) o quedaron repetidas, y recalcula los partidos cumplidos, todo
 * con bitácora. Va dentro de la transacción de la validación (CLAUDE.md, Arquitectura). Toma el candado del
 * torneo: dos validaciones a la vez se forman y la segunda ya ve lo que guardó la primera.
 */
export async function recalcularSanciones(
  tx: Tx,
  torneo: { id: string; partidosPorRoja: number; amarillasParaSuspension: number },
  actorId: string | null,
  { seco = false } = {},
) {
  if (!seco) await tx.$queryRaw`SELECT "id" FROM "tournaments" WHERE "id" = ${torneo.id}::uuid FOR UPDATE`;
  const d = await datosParaRecalcular(torneo.id, tx);
  const inscritos = await inscritosDelTorneo(torneo.id);
  const inscripcion = new Map(inscritos.map((i) => [i.userId, i]));
  // Todas las automáticas, también las anuladas: lo que la liga anuló no revive
  const guardadas = await tx.sanction.findMany({
    where: { tournamentId: torneo.id, automatica: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, userId: true, matchId: true, motivo: true, status: true },
  });
  const { crear, sobran } = conciliarSanciones(sancionesAutomaticas(paraSanciones(d), torneo), guardadas);
  const creadas: { id: string; userId: string; motivo: string }[] = [];
  if (!seco) {
    for (const a of crear) {
      const s = await tx.sanction.create({
        data: {
          tournamentId: torneo.id,
          userId: a.jugadorId,
          tournamentTeamId: inscripcion.get(a.jugadorId)?.tournamentTeamId ?? null,
          matchId: a.matchId,
          type: "SUSPENSION_PARTIDOS",
          partidos: a.partidos,
          motivo: a.motivo,
          automatica: true,
          status: "ACTIVA",
        },
        select: { id: true, userId: true, motivo: true, partidos: true },
      });
      creadas.push({ id: s.id, userId: a.jugadorId, motivo: a.motivo });
      await tx.auditLog.create({
        data: { actorId, action: "CREATE", entityType: "Sanction", entityId: s.id, after: { motivo: s.motivo, partidos: s.partidos, automatica: true }, motivo: "Sale de la cédula validada" },
      });
    }
    for (const s of sobran) {
      await tx.sanction.update({ where: { id: s.id }, data: { status: "ANULADA" } });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "UPDATE",
          entityType: "Sanction",
          entityId: s.id,
          before: { status: s.status, motivo: s.motivo },
          after: { status: "ANULADA" },
          motivo: "Ya no sale de las cédulas validadas (se validaron partidos fuera de orden) o estaba repetida",
        },
      });
    }
  }

  // Partidos cumplidos: los partidos VALIDADOS de su equipo después del de la sanción
  const orden = new Map(d.partidos.map((p, i) => [p.id, i]));
  const sanciones = seco ? d.sanciones : await tx.sanction.findMany({
    where: { tournamentId: torneo.id, type: "SUSPENSION_PARTIDOS", status: { in: ["ACTIVA", "CUMPLIDA"] } },
    select: { id: true, userId: true, matchId: true, partidos: true, partidosCumplidos: true, status: true, automatica: true, motivo: true },
  });
  const cambios: { id: string; antes: { cumplidos: number; status: string }; despues: { cumplidos: number; status: string } }[] = [];
  for (const s of sanciones) {
    if (!s.matchId || !s.userId || s.partidos == null || !orden.has(s.matchId)) continue;
    const equipo = inscripcion.get(s.userId)?.teamId;
    if (!equipo) continue;
    const delEquipo = d.partidos.filter((p) => p.homeTeamId === equipo || p.awayTeamId === equipo).map((p) => ({ orden: orden.get(p.id)!, status: p.status }));
    const cumplidos = partidosCumplidos({ orden: orden.get(s.matchId)!, partidos: s.partidos }, delEquipo);
    const status = cumplidos >= s.partidos ? "CUMPLIDA" : "ACTIVA";
    if (cumplidos === s.partidosCumplidos && status === s.status) continue;
    cambios.push({ id: s.id, antes: { cumplidos: s.partidosCumplidos, status: s.status }, despues: { cumplidos, status } });
    if (seco) continue;
    await tx.sanction.update({ where: { id: s.id }, data: { partidosCumplidos: cumplidos, status } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "Sanction",
        entityId: s.id,
        before: { partidosCumplidos: s.partidosCumplidos, status: s.status },
        after: { partidosCumplidos: cumplidos, status },
        motivo: `Partidos cumplidos al validar: ${cumplidos} de ${s.partidos}`,
      },
    });
  }
  return {
    creadas: seco ? crear.map((n) => ({ id: "", userId: n.jugadorId, motivo: n.motivo })) : creadas,
    anuladas: sobran.map((s) => s.motivo),
    cambios,
  };
}

const CAMPOS: (keyof EstadisticasDelJugador)[] = [
  "partidos",
  "goles",
  "asistencias",
  "amarillas",
  "rojas",
  "golesRecibidos",
  "vallasInvictas",
  "penalesAtajados",
  "rachaGoles",
  "rachaAsistencia",
];

/**
 * Estadísticas por torneo (`player_tournament_stats`) recalculadas desde lo validado. Solo escribe lo que
 * cambió (los MVP los llevan las votaciones y no se tocan). `userIds`: solo esas personas.
 */
export async function recalcularEstadisticas(tournamentId: string, { userIds, seco = false }: { userIds?: string[]; seco?: boolean } = {}) {
  const [d, inscritos] = await Promise.all([datosParaRecalcular(tournamentId), inscritosDelTorneo(tournamentId)]);
  const jugadores = userIds ? inscritos.filter((i) => userIds.includes(i.userId)) : inscritos;
  const perfiles = new Map((await perfilesDeJugadores(jugadores.map((j) => j.userId))).map((p) => [p.id, p.playerProfile?.posicionPrincipal ?? null]));
  // Portero: su posición principal; si no tiene, la que más jugó
  const masJugada = (userId: string) => {
    const conteo = new Map<string, number>();
    for (const a of d.alineaciones) if (a.userId === userId && (a.jugo ?? a.titular) && a.posicion) conteo.set(a.posicion, (conteo.get(a.posicion) ?? 0) + 1);
    return [...conteo].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
  };
  const stats = estadisticasDelTorneo({
    jugadores: jugadores.map((j) => ({ userId: j.userId, teamId: j.teamId, esPortero: (perfiles.get(j.userId) ?? masJugada(j.userId)) === "POR" })),
    partidos: d.partidos.map((p, i) => ({ ...p, orden: i })),
    alineaciones: d.alineaciones.map((a) => ({ matchId: a.lineup.matchId, userId: a.userId, jugo: a.jugo, titular: a.titular })),
    eventos: d.eventos,
    suspensiones: d.sanciones.flatMap((s) => (s.userId && s.matchId ? [{ userId: s.userId, matchId: s.matchId, partidos: s.partidos ?? 1 }] : [])),
  });
  const actuales = new Map(
    (await db.playerTournamentStat.findMany({ where: { tournamentId, userId: { in: [...stats.keys()] } } })).map((s) => [s.userId, s]),
  );
  const distintos = [...stats].filter(([userId, s]) => {
    const a = actuales.get(userId);
    return !a || CAMPOS.some((c) => a[c] !== s[c]);
  });
  if (!seco)
    for (const [userId, s] of distintos)
      await db.playerTournamentStat.upsert({
        where: { tournamentId_userId: { tournamentId, userId } },
        create: { tournamentId, userId, ...s },
        update: s,
      });
  return { revisados: stats.size, cambiaron: distintos.length, ejemplo: distintos.slice(0, 3).map(([u, s]) => ({ u, s, antes: actuales.get(u) ?? null })) };
}

/** Lo que la tabla necesita de cada partido validado (`calcularTabla` de ligas), en orden y con juego limpio */
export async function partidosParaTabla(tournamentId: string) {
  const d = await datosParaRecalcular(tournamentId);
  return d.partidos.map((p, i) => {
    const limpio = puntosJuegoLimpio(tarjetasDe(d, p.id));
    return {
      localId: p.homeTeamId,
      visitanteId: p.awayTeamId,
      golesLocal: p.homeScore,
      golesVisitante: p.awayScore,
      status: p.status,
      orden: i,
      fase: p.round?.fase ?? "REGULAR",
      jornada: p.round?.numero ?? null,
      juegoLimpio: { local: limpio.get(p.homeTeamId) ?? 0, visitante: limpio.get(p.awayTeamId) ?? 0 },
    };
  });
}

/**
 * A quién avisarle "Aguas: llevas 4 amarillas" (PRD §7.8): los que vieron amarilla en ESTE partido y quedaron
 * a una de la suspensión (con el acumulado, no con el total del torneo).
 */
export async function alertasDeAmarillas(matchId: string) {
  const m = await db.match.findUnique({
    where: { id: matchId },
    select: { tournament: { select: { id: true, partidosPorRoja: true, amarillasParaSuspension: true } } },
  });
  const t = m?.tournament;
  if (!t || t.amarillasParaSuspension < 2) return [];
  const d = await datosParaRecalcular(t.id);
  const acumulado = amarillasAcumuladas(paraSanciones(d), t);
  const conAmarilla = new Set(d.eventos.filter((e) => e.matchId === matchId && e.type === "AMARILLA" && e.playerId).map((e) => e.playerId!));
  return [...conAmarilla]
    .filter((u) => acumulado.get(u) === t.amarillasParaSuspension - 1)
    .map((userId) => ({ userId, acumuladas: t.amarillasParaSuspension - 1 }));
}

/** Las sanciones automáticas que salieron de ESTE partido (aviso "te toca sentarte") */
export function sancionesDelPartido(matchId: string) {
  return db.sanction.findMany({
    where: { matchId, automatica: true, status: "ACTIVA" },
    select: { userId: true, partidos: true, motivo: true },
  });
}

/** Sanciones del torneo en su propia transacción (el job `recalcular-torneo`); `seco` solo cuenta */
export function recalcularSancionesDelTorneo(
  torneo: { id: string; partidosPorRoja: number; amarillasParaSuspension: number },
  { seco = false } = {},
) {
  if (seco) return recalcularSanciones(db, torneo, null, { seco });
  return db.$transaction((tx) => recalcularSanciones(tx, torneo, null), { timeout: 30_000, maxWait: 10_000 });
}
