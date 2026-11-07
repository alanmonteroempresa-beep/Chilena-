import "server-only";
import { db } from "@/shared/lib/db";
import { puntosDelPronostico } from "./services/quiniela";

/**
 * Califica la quiniela de un partido VALIDADO (escucha `match.validated`, regla 2): 3 por el marcador, 1 por
 * el ganador. Idempotente: solo escribe lo que cambió.
 */
export async function calificarQuiniela(matchId: string) {
  const m = await db.match.findFirst({ where: { id: matchId, status: "VALIDADO" }, select: { homeScore: true, awayScore: true } });
  if (!m || m.homeScore == null || m.awayScore == null) return { calificados: 0 };
  const oficial = { local: m.homeScore, visita: m.awayScore };
  const pronosticos = await db.prediction.findMany({ where: { matchId }, select: { id: true, homeGoals: true, awayGoals: true, points: true } });
  let calificados = 0;
  for (const p of pronosticos) {
    const puntos = puntosDelPronostico({ local: p.homeGoals, visita: p.awayGoals }, oficial);
    if (p.points === puntos) continue;
    await db.prediction.update({ where: { id: p.id }, data: { points: puntos } });
    calificados++;
  }
  return { calificados, pronosticos: pronosticos.length };
}

/**
 * El partido de prueba vuelve a "sin jugar" (`/api/cron/reiniciar-prueba`): se borran su votación del MVP
 * (con sus votos) y los pronósticos de su quiniela, como si nunca se hubiera abierto.
 */
export async function reiniciarVotacionesDelPartido(matchId: string) {
  const [polls, pronosticos] = await db.$transaction([
    db.poll.deleteMany({ where: { matchId } }),
    db.prediction.deleteMany({ where: { matchId } }),
  ]);
  return { votaciones: polls.count, pronosticos: pronosticos.count };
}
