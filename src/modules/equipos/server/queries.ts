import "server-only";
import { db } from "@/shared/lib/db";

const ACTIVOS = ["INSCRIPCIONES_ABIERTAS", "EN_CURSO", "LIGUILLA"] as const;
const equipoSelect = {
  id: true,
  slug: true,
  nombre: true,
  siglas: true,
  colorPrimario: true,
  colorSecundario: true,
} as const;

/** Equipos donde la persona juega o es delegado, con su torneo vigente (selector de rol · pantallas 07 y 24) */
export function contextosEnEquipos(userId: string) {
  return db.teamMember.findMany({
    where: { userId, status: "ACTIVO" },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      numero: true,
      team: {
        select: {
          ...equipoSelect,
          registrations: {
            where: { status: "ACEPTADA", tournament: { status: { in: [...ACTIVOS] } } },
            take: 1,
            select: { tournament: { select: { nombre: true, league: { select: { slug: true, nombre: true, siglas: true } } } } },
          },
        },
      },
    },
  });
}

/** Equipos que sigue (aficionado) */
export function equiposQueSigue(userId: string) {
  return db.teamFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { team: { select: equipoSelect } },
  });
}

const personaSelect = { id: true, username: true, nombre: true, sobrenombre: true, fotoPath: true } as const;

export function equipoPorSlug(slug: string) {
  return db.team.findFirst({ where: { slug, deletedAt: null }, select: equipoSelect });
}

/** Plantilla activa (con dorsal) del equipo: pantalla 04 */
export function plantillaDelEquipo(teamId: string) {
  return db.teamMember.findMany({
    where: { teamId, status: "ACTIVO", numero: { not: null } },
    orderBy: { numero: "asc" },
    select: { numero: true, posicion: true, role: true, user: { select: personaSelect } },
  });
}

/** Lo que contestó cada quien al pase de lista de un partido (pantallas 04 y 20) */
export function respuestasDelPaseDeLista(matchId: string, teamId: string) {
  return db.matchAttendance.findMany({
    where: { matchId, teamId },
    select: { userId: true, status: true, nota: true, user: { select: personaSelect } },
  });
}

/** La cuota más reciente del equipo con el estado de pago de cada quien (pantallas 31 y 54) */
export function cuotaVigente(teamId: string) {
  return db.teamDue.findFirst({
    where: { teamId },
    orderBy: { dueDate: "desc" },
    select: {
      concepto: true,
      amountCents: true,
      dueDate: true,
      payments: { select: { userId: true, status: true } },
    },
  });
}

/** Equipos más seguidos (sugerencias para quien no sigue a nadie, PRD §6.16) */
export function equiposMasSeguidos(take = 6) {
  return db.team.findMany({
    where: { deletedAt: null },
    orderBy: [{ followersCount: "desc" }, { nombre: "asc" }],
    take,
    select: equipoSelect,
  });
}

/** Equipo y dorsal de cada persona (para listas como "Sigue a más cracks") */
export function equipoDeCadaQuien(userIds: string[]) {
  return db.teamMember.findMany({
    where: { userId: { in: userIds }, status: "ACTIVO", numero: { not: null } },
    select: { userId: true, numero: true, posicion: true, team: { select: equipoSelect } },
  });
}

export async function esDelegadoDe(userId: string, teamId: string) {
  return (
    (await db.teamMember.count({
      where: { userId, teamId, status: "ACTIVO", role: { in: ["DELEGADO_PRINCIPAL", "DELEGADO_AUXILIAR"] } },
    })) > 0
  );
}

export async function esMiembroDe(userId: string, teamId: string) {
  return (await db.teamMember.count({ where: { userId, teamId, status: "ACTIVO" } })) > 0;
}

/** Delegados de varios equipos (avisos: cédula por firmar) */
export async function delegadosDe(teamIds: string[]) {
  const filas = await db.teamMember.findMany({
    where: { teamId: { in: teamIds }, status: "ACTIVO", role: { in: ["DELEGADO_PRINCIPAL", "DELEGADO_AUXILIAR"] } },
    select: { userId: true, teamId: true },
  });
  return filas;
}

/** El link de pase de lista de un partido y equipo (pantalla 20) */
export function linkDePaseDeLista(matchId: string, teamId: string) {
  return db.attendanceLink.findUnique({ where: { matchId_teamId: { matchId, teamId } }, select: { token: true, expiresAt: true } });
}

export function linkPorToken(token: string) {
  return db.attendanceLink.findUnique({ where: { token }, select: { token: true, matchId: true, teamId: true, expiresAt: true } });
}

/** La alineación que ya mandó el delegado (pantalla 53) */
export function alineacionDe(matchId: string, teamId: string) {
  return db.lineup.findUnique({
    where: { matchId_teamId: { matchId, teamId } },
    select: { submittedAt: true, players: { select: { userId: true, titular: true, numero: true, capitan: true } } },
  });
}
