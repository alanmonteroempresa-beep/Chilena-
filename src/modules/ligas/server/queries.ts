import "server-only";
import { db } from "@/shared/lib/db";

const ACTIVOS = ["INSCRIPCIONES_ABIERTAS", "EN_CURSO", "LIGUILLA"] as const;
const ligaSelect = { id: true, slug: true, nombre: true, siglas: true } as const;

/** Ligas que la persona administra o donde arbitra (selector de rol · pantallas 07 y 24) */
export async function contextosEnLigas(userId: string) {
  const [administra, arbitra] = await Promise.all([
    db.leagueAdmin.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        league: {
          select: {
            ...ligaSelect,
            tournaments: {
              where: { status: { in: [...ACTIVOS] } },
              take: 1,
              select: { nombre: true },
            },
          },
        },
      },
    }),
    db.leagueReferee.findMany({
      where: { userId, status: "ACTIVO" },
      orderBy: { createdAt: "asc" },
      select: { league: { select: ligaSelect } },
    }),
  ]);
  return { administra, arbitra };
}

const equipoSelect = {
  id: true,
  slug: true,
  nombre: true,
  siglas: true,
  colorPrimario: true,
  colorSecundario: true,
} as const;
const torneoSelect = {
  id: true,
  nombre: true,
  amarillasParaSuspension: true,
  partidosPorRoja: true,
  costoArbitrajeCents: true,
  numJornadas: true,
  equiposLiguilla: true,
  league: { select: { id: true, slug: true, nombre: true, siglas: true } },
} as const;

/** Torneo vigente donde juega el equipo (inscripción aceptada) */
export function torneoVigenteDelEquipo(teamId: string) {
  return db.tournamentTeam.findFirst({
    where: { teamId, status: "ACEPTADA", tournament: { status: { in: [...ACTIVOS] } } },
    orderBy: { tournament: { fechaInicio: "desc" } },
    select: { id: true, tournament: { select: torneoSelect } },
  });
}

/** Torneo vigente de una liga (por slug) */
export function torneoVigenteDeLaLiga(slug: string) {
  return db.tournament.findFirst({
    where: { league: { slug, deletedAt: null }, status: { in: [...ACTIVOS] } },
    orderBy: { fechaInicio: "desc" },
    select: torneoSelect,
  });
}

/** Tabla del torneo ya calculada por `calcularTabla` (pantallas 05 y Mi liga) */
export function tablaDelTorneo(tournamentId: string) {
  return db.standingRow.findMany({
    where: { tournamentId },
    orderBy: [{ posicion: "asc" }, { pts: "desc" }, { dg: "desc" }],
    select: {
      posicion: true,
      posicionAnterior: true,
      pj: true,
      pg: true,
      pe: true,
      pp: true,
      gf: true,
      gc: true,
      dg: true,
      pts: true,
      racha: true,
      tournamentTeam: { select: { team: { select: equipoSelect } } },
    },
  });
}

const cargoSelect = {
  id: true,
  concept: true,
  descripcion: true,
  amountCents: true,
  dueDate: true,
  status: true,
} as const;

/** Lo que el equipo le debe o le pagó a la liga (pantalla 04: "Por pagar a la liga" y "Pagos a la liga") */
export function cargosDelEquipo(tournamentTeamId: string) {
  return db.leagueCharge.findMany({
    where: { tournamentTeamId },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
    select: cargoSelect,
  });
}

/** Cargos del torneo con su equipo (pantalla 18: cobrado del mes y pagos sin cubrir) */
export function cargosDelTorneo(tournamentId: string) {
  return db.leagueCharge.findMany({
    where: { tournamentId },
    select: { ...cargoSelect, tournamentTeam: { select: { team: { select: equipoSelect } } } },
  });
}

/** Lo que la liga le debe al árbitro, partido por partido (pantalla 02: "Cobro de arbitraje") */
export function pagosAlArbitro(refereeId: string) {
  return db.refereePayment.findMany({
    where: { refereeId, status: { in: ["PENDIENTE", "REPORTADO"] } },
    select: { amountCents: true, matchId: true },
  });
}

