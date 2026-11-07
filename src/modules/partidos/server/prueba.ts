import "server-only";
import { fromZonedTime } from "date-fns-tz";
import type { Prisma } from "@/generated/prisma/client";
import { TZ } from "@/shared/lib/dates";
import { db } from "@/shared/lib/db";
import { recalcularEstadisticas, recalcularSanciones } from "./recalcular";

/** El partido de prueba de la semilla demo (J16 · Dep. Portales vs Tigres del Llano, Liga Dominical Iztapalapa) */
const PRUEBA = { liga: "dominical-iztapalapa", jornada: 16, local: "dep-portales", visita: "tigres-del-llano" };

/**
 * Regresa el partido de prueba a "sin jugar": borra su cédula, correcciones, eventos, alineaciones, marcador
 * en vivo y las sanciones automáticas que salieron de él (con bitácora), lo deja PROGRAMADO y recalcula los
 * partidos cumplidos y las estadísticas. La tabla, el pase de lista, el feed y las cartas los recalcula quien
 * llama (cada módulo lo suyo). Solo toca ese partido de la liga demo y de un torneo vigente.
 * `todo`: además, el partido hoy a las `hora` (CDMX, 20:00 por defecto); si esa hora ya pasó, mañana (así la
 * quiniela sigue abierta).
 */
export async function reiniciarPartidoDePrueba({ todo = false, hora = "20:00" }: { todo?: boolean; hora?: string } = {}) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new Error("La hora va como 20:00");
  const m = await db.match.findFirst({
    where: {
      round: { numero: PRUEBA.jornada },
      homeTeam: { slug: PRUEBA.local },
      awayTeam: { slug: PRUEBA.visita },
      tournament: { league: { slug: PRUEBA.liga }, status: { in: ["EN_CURSO", "LIGUILLA"] } },
    },
    select: {
      id: true,
      status: true,
      validatedAt: true,
      tournament: { select: { id: true, partidosPorRoja: true, amarillasParaSuspension: true } },
    },
  });
  if (!m) throw new Error("No encontré la J16 Portales vs Tigres de la liga demo en un torneo vigente (¿cargaste la semilla demo?)");
  const ahora = new Date();
  const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  let cuando = fromZonedTime(`${dia(ahora)}T${hora}:00`, TZ);
  if (cuando.getTime() <= ahora.getTime() + 10 * 60_000) cuando = fromZonedTime(`${dia(new Date(ahora.getTime() + 86_400_000))}T${hora}:00`, TZ);

  await db.$transaction(
    async (tx) => {
      // Las automáticas de este partido se borran; si la liga ya le puso multa (tiene cargo), se quedan
      const sanciones = await tx.sanction.findMany({
        where: { matchId: m.id, automatica: true, cargo: null },
        select: { id: true, motivo: true, userId: true, status: true },
      });
      for (const s of sanciones)
        await tx.auditLog.create({
          data: { action: "DELETE", entityType: "Sanction", entityId: s.id, before: s as Prisma.InputJsonValue, motivo: "Reinicio del partido de prueba" },
        });
      await tx.sanction.deleteMany({ where: { id: { in: sanciones.map((s) => s.id) } } });
      await tx.matchReport.deleteMany({ where: { matchId: m.id } });
      await tx.matchEvent.deleteMany({ where: { matchId: m.id } });
      await tx.lineup.deleteMany({ where: { matchId: m.id } });
      await tx.liveScoreUpdate.deleteMany({ where: { matchId: m.id } });
      await tx.match.update({
        where: { id: m.id },
        data: {
          status: "PROGRAMADO",
          homeScore: null,
          awayScore: null,
          homePenalties: null,
          awayPenalties: null,
          winnerTeamId: null,
          liveHomeScore: 0,
          liveAwayScore: 0,
          liveMinute: null,
          liveUpdatedAt: null,
          startedAt: null,
          endedAt: null,
          validatedAt: null,
          validatedById: null,
          ...(todo ? { scheduledAt: cuando } : {}),
        },
      });
      await tx.auditLog.create({
        data: { action: "UPDATE", entityType: "Match", entityId: m.id, before: { status: m.status }, after: { status: "PROGRAMADO", todo }, motivo: "Reinicio del partido de prueba" },
      });
      if (m.tournament) await recalcularSanciones(tx, m.tournament, null);
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
  if (m.tournament) await recalcularEstadisticas(m.tournament.id);
  return {
    matchId: m.id,
    tournamentId: m.tournament?.id ?? null,
    estaba: m.status,
    validadoEn: m.validatedAt,
    cuando: todo ? `${dia(cuando)} a las ${hora}` : null,
  };
}
