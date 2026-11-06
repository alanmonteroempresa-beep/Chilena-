import "server-only";
import { diaDeLaJornada, horaCDMX } from "@/modules/partidos";
import {
  cedulasPorRevisar,
  jornadaQueViene,
  partidosDeLaJornada,
  sancionesActivas,
} from "@/modules/partidos/server-api";
import { hoyCDMX, mesCDMX } from "@/shared/lib/dates";
import { nombreCorto } from "@/shared/lib/personas";
import { cargosDelTorneo, tablaDelTorneo, torneoVigenteDeLaLiga } from "./queries";
import { cobradoDelPeriodo, estaVencido, pendientesDeLaLiga } from "./services/resumen";

/** Datos del Resumen del panel de la liga para su inicio (pantalla 18). Solo lectura. */
export async function datosInicioLiga(slugLiga: string, ahora: Date, reportesAbiertos: number) {
  const torneo = await torneoVigenteDeLaLiga(slugLiga);
  if (!torneo) return null;
  const [jornada, cedulas, cargos, sanciones, tabla] = await Promise.all([
    jornadaQueViene(torneo.id),
    cedulasPorRevisar(torneo.id),
    cargosDelTorneo(torneo.id),
    sancionesActivas(torneo.id),
    tablaDelTorneo(torneo.id),
  ]);
  const partidos = jornada != null ? await partidosDeLaJornada(torneo.id, jornada) : [];
  const hoy = hoyCDMX(ahora);
  const mes = mesCDMX(ahora);
  const sinArbitro = partidos.filter((p) => !p.referee);

  // Equipos y pagos (pantalla 18): lo pendiente de cada equipo y si algo ya venció
  const porEquipo = new Map<string, { pendienteCents: number; vencido: boolean }>();
  for (const c of cargos) {
    if (c.status !== "PENDIENTE" && c.status !== "REPORTADO") continue;
    const e = porEquipo.get(c.tournamentTeam.team.id) ?? { pendienteCents: 0, vencido: false };
    e.pendienteCents += c.amountCents;
    e.vencido ||= estaVencido(c, hoy);
    porEquipo.set(c.tournamentTeam.team.id, e);
  }

  return {
    torneo: { nombre: torneo.nombre, liga: torneo.league },
    jornada,
    diaJornada: partidos[0]?.scheduledAt ? diaDeLaJornada(partidos[0].scheduledAt) : null,
    pendientes: pendientesDeLaLiga({
      cedulas: cedulas.map((c) => ({
        local: nombreCorto(c.match.homeTeam.nombre),
        visita: nombreCorto(c.match.awayTeam.nombre),
        correccion: c.status === "EN_CORRECCION",
      })),
      reportesAbiertos,
      sinArbitro: sinArbitro.map((p) => ({
        local: nombreCorto(p.homeTeam.nombre),
        visita: nombreCorto(p.awayTeam.nombre),
        hora: p.scheduledAt ? horaCDMX(p.scheduledAt) : "",
      })),
      equiposConPagosVencidos: cargos
        .filter((c) => estaVencido(c, hoy))
        .map((c) => nombreCorto(c.tournamentTeam.team.nombre)),
    }),
    cobrado: { ...cobradoDelPeriodo(cargos, mes.desde, mes.hasta), mes: mes.nombre },
    partidos,
    sinArbitro: sinArbitro.length,
    cedulasPorRevisar: cedulas.length,
    sancionesActivas: sanciones.length,
    equipos: tabla.map((f) => ({
      equipo: f.tournamentTeam.team,
      ...(porEquipo.get(f.tournamentTeam.team.id) ?? { pendienteCents: 0, vencido: false }),
    })),
  };
}
