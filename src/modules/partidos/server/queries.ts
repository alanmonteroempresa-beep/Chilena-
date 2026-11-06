import "server-only";
import { db } from "@/shared/lib/db";
import type { PartidoParaSanciones } from "./services/sanciones";

// Lecturas de partidos para los inicios (pantallas 02, 03, 04, 05 y 18). Solo `select` explícito y solo
// campos públicos de las personas (regla 8).
const equipoSelect = {
  id: true,
  slug: true,
  nombre: true,
  siglas: true,
  colorPrimario: true,
  colorSecundario: true,
} as const;
const personaSelect = {
  id: true,
  username: true,
  nombre: true,
  apellidos: true,
  sobrenombre: true,
  fotoPath: true,
} as const;

const partidoSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  homeScore: true,
  awayScore: true,
  refereeStatus: true,
  arbitrajeCents: true,
  round: { select: { numero: true, nombre: true } },
  field: { select: { nombre: true, venue: { select: { nombre: true } } } },
  homeTeam: { select: equipoSelect },
  awayTeam: { select: equipoSelect },
  referee: { select: personaSelect },
} as const;

/** Lo que todavía se va a jugar (o se está jugando) */
const POR_JUGAR = ["PROGRAMADO", "EN_JUEGO"] as const;
/** Un partido de hoy sigue siendo "el próximo" hasta 3 h después de la hora */
const VENTANA_MS = 3 * 3_600_000;

export function proximoPartidoDelEquipo(teamId: string, ahora: Date) {
  return db.match.findFirst({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: { in: [...POR_JUGAR] },
      scheduledAt: { gte: new Date(ahora.getTime() - VENTANA_MS) },
    },
    orderBy: { scheduledAt: "asc" },
    select: partidoSelect,
  });
}

/** Último partido VALIDADO del equipo con sus goles oficiales (regla 2) */
export function ultimoResultadoDelEquipo(teamId: string) {
  return db.match.findFirst({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }], status: "VALIDADO" },
    orderBy: { scheduledAt: "desc" },
    select: {
      ...partidoSelect,
      events: {
        where: { type: { in: ["GOL", "AUTOGOL"] }, oficial: true, voided: false },
        orderBy: { minute: "asc" },
        select: { minute: true, type: true, tipoGol: true, teamId: true, player: { select: personaSelect } },
      },
    },
  });
}

/** Partidos de una jornada (pantalla 18: "Domingo 8 · J16") */
export function partidosDeLaJornada(tournamentId: string, numero: number) {
  return db.match.findMany({
    where: { tournamentId, round: { numero } },
    orderBy: { scheduledAt: "asc" },
    select: partidoSelect,
  });
}

/** Primera jornada con partidos por jugar (la que viene) */
export async function jornadaQueViene(tournamentId: string) {
  const r = await db.round.findFirst({
    where: { tournamentId, matches: { some: { status: { in: [...POR_JUGAR] } } } },
    orderBy: { numero: "asc" },
    select: { numero: true },
  });
  return r?.numero ?? null;
}

/** Partidos asignados a un árbitro: lo que viene y lo último que cerró (pantallas 02 y 55) */
export async function partidosDelArbitro(refereeId: string, ahora: Date) {
  const [vienen, cerrados] = await Promise.all([
    db.match.findMany({
      where: {
        refereeId,
        status: { in: [...POR_JUGAR, "POR_FIRMAR", "FINALIZADO"] },
        scheduledAt: { gte: new Date(ahora.getTime() - VENTANA_MS) },
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      select: partidoSelect,
    }),
    db.match.findMany({
      where: { refereeId, status: "VALIDADO" },
      orderBy: { scheduledAt: "desc" },
      take: 4,
      select: partidoSelect,
    }),
  ]);
  return { vienen, cerrados };
}

/** Cédulas que esperan a la liga: enviadas, en corrección o firmadas (pantallas 18 y 46) */
export function cedulasPorRevisar(tournamentId: string) {
  return db.matchReport.findMany({
    where: { status: { in: ["ENVIADA", "EN_CORRECCION", "FIRMADA"] }, match: { tournamentId } },
    select: {
      status: true,
      match: { select: { homeTeam: { select: equipoSelect }, awayTeam: { select: equipoSelect } } },
    },
  });
}

/** Cédula de mi equipo que espera mi firma (pantalla 04: "Cédula J14 · falta tu firma") */
export function cedulaPorFirmar(teamId: string) {
  return db.matchReport.findFirst({
    where: {
      status: { in: ["ENVIADA", "EN_CORRECCION"] },
      OR: [
        { match: { homeTeamId: teamId }, homeSignedAt: null },
        { match: { awayTeamId: teamId }, awaySignedAt: null },
      ],
    },
    select: { match: { select: partidoSelect } },
  });
}

/** Goleo del torneo (solo cédulas validadas alimentan las estadísticas) */
export function goleoDelTorneo(tournamentId: string, take = 10) {
  return db.playerTournamentStat.findMany({
    where: { tournamentId, goles: { gt: 0 } },
    orderBy: [{ goles: "desc" }, { asistencias: "desc" }],
    take,
    select: { userId: true, goles: true, partidos: true, asistencias: true, rachaGoles: true, user: { select: personaSelect } },
  });
}

export function estadisticasDelJugador(tournamentId: string, userId: string) {
  return db.playerTournamentStat.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: {
      partidos: true,
      goles: true,
      asistencias: true,
      amarillas: true,
      rojas: true,
      rachaGoles: true,
      rachaAsistencia: true,
    },
  });
}

