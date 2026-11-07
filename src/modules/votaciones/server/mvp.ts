import "server-only";
import { personasPorId } from "@/modules/core/server-api";
import { participacionDelPartido } from "@/modules/partidos/server-api";
import { enqueueJob } from "@/modules/plataforma/server-api";
import { emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cierreDelMvp, detalleDelCandidato, ganadorDelMvp, ordenarCandidatos, type JugadorDelPartido } from "./services/mvp";

/**
 * Abre la votación del MVP de un partido validado (escucha `match.validated`). Candidatos: los que jugaron,
 * de los dos equipos, con su renglón de la cédula. Idempotente: si ya existe, no hace nada. Programa su
 * cierre en la cola (`votacion.cerrar`, que corre pg_cron cada minuto).
 */
export async function abrirMvp(matchId: string) {
  const ya = await db.poll.findFirst({ where: { matchId, type: "MVP_PARTIDO" }, select: { id: true } });
  if (ya) return null;
  const p = await participacionDelPartido(matchId);
  if (!p || !p.validatedAt || !p.jugaron.length) return null;
  const personas = new Map((await personasPorId(p.jugaron.map((j) => j.userId))).map((x) => [x.id, x]));
  const equipo = (teamId: string) => (teamId === p.homeTeam.id ? p.homeTeam : p.awayTeam);
  const jugadores: (JugadorDelPartido & { teamId: string })[] = p.jugaron.map((j) => {
    const rival = j.teamId === p.homeTeam.id ? p.awayScore : p.homeScore;
    return {
      userId: j.userId,
      teamId: j.teamId,
      nombre: personas.get(j.userId) ? nombreVisible(personas.get(j.userId)!) : "Jugador",
      equipo: nombreCorto(equipo(j.teamId).nombre),
      goles: p.eventos.filter((e) => e.type === "GOL" && e.playerId === j.userId).map((e) => ({ minuto: e.minute, tipoGol: e.tipoGol })),
      asistencias: p.eventos.filter((e) => e.type === "GOL" && e.assistPlayerId === j.userId).length,
      esPortero: j.posicion === "POR",
      golesRecibidos: rival ?? 0,
      penalesAtajados: p.eventos.filter((e) => e.type === "PENAL_ATAJADO" && e.playerId === j.userId).length,
    };
  });
  const closesAt = cierreDelMvp(p.validatedAt);
  const marcador = `${nombreCorto(p.homeTeam.nombre)} ${p.homeScore ?? 0}–${p.awayScore ?? 0} ${nombreCorto(p.awayTeam.nombre)}`;
  const poll = await db.poll.create({
    data: {
      type: "MVP_PARTIDO",
      titulo: `${marcador} · ¿quién fue el mejor?`,
      leagueId: p.leagueId,
      tournamentId: p.tournamentId,
      roundId: p.roundId,
      matchId,
      closesAt,
      options: {
        create: ordenarCandidatos(jugadores).map((j) => ({ userId: j.userId, etiqueta: detalleDelCandidato(j) })),
      },
    },
    select: { id: true },
  });
  await enqueueJob("votacion.cerrar", { pollId: poll.id }, { dedupeKey: `votacion.cerrar:${poll.id}`, runAt: closesAt });
  await emit("poll.opened", { pollId: poll.id, type: "MVP_PARTIDO", matchId, closesAt: closesAt.toISOString() });
  return { pollId: poll.id, candidatos: jugadores.length, closesAt };
}

/**
 * Cierra una votación vencida: el ganador (el de más votos; si empatan, el que llegó primero) y `poll.closed`.
 * Idempotente y con candado: si ya cerró o aún no vence, no hace nada.
 */
export async function cerrarVotacion(pollId: string, ahora = new Date()) {
  const r = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "polls" WHERE "id" = ${pollId}::uuid FOR UPDATE`;
    const poll = await tx.poll.findUnique({
      where: { id: pollId },
      select: { id: true, type: true, status: true, closesAt: true, matchId: true, options: { select: { id: true, userId: true, votesCount: true } } },
    });
    if (!poll || poll.status !== "ABIERTA" || poll.closesAt > ahora) return null;
    const ultimos = await tx.pollVote.groupBy({ by: ["optionId"], where: { pollId }, _max: { createdAt: true } });
    const ganador = ganadorDelMvp(
      poll.options.map((o) => ({ id: o.id, votos: o.votesCount, ultimoVotoEn: ultimos.find((u) => u.optionId === o.id)?._max.createdAt ?? null })),
    );
    await tx.poll.update({ where: { id: pollId }, data: { status: "CERRADA", winnerOptionId: ganador } });
    return { poll, ganador, winnerUserId: poll.options.find((o) => o.id === ganador)?.userId ?? null };
  });
  if (!r) return null;
  await emit("poll.closed", { pollId, winnerOptionId: r.ganador, type: r.poll.type, matchId: r.poll.matchId, winnerUserId: r.winnerUserId });
  logger.info("votación cerrada", { pollId, ganador: r.ganador });
  return r;
}

/** Red de seguridad: cierra las votaciones vencidas que la cola no cerró (job `votaciones`) */
export async function cerrarVencidas(ahora = new Date()) {
  const vencidas = await db.poll.findMany({ where: { status: "ABIERTA", closesAt: { lte: ahora } }, select: { id: true } });
  let cerradas = 0;
  for (const v of vencidas) if (await cerrarVotacion(v.id, ahora)) cerradas++;
  return { vencidas: vencidas.length, cerradas };
}