/** Plantillas de cada persona en los torneos (para su historial de partidos validados) */
export function plantillasDeJugadores(userIds: string[]) {
  return db.tournamentRoster.findMany({
    where: { userId: { in: userIds }, status: { in: ["ACTIVO", "SUSPENDIDO", "BAJA", "PENDIENTE_APROBACION"] } },
    select: {
      userId: true,
      tournamentId: true,
      tournamentTeamId: true,
      status: true,
      tournamentTeam: { select: { teamId: true, team: { select: { nombre: true } } } },
    },
  });
}

/** Inscritos (activos o suspendidos) de varios equipos en el torneo, con dorsal: la cédula (`partidos`) */
export async function inscritosDeEquipos(tournamentId: string, teamIds: string[]) {
  const filas = await db.tournamentRoster.findMany({
    where: { tournamentId, status: { in: ["ACTIVO", "SUSPENDIDO"] }, tournamentTeam: { teamId: { in: teamIds } } },
    select: { userId: true, numero: true, tournamentTeam: { select: { teamId: true } } },
  });
  return filas.map((f) => ({ userId: f.userId, teamId: f.tournamentTeam.teamId, numero: f.numero }));
}

/** Quiénes juegan el torneo (para la rareza de las insignias: "41% de la liga la tiene") */
export async function jugadoresDelTorneo(tournamentId: string) {
  const filas = await db.tournamentRoster.findMany({
    where: { tournamentId, status: { in: ["ACTIVO", "SUSPENDIDO"] } },
    select: { userId: true },
  });
  return filas.map((f) => f.userId);
}

/** Fila de la tabla de un equipo (pj y derrotas para la insignia Invictos) */
export function filaDeLaTabla(tournamentTeamId: string) {
  return db.standingRow.findUnique({
    where: { tournamentTeamId },
    select: { pj: true, pp: true, posicion: true },
  });
}

/** Jornadas del torneo (rol de juegos: J1 … J18 y liguilla) */
export function jornadasDelTorneo(tournamentId: string) {
  return db.round.findMany({
    where: { tournamentId },
    orderBy: { numero: "asc" },
    select: { numero: true, nombre: true, fase: true, fechaInicio: true, cerrada: true },
  });
}

/** La inscripción vigente de un equipo por su slug (Mi liga desde el contexto del jugador o aficionado) */
export function inscripcionVigentePorSlug(slugEquipo: string) {
  return db.tournamentTeam.findFirst({
    where: { team: { slug: slugEquipo, deletedAt: null }, status: "ACEPTADA", tournament: { status: { in: [...ACTIVOS] } } },
    orderBy: { tournament: { fechaInicio: "desc" } },
    select: { id: true, team: { select: equipoSelect }, tournament: { select: torneoSelect } },
  });
}

/** Equipo de cada jugador en un torneo (goleo: "El Tanque · Tigres") */
export function equiposEnElTorneo(tournamentId: string, userIds: string[]) {
  return db.tournamentRoster.findMany({
    where: { tournamentId, userId: { in: userIds } },
    select: { userId: true, numero: true, tournamentTeam: { select: { team: { select: equipoSelect } } } },
  });
}

/** Las plantillas de los dos equipos de un partido (a quién se le recalcula la carta al validarlo) */
export async function jugadoresDelPartido(matchId: string) {
  const m = await db.match.findUnique({ where: { id: matchId }, select: { tournamentId: true, homeTeamId: true, awayTeamId: true } });
  if (!m?.tournamentId) return [];
  const filas = await db.tournamentRoster.findMany({
    where: {
      tournamentId: m.tournamentId,
      status: { in: ["ACTIVO", "SUSPENDIDO"] },
      tournamentTeam: { teamId: { in: [m.homeTeamId, m.awayTeamId] } },
    },
    select: { userId: true },
  });
  return filas.map((f) => f.userId);
}

/** Todos los que juegan algún torneo vigente (recalcular todo) */
export async function jugadoresDeTorneosVigentes() {
  const filas = await db.tournamentRoster.findMany({
    where: { status: { in: ["ACTIVO", "SUSPENDIDO"] }, tournament: { status: { in: [...ACTIVOS] } } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return filas.map((f) => f.userId);
}