/** Sanciones activas del torneo (para la plantilla, el jugador y el panel) */
export function sancionesActivas(tournamentId: string, filtro: { userIds?: string[] } = {}) {
  return db.sanction.findMany({
    where: {
      tournamentId,
      status: "ACTIVA",
      ...(filtro.userIds ? { userId: { in: filtro.userIds } } : {}),
    },
    select: { userId: true, type: true, partidos: true, partidosCumplidos: true, motivo: true },
  });
}

/**
 * Partidos validados del torneo con las tarjetas de UNA persona, en orden, para el acumulado de amarillas
 * (`amarillasAcumuladas`, PRD §7.8). Van todos los partidos para que el reinicio de la liguilla cuente.
 */
export async function tarjetasParaAcumulado(tournamentId: string, userId: string): Promise<PartidoParaSanciones[]> {
  const partidos = await db.match.findMany({
    where: { tournamentId, status: "VALIDADO" },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      status: true,
      round: { select: { numero: true, fase: true } },
      events: {
        where: { playerId: userId, type: { in: ["AMARILLA", "ROJA"] }, oficial: true, voided: false },
        select: { type: true, minute: true, teamId: true },
      },
    },
  });
  return partidos.map((p, i) => ({
    matchId: p.id,
    orden: i,
    etiqueta: `J${p.round?.numero ?? i + 1}`,
    status: p.status,
    fase: p.round?.fase ?? "REGULAR",
    tarjetas: p.events.map((e) => ({
      jugadorId: userId,
      equipoId: e.teamId ?? "",
      tipo: e.type as "AMARILLA" | "ROJA",
      minuto: e.minute,
    })),
  }));
}

/**
 * Historial VALIDADO de varias personas (carta e insignias, pantallas 14, 25 y 28): los partidos de los
 * equipos en que estaban en la plantilla del torneo, sus alineaciones, sus eventos oficiales y sus
 * suspensiones. Cuatro lecturas para todo el grupo (la rareza evalúa a todo el torneo).
 */
export async function historialDePlantillas(plantillas: { userId: string; tournamentId: string; teamId: string }[]) {
  const userIds = [...new Set(plantillas.map((p) => p.userId))];
  const pares = [...new Map(plantillas.map((p) => [`${p.tournamentId}:${p.teamId}`, p])).values()];
  if (!pares.length) return { partidos: [], alineaciones: [], eventos: [], suspensiones: [] };

  const partidos = await db.match.findMany({
    where: {
      status: "VALIDADO",
      OR: pares.flatMap((p) => [
        { tournamentId: p.tournamentId, homeTeamId: p.teamId },
        { tournamentId: p.tournamentId, awayTeamId: p.teamId },
      ]),
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      tournamentId: true,
      scheduledAt: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      round: { select: { numero: true } },
    },
  });
  const matchIds = partidos.map((p) => p.id);
  const [alineaciones, eventos, suspensiones] = await Promise.all([
    db.lineupPlayer.findMany({
      where: { userId: { in: userIds }, lineup: { matchId: { in: matchIds } } },
      select: { userId: true, jugo: true, titular: true, posicion: true, lineup: { select: { matchId: true, teamId: true } } },
    }),
    db.matchEvent.findMany({
      where: {
        matchId: { in: matchIds },
        oficial: true,
        voided: false,
        type: { in: ["GOL", "PENAL_ATAJADO", "AMARILLA", "ROJA"] },
        OR: [{ playerId: { in: userIds } }, { assistPlayerId: { in: userIds } }],
      },
      select: { matchId: true, type: true, minute: true, tipoGol: true, teamId: true, playerId: true, assistPlayerId: true },
    }),
    db.sanction.findMany({
      where: { userId: { in: userIds }, type: "SUSPENSION_PARTIDOS", status: { not: "ANULADA" }, matchId: { not: null } },
      select: { userId: true, matchId: true, partidos: true },
    }),
  ]);
  return { partidos, alineaciones, eventos, suspensiones };
}

/** La página del partido (pantalla 32): marcador, cédula con sus firmas, eventos oficiales y alineaciones */
export function partidoCompleto(id: string) {
  return db.match.findUnique({
    where: { id },
    select: {
      ...partidoSelect,
      validatedAt: true,
      tournament: { select: { nombre: true, league: { select: { slug: true, nombre: true, siglas: true } } } },
      report: {
        select: {
          status: true,
          source: true,
          homeSignedBy: { select: personaSelect },
          awaySignedBy: { select: personaSelect },
        },
      },
      events: {
        where: { oficial: true, voided: false },
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          minute: true,
          type: true,
          tipoGol: true,
          teamId: true,
          nota: true,
          player: { select: personaSelect },
          assistPlayer: { select: personaSelect },
          playerOut: { select: personaSelect },
        },
      },
      lineups: {
        select: {
          teamId: true,
          players: {
            select: { numero: true, titular: true, posicion: true, capitan: true, user: { select: personaSelect } },
          },
        },
      },
    },
  });
}

/** La última jornada con partidos VALIDADOS (lo que dejó la J15 · pantalla 10) */
export async function ultimaJornadaValidada(tournamentId: string) {
  const r = await db.round.findFirst({
    where: { tournamentId, matches: { some: { status: "VALIDADO" } } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return r?.numero ?? null;
}

/** Los partidos VALIDADOS de una jornada con sus goles oficiales (auto-posts del feed) */
export function partidosValidadosConGoles(tournamentId: string, numero: number) {
  return db.match.findMany({
    where: { tournamentId, round: { numero }, status: "VALIDADO" },
    orderBy: { scheduledAt: "asc" },
    select: {
      ...partidoSelect,
      validatedAt: true,
      events: {
        where: { type: "GOL", oficial: true, voided: false },
        orderBy: { minute: "asc" },
        select: { minute: true, tipoGol: true, teamId: true, player: { select: personaSelect } },
      },
    },
  });
}
