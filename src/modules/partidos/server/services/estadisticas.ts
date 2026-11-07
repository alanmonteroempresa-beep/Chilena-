/**
 * Estadísticas por torneo (`player_tournament_stats`) recalculadas desde lo VALIDADO (regla 2):
 * partidos jugados, goles, asistencias, tarjetas (la doble amarilla es 1 roja, PRD §7.8), lo del portero y
 * las rachas. Servicio puro: sin base de datos ni Next. Recalcular da siempre lo mismo (idempotente), así
 * validar un partido o regresarlo a "sin jugar" deja las cuentas bien.
 */
import { rachaAsistencia } from "./asistencia";
import { conteoDeTarjetas, type TarjetaCedula } from "./tarjetas";

export type PartidoParaEstadisticas = {
  id: string;
  /** Orden cronológico en el torneo */
  orden: number;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
};
export type AlineacionParaEstadisticas = { matchId: string; userId: string; jugo: boolean | null; titular: boolean };
export type EventoParaEstadisticas = {
  matchId: string;
  type: string;
  minute: number | null;
  teamId: string | null;
  playerId: string | null;
  assistPlayerId: string | null;
};
/** Sanción que cumple después del partido en que la recibió (pausa "domingos sin faltar") */
export type SuspensionParaEstadisticas = { userId: string; matchId: string; partidos: number };

export type EstadisticasDelJugador = {
  partidos: number;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  golesRecibidos: number;
  vallasInvictas: number;
  penalesAtajados: number;
  rachaGoles: number;
  rachaAsistencia: number;
};

export function estadisticasDelTorneo(entrada: {
  /** Cada persona con el equipo con el que está inscrita en el torneo */
  jugadores: { userId: string; teamId: string; esPortero: boolean }[];
  partidos: PartidoParaEstadisticas[];
  alineaciones: AlineacionParaEstadisticas[];
  eventos: EventoParaEstadisticas[];
  suspensiones: SuspensionParaEstadisticas[];
}): Map<string, EstadisticasDelJugador> {
  const validados = entrada.partidos.filter((p) => p.status === "VALIDADO").sort((a, b) => a.orden - b.orden);
  const alineacion = new Map(entrada.alineaciones.map((a) => [`${a.matchId}:${a.userId}`, a]));
  const resultado = new Map<string, EstadisticasDelJugador>();

  for (const j of entrada.jugadores) {
    const delEquipo = validados.filter((p) => p.homeTeamId === j.teamId || p.awayTeamId === j.teamId);
    const jugo = (p: PartidoParaEstadisticas) => {
      const a = alineacion.get(`${p.id}:${j.userId}`);
      // Lo marca el árbitro; si la cédula no lo trae, el titular jugó
      return a ? (a.jugo ?? a.titular) : false;
    };
    const suyos = delEquipo.filter(jugo);
    const eventosDe = (p: PartidoParaEstadisticas) => entrada.eventos.filter((e) => e.matchId === p.id);
    const cuenta = (tipo: string) =>
      validados.reduce((s, p) => s + eventosDe(p).filter((e) => e.type === tipo && e.playerId === j.userId).length, 0);
    const tarjetas: TarjetaCedula[][] = validados.map((p) =>
      eventosDe(p)
        .filter((e) => (e.type === "AMARILLA" || e.type === "ROJA") && e.playerId === j.userId)
        .map((e) => ({ jugadorId: j.userId, equipoId: e.teamId ?? j.teamId, tipo: e.type as "AMARILLA" | "ROJA", minuto: e.minute })),
    );
    const conteo = conteoDeTarjetas(tarjetas).get(j.userId);

    // Racha de goles: partidos JUGADOS seguidos anotando, del más reciente hacia atrás
    let rachaGoles = 0;
    for (const p of [...suyos].reverse()) {
      if (!eventosDe(p).some((e) => e.type === "GOL" && e.playerId === j.userId)) break;
      rachaGoles++;
    }
    // "Domingos sin faltar" (PRD §7.6): está en la alineación, titular o banca; cumplir una sanción pausa
    const cumpliendo = new Set<string>();
    for (const s of entrada.suspensiones.filter((x) => x.userId === j.userId)) {
      const i = delEquipo.findIndex((p) => p.id === s.matchId);
      if (i < 0) continue;
      delEquipo
        .slice(i + 1)
        .filter((p) => !alineacion.has(`${p.id}:${j.userId}`))
        .slice(0, s.partidos)
        .forEach((p) => cumpliendo.add(p.id));
    }
    const domingos = rachaAsistencia(
      delEquipo.map((p) => ({
        orden: p.orden,
        status: p.status,
        enAlineacion: alineacion.has(`${p.id}:${j.userId}`),
        suspendido: cumpliendo.has(p.id),
      })),
    );
    // Lo del portero: goles que le hicieron en los partidos que jugó
    const recibidos = j.esPortero ? suyos.map((p) => (p.homeTeamId === j.teamId ? p.awayScore : p.homeScore) ?? 0) : [];

    resultado.set(j.userId, {
      partidos: suyos.length,
      goles: cuenta("GOL"),
      asistencias: validados.reduce((s, p) => s + eventosDe(p).filter((e) => e.type === "GOL" && e.assistPlayerId === j.userId).length, 0),
      amarillas: conteo?.amarillas ?? 0,
      rojas: conteo?.rojas ?? 0,
      golesRecibidos: recibidos.reduce((s, g) => s + g, 0),
      vallasInvictas: recibidos.filter((g) => g === 0).length,
      penalesAtajados: cuenta("PENAL_ATAJADO"),
      rachaGoles,
      rachaAsistencia: domingos,
    });
  }
  return resultado;
}
