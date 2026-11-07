import "server-only";
import { partidosParaTabla } from "@/modules/partidos/server-api";
import { db } from "@/shared/lib/db";
import { calcularTabla } from "./services/tabla";

/**
 * La tabla GUARDADA (`standings`) recalculada desde los partidos validados (PRD §7.13, regla 2). La
 * posición anterior es la de antes de la última jornada validada ("subimos al 2º"). Respeta el sorteo de la
 * liga (`ordenManual`) mientras siga vigente. Recalcular da siempre lo mismo.
 */
export async function recalcularTabla(tournamentId: string, { seco = false } = {}) {
  const [torneo, partidos, filas] = await Promise.all([
    db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        puntosVictoria: true,
        puntosEmpate: true,
        teams: { where: { status: "ACEPTADA" }, select: { id: true, teamId: true, team: { select: { nombre: true } } } },
      },
    }),
    partidosParaTabla(tournamentId),
    db.standingRow.findMany({ where: { tournamentId } }),
  ]);
  if (!torneo) return { cambiaron: 0 };
  const inscripcion = new Map(torneo.teams.map((t) => [t.teamId, t.id]));
  const fila = new Map(filas.map((f) => [f.tournamentTeamId, f]));
  const equipos = torneo.teams.map((t) => ({ id: t.teamId, nombre: t.team.nombre, ordenManual: fila.get(t.id)?.ordenManual ?? null }));
  const reglas = { puntosVictoria: torneo.puntosVictoria, puntosEmpate: torneo.puntosEmpate };
  const ultima = Math.max(0, ...partidos.filter((p) => (p.fase ?? "REGULAR") === "REGULAR").map((p) => p.jornada ?? 0));
  const tabla = calcularTabla({ equipos, partidos, reglas });
  const anterior = calcularTabla({ equipos, partidos: partidos.filter((p) => (p.jornada ?? 0) < ultima), reglas });

  let cambiaron = 0;
  for (const f of tabla) {
    const tournamentTeamId = inscripcion.get(f.equipoId)!;
    const datos = {
      pj: f.pj,
      pg: f.pg,
      pe: f.pe,
      pp: f.pp,
      gf: f.gf,
      gc: f.gc,
      dg: f.dg,
      pts: f.pts,
      posicion: f.posicion,
      posicionAnterior: anterior.find((a) => a.equipoId === f.equipoId)?.posicion ?? null,
      ordenManual: f.ordenManual,
      racha: f.racha,
    };
    const a = fila.get(tournamentTeamId);
    if (a && (Object.keys(datos) as (keyof typeof datos)[]).every((k) => a[k] === datos[k])) continue;
    cambiaron++;
    if (!seco)
      await db.standingRow.upsert({
        where: { tournamentTeamId },
        create: { tournamentTeamId, tournamentId, ...datos },
        update: datos,
      });
  }
  return { cambiaron, equipos: tabla.length };
}
