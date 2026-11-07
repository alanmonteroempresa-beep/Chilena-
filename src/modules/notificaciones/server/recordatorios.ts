import "server-only";
import { confirmadosDelPartido } from "@/modules/equipos/server-api";
import { horaCDMX } from "@/modules/partidos";
import { partidosPorEmpezar } from "@/modules/partidos/server-api";
import { apartarUnaVez, soltarUnaVez } from "@/modules/plataforma/server-api";
import { db } from "@/shared/lib/db";
import { nombreCorto } from "@/shared/lib/personas";
import { notificar } from "./notificar";
import { ANTES_DEL_PARTIDO_MS, claveDeRecordatorio, prefijoDeRecordatorio, quienesRecordar } from "./services/recordatorios";

/**
 * Recordatorio del partido (`RECORDATORIO_PARTIDO`, push ★): "Te toca jugar" a los que dijeron "Voy" y
 * "Te toca pitar" al árbitro que aceptó, una hora antes. Corre cada minuto (`/api/cron/trabajos`): quien
 * confirme tarde lo recibe en la siguiente vuelta. Cada persona se aparta su clave en la cola antes de
 * avisarle, así dos vueltas a la vez nunca mandan dos.
 */
export async function mandarRecordatorios(ahora = new Date()) {
  const partidos = await partidosPorEmpezar(ahora, new Date(ahora.getTime() + ANTES_DEL_PARTIDO_MS));
  let avisos = 0;
  for (const p of partidos) {
    const inicio = p.scheduledAt;
    if (!inicio) continue;
    const { jugadores, arbitro } = quienesRecordar({
      confirmados: (await confirmadosDelPartido(p.id)).map((c) => c.userId),
      arbitro: p.refereeId ? { id: p.refereeId, aceptado: p.refereeStatus === "ACEPTADO" } : null,
    });
    const todos = [...jugadores, ...(arbitro ? [arbitro] : [])];
    const apartadas = new Set(await apartarUnaVez(todos.map((u) => claveDeRecordatorio(p.id, inicio, u))));
    const nuevos = (u: string) => apartadas.has(claveDeRecordatorio(p.id, inicio, u));
    const partido = `${nombreCorto(p.homeTeam.nombre)} vs ${nombreCorto(p.awayTeam.nombre)} a las ${horaCDMX(inicio)}`;
    const cancha = [p.field?.nombre, p.field?.venue.nombre].filter(Boolean).join(" · ") || null;
    const comun = { type: "RECORDATORIO_PARTIDO" as const, body: cancha, data: { matchId: p.id }, partidoEn: inicio };
    avisos += await notificar({ ...comun, userIds: jugadores.filter(nuevos), title: `Te toca jugar: ${partido}`, href: `/partido/${p.id}` });
    if (arbitro && nuevos(arbitro)) avisos += await notificar({ ...comun, userIds: [arbitro], title: `Te toca pitar: ${partido}`, href: "/arbitro/hoy" });
  }
  return { partidos: partidos.length, avisos };
}

/** El partido de prueba vuelve a "sin jugar": su recordatorio puede volver a salir */
export async function olvidarRecordatorios(matchId: string) {
  const [claves, avisos] = await Promise.all([
    soltarUnaVez(prefijoDeRecordatorio(matchId)),
    db.notification.deleteMany({ where: { type: "RECORDATORIO_PARTIDO", data: { path: ["matchId"], equals: matchId } } }),
  ]);
  return { claves, avisos: avisos.count };
}
