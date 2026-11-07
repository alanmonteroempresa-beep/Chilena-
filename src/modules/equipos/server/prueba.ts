import "server-only";
import { db } from "@/shared/lib/db";

/**
 * El pase de lista del partido de prueba en blanco (todos CONVOCADOS y sin link de WhatsApp). Lo usa
 * `/api/cron/reiniciar-prueba?todo=1` después de que `partidos` regresa el partido a "sin jugar".
 */
export async function reiniciarPaseDeLista(matchId: string) {
  const [respuestas, links] = await db.$transaction([
    db.matchAttendance.updateMany({ where: { matchId }, data: { status: "CONVOCADO", respondedAt: null, nota: null } }),
    db.attendanceLink.deleteMany({ where: { matchId } }),
  ]);
  return { respuestas: respuestas.count, links: links.count };
}
