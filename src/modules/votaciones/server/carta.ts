import "server-only";
import { db } from "@/shared/lib/db";

/**
 * Lo que la carta necesita de las votaciones cerradas donde estas personas fueron candidatas (CRK y las
 * insignias votadas, CARTA §1 y §4): tipo, partido, total, el ganador y los votos de cada candidato.
 */
export async function votosParaLasCartas(userIds: string[]) {
  if (!userIds.length) return [];
  const polls = await db.poll.findMany({
    where: { status: "CERRADA", options: { some: { userId: { in: userIds } } } },
    select: { type: true, matchId: true, votesCount: true, winnerOptionId: true, options: { select: { id: true, userId: true, votesCount: true } } },
  });
  return polls.map((p) => ({
    tipo: p.type as string,
    matchId: p.matchId ?? "",
    total: p.votesCount,
    ganadorUserId: p.options.find((o) => o.id === p.winnerOptionId)?.userId ?? null,
    votosDe: new Map(p.options.filter((o) => o.userId).map((o) => [o.userId!, o.votesCount])),
  }));
}
export type VotacionParaLaCarta = Awaited<ReturnType<typeof votosParaLasCartas>>[number];
