import "server-only";
import { db } from "@/shared/lib/db";

// Lecturas de social para el inicio del aficionado (pantalla 05). Solo campos públicos (regla 8).
const equipoSelect = {
  id: true,
  slug: true,
  nombre: true,
  siglas: true,
  colorPrimario: true,
  colorSecundario: true,
} as const;
const personaSelect = { id: true, username: true, nombre: true, sobrenombre: true, fotoPath: true } as const;

/** Equipos y cracks que sigue la persona, en el orden en que los siguió */
export async function loQueSigue(userId: string) {
  const [equipos, cracks] = await Promise.all([
    db.teamFollow.findMany({
      where: { userId, team: { deletedAt: null } },
      orderBy: { createdAt: "asc" },
      select: { team: { select: equipoSelect } },
    }),
    db.userFollow.findMany({
      where: { followerId: userId, followed: { deletedAt: null } },
      orderBy: { createdAt: "asc" },
      select: { followed: { select: personaSelect } },
    }),
  ]);
  return { equipos: equipos.map((e) => e.team), cracks: cracks.map((c) => c.followed) };
}

/** Comentarios reportados sin atender en la liga (pantallas 18 y 50) */
export function reportesAbiertos(leagueId: string) {
  return db.report.count({ where: { leagueId, status: "ABIERTO" } });
}
