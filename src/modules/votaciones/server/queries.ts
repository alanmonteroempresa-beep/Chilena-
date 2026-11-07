import "server-only";
import { publicUserSelect } from "@/modules/core";
import { db } from "@/shared/lib/db";

const equipoSelect = { id: true, slug: true, nombre: true, siglas: true, colorPrimario: true, colorSecundario: true } as const;

/**
 * Las votaciones del MVP para la pantalla 12: las abiertas y las de la última jornada que tuvo votación,
 * con sus candidatos (datos públicos, regla 8) y el voto de quien mira.
 */
export async function votacionesDelMvp(tournamentId: string, yo: string | null) {
  const ultima = await db.poll.findFirst({
    where: { tournamentId, type: "MVP_PARTIDO" },
    orderBy: { createdAt: "desc" },
    select: { roundId: true },
  });
  if (!ultima) return [];
  return db.poll.findMany({
    where: { tournamentId, type: "MVP_PARTIDO", OR: [{ status: "ABIERTA" }, { roundId: ultima.roundId }] },
    orderBy: [{ closesAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      status: true,
      titulo: true,
      closesAt: true,
      votesCount: true,
      winnerOptionId: true,
      round: { select: { numero: true } },
      match: {
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: equipoSelect },
          awayTeam: { select: equipoSelect },
        },
      },
      options: { select: { id: true, userId: true, etiqueta: true, votesCount: true, user: { select: publicUserSelect } } },
      votes: { where: { voterId: yo ?? "00000000-0000-0000-0000-000000000000" }, select: { optionId: true } },
    },
  });
}
export type VotacionDelMvp = Awaited<ReturnType<typeof votacionesDelMvp>>[number];

/** Una votación para votar (la acción): estado, cierre y a quién se vota */
export function opcionParaVotar(pollId: string, optionId: string) {
  return db.pollOption.findFirst({
    where: { id: optionId, pollId },
    select: { id: true, userId: true, poll: { select: { id: true, status: true, closesAt: true, matchId: true, leagueId: true } } },
  });
}

/** Mis pronósticos de unos partidos */
export function misPronosticos(userId: string, matchIds: string[]) {
  return db.prediction.findMany({ where: { userId, matchId: { in: matchIds } }, select: { matchId: true, homeGoals: true, awayGoals: true, points: true } });
}

/** Todos los pronósticos de un partido ("Lo que dice la porra") */
export function pronosticosDelPartido(matchId: string) {
  return db.prediction.findMany({ where: { matchId }, select: { homeGoals: true, awayGoals: true } });
}

/** Puntos y exactos de cada quien en el torneo (solo partidos calificados: VALIDADOS, regla 2) */
export async function puntosDeLaQuiniela(tournamentId: string) {
  const where = { match: { tournamentId, status: "VALIDADO" as const }, points: { not: null } };
  const [puntos, exactos] = await Promise.all([
    db.prediction.groupBy({ by: ["userId"], where, _sum: { points: true } }),
    db.prediction.groupBy({ by: ["userId"], where: { ...where, points: 3 }, _count: { _all: true } }),
  ]);
  return puntos.map((p) => ({
    userId: p.userId,
    puntos: p._sum.points ?? 0,
    exactos: exactos.find((e) => e.userId === p.userId)?._count._all ?? 0,
  }));
}

/** ¿Cuenta reclamada y activa? (votar y pronosticar, PERMISOS §2) */
export async function cuentaReclamada(userId: string) {
  return (await db.user.count({ where: { id: userId, deletedAt: null, authId: { not: null } } })) > 0;
}
