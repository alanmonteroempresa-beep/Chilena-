import "server-only";
import { confirmadosDelPartido } from "@/modules/equipos/server-api";
import { horaCDMX } from "@/modules/partidos";
import { partidosPorEmpezar } from "@/modules/partidos/server-api";
import { db } from "@/shared/lib/db";
import { nombreCorto } from "@/shared/lib/personas";
import { notificar } from "./notificar";

/** "Te toca jugar" sale 1 h antes del partido (docs/NOTIFICACIONES.md §2) */
export const ANTES_DEL_PARTIDO_MS = 60 * 60_000;

/**
 * Recordatorio del partido (`RECORDATORIO_PARTIDO`, push ★): a los que dijeron "Voy" y al árbitro, una hora
 * antes. Corre cada minuto con la cola (`/api/cron/trabajos`); cada quien recibe uno por partido.
 */
export async function mandarRecordatorios(ahora = new Date()) {
  const partidos = await partidosPorEmpezar(ahora, new Date(ahora.getTime() + ANTES_DEL_PARTIDO_MS));
  let avisos = 0;
  for (const p of partidos) {
    if (!p.scheduledAt) continue;
    const ya = new Set(
      (
        await db.notification.findMany({
          where: { type: "RECORDATORIO_PARTIDO", data: { path: ["matchId"], equals: p.id } },
          select: { userId: true },
        })
      ).map((n) => n.userId),
    );
    const partido = `${nombreCorto(p.homeTeam.nombre)} vs ${nombreCorto(p.awayTeam.nombre)} a las ${horaCDMX(p.scheduledAt)}`;
    const cancha = [p.field?.nombre, p.field?.venue.nombre].filter(Boolean).join(" · ") || null;
    const van = (await confirmadosDelPartido(p.id)).map((c) => c.userId).filter((u) => !ya.has(u));
    avisos += await notificar({
      userIds: van,
      type: "RECORDATORIO_PARTIDO",
      title: `Te toca jugar: ${partido}`,
      body: cancha,
      href: `/partido/${p.id}`,
      data: { matchId: p.id },
    });
    if (p.refereeId && !ya.has(p.refereeId) && !van.includes(p.refereeId))
      avisos += await notificar({
        userIds: [p.refereeId],
        type: "RECORDATORIO_PARTIDO",
        title: `Te toca pitar: ${partido}`,
        body: cancha,
        href: "/arbitro/hoy",
        data: { matchId: p.id },
      });
  }
  return { partidos: partidos.length, avisos };
}

/** El partido de prueba vuelve a "sin jugar": su recordatorio puede volver a salir */
export async function olvidarRecordatorios(matchId: string) {
  const r = await db.notification.deleteMany({ where: { type: "RECORDATORIO_PARTIDO", data: { path: ["matchId"], equals: matchId } } });
  return r.count;
}
