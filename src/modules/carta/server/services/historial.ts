/**
 * Arma el historial VALIDADO de cada persona (carta e insignias) con las filas que da `partidos`.
 * Servicio puro: sin base de datos ni Next.
 */
import { conteoDeTarjetas, type TarjetaCedula } from "@/modules/partidos";
import type { PartidoHistorial } from "../badges";
import { VENTANA_PARTIDOS, type Ventana } from "../formula";

type Plantilla = { userId: string; tournamentId: string; teamId: string };
type Filas = {
  partidos: {
    id: string;
    tournamentId: string | null;
    scheduledAt: Date | null;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }[];
  alineaciones: { userId: string; jugo: boolean | null; titular: boolean; posicion: string | null; lineup: { matchId: string; teamId: string } }[];
  eventos: {
    matchId: string;
    type: string;
    minute: number | null;
    tipoGol: string | null;
    teamId: string | null;
    playerId: string | null;
    assistPlayerId: string | null;
  }[];
  suspensiones: { userId: string | null; matchId: string | null; partidos: number | null }[];
};

export type PartidoDelJugador = PartidoHistorial & { asistencias: number; tarjetas: TarjetaCedula[] };

/** Partidos de cada persona en orden, con lo suyo en cada uno */
export function armarHistoriales(plantillas: Plantilla[], filas: Filas): Map<string, PartidoDelJugador[]> {
  const historiales = new Map<string, PartidoDelJugador[]>();
  const alineacion = new Map(filas.alineaciones.map((a) => [`${a.lineup.matchId}:${a.userId}`, a]));

  for (const userId of new Set(plantillas.map((p) => p.userId))) {
    const suyas = plantillas.filter((p) => p.userId === userId);
    const partidos = filas.partidos
      .map((m): PartidoDelJugador | null => {
        const plantilla = suyas.find(
          (p) => p.tournamentId === m.tournamentId && (p.teamId === m.homeTeamId || p.teamId === m.awayTeamId),
        );
        if (!plantilla) return null;
        const a = alineacion.get(`${m.id}:${userId}`);
        const eventos = filas.eventos.filter((e) => e.matchId === m.id);
        const esLocal = plantilla.teamId === m.homeTeamId;
        return {
          matchId: m.id,
          fecha: m.scheduledAt?.getTime() ?? 0,
          enAlineacion: a != null,
          // Lo marca el árbitro; si la cédula no lo trae, el titular jugó
          jugo: a ? (a.jugo ?? a.titular) : false,
          posicion: a?.posicion ?? null,
          goles: eventos.filter((e) => e.type === "GOL" && e.playerId === userId).map((e) => e.tipoGol),
          asistencias: eventos.filter((e) => e.type === "GOL" && e.assistPlayerId === userId).length,
          penalesAtajados: eventos.filter((e) => e.type === "PENAL_ATAJADO" && e.playerId === userId).length,
          tarjetas: eventos
            .filter((e) => (e.type === "AMARILLA" || e.type === "ROJA") && e.playerId === userId)
            .map((e) => ({ jugadorId: userId, equipoId: e.teamId ?? plantilla.teamId, tipo: e.type as "AMARILLA" | "ROJA", minuto: e.minute })),
          golesEnContra: (esLocal ? m.awayScore : m.homeScore) ?? 0,
          suspendido: false,
        };
      })
      .filter((p): p is PartidoDelJugador => p != null)
      .sort((a, b) => a.fecha - b.fecha);

    // Suspensión: los N partidos de su equipo después del de la tarjeta en que no estuvo (pausa la racha)
    for (const s of filas.suspensiones.filter((x) => x.userId === userId)) {
      const i = partidos.findIndex((p) => p.matchId === s.matchId);
      if (i < 0) continue;
      partidos
        .slice(i + 1)
        .filter((p) => !p.enAlineacion)
        .slice(0, s.partidos ?? 1)
        .forEach((p) => (p.suspendido = true));
    }
    historiales.set(userId, partidos);
  }
  return historiales;
}

/** Los partidos de la ventana de la carta (para contar sus votaciones) */
export const partidosDeLaVentana = (partidos: PartidoDelJugador[]) => new Set(partidos.slice(-VENTANA_PARTIDOS).map((p) => p.matchId));

/**
 * La ventana de la carta: los últimos 20 partidos validados en que fue convocado (§1). `votos`: MVP ganados
 * y % de votos promedio en esos partidos (de `votaciones`); sin votos, CRK toma su valor base.
 */
export function ventanaDe(partidos: PartidoDelJugador[], votos: { mvps: number; porcentajeVotos: number } = { mvps: 0, porcentajeVotos: 0 }): Ventana {
  const ventana = partidos.slice(-VENTANA_PARTIDOS);
  const jugados = ventana.filter((p) => p.jugo);
  const tarjetas = conteoDeTarjetas(ventana.map((p) => p.tarjetas)).values().next().value ?? { amarillas: 0, rojas: 0 };
  return {
    convocados: ventana.length,
    jugados: jugados.length,
    goles: jugados.reduce((s, p) => s + p.goles.length, 0),
    asistencias: jugados.reduce((s, p) => s + p.asistencias, 0),
    amarillas: tarjetas.amarillas,
    rojas: tarjetas.rojas,
    mvps: votos.mvps,
    porcentajeVotos: votos.porcentajeVotos,
    // RES llega con su fase: sin votos de los rivales toma su valor base
    votosDeRivales: [],
    vallasInvictas: jugados.filter((p) => p.golesEnContra === 0).length,
    golesRecibidos: jugados.reduce((s, p) => s + p.golesEnContra, 0),
    penalesAtajados: ventana.reduce((s, p) => s + p.penalesAtajados, 0),
  };
}

/** La posición que más ha jugado según las alineaciones (§1.1) */
export function posicionMasJugada(partidos: PartidoDelJugador[]): string | null {
  const conteo = new Map<string, number>();
  for (const p of partidos) if (p.jugo && p.posicion) conteo.set(p.posicion, (conteo.get(p.posicion) ?? 0) + 1);
  return [...conteo].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
