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
