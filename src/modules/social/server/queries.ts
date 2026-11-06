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

const postSelect = {
  id: true,
  type: true,
  data: true,
  createdAt: true,
  reactionsCount: true,
  commentsCount: true,
  round: { select: { numero: true } },
} as const;

/** ¿El torneo ya tiene sus auto-posts guardados? */
export const hayPostsGuardados = (tournamentId: string) =>
  db.post.count({ where: { tournamentId, deletedAt: null, hidden: false } }).then((n) => n > 0);

/** Los posts de una jornada del torneo (Para ti) y las insignias recientes del torneo */
export function postsDeLaJornada(tournamentId: string, numero: number, insigniasDesde: Date | null) {
  return db.post.findMany({
    where: {
      tournamentId,
      deletedAt: null,
      hidden: false,
      OR: [
        { round: { numero } },
        ...(insigniasDesde ? [{ type: "AUTO_INSIGNIA" as const, createdAt: { gte: insigniasDesde } }] : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 120,
    select: postSelect,
  });
}

/**
 * Posts del torneo en orden cronológico con cursor (`antes`): Golazos (solo goles) y Siguiendo (de los
 * equipos y cracks que sigue). Nunca offset (CLAUDE.md).
 */
export function postsCronologicos(
  tournamentId: string,
  filtro: { soloGoles?: boolean; sigue?: { equipos: string[]; jugadores: string[] } },
  antes?: Date,
  take = 30,
) {
  const sigue = filtro.sigue;
  return db.post.findMany({
    where: {
      tournamentId,
      deletedAt: null,
      hidden: false,
      ...(filtro.soloGoles ? { type: "AUTO_GOL" as const } : {}),
      ...(antes ? { createdAt: { lt: antes } } : {}),
      ...(sigue
        ? {
            OR: [
              { teamId: { in: sigue.equipos } },
              { subjectUserId: { in: sigue.jugadores } },
              ...sigue.equipos.map((id) => ({ data: { path: ["equipos"], array_contains: [id] } })),
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: postSelect,
  });
}
