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
  body: true,
  createdAt: true,
  author: { select: personaSelect },
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
        // Insignias y publicaciones de la gente de estas semanas (solo en la jornada más reciente)
        ...(insigniasDesde ? [{ type: { in: ["AUTO_INSIGNIA" as const, "NORMAL" as const] }, createdAt: { gte: insigniasDesde } }] : []),
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

/** Un post con su autor (pantalla de la publicación y su porra) */
export function postPorId(id: string) {
  return db.post.findFirst({ where: { id, deletedAt: null, hidden: false }, select: postSelect });
}

/** Reacciones por tipo de cada post y la de quien ve (🔥 2.3k · ⚽ 412 · 🏆 128) */
export async function reaccionesDe(postIds: string[], userId?: string) {
  if (!postIds.length) return { conteos: new Map<string, Record<string, number>>(), mias: new Map<string, string>() };
  const [grupos, mias] = await Promise.all([
    db.reaction.groupBy({ by: ["postId", "type"], where: { postId: { in: postIds } }, _count: { _all: true } }),
    userId ? db.reaction.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true, type: true } }) : [],
  ]);
  const conteos = new Map<string, Record<string, number>>();
  for (const g of grupos) conteos.set(g.postId, { ...(conteos.get(g.postId) ?? {}), [g.type]: g._count._all });
  return { conteos, mias: new Map(mias.map((m) => [m.postId, m.type])) };
}

/** La porra de una publicación o del muro de un jugador (PRD §6.3), en orden */
export function comentariosDe(donde: { postId?: string; muroDe?: string }, take = 60) {
  return db.comment.findMany({
    where: {
      ...(donde.postId ? { postId: donde.postId } : { wallUserId: donde.muroDe }),
      deletedAt: null,
      hidden: false,
      parentId: null,
    },
    orderBy: { createdAt: "asc" },
    take,
    select: { id: true, body: true, createdAt: true, author: { select: personaSelect } },
  });
}

/** ¿Ya lo sigue? (botón Seguir) */
export async function yaSigue(userId: string, a: { persona?: string; equipo?: string }) {
  if (a.persona) return (await db.userFollow.count({ where: { followerId: userId, followedId: a.persona } })) > 0;
  if (a.equipo) return (await db.teamFollow.count({ where: { userId, teamId: a.equipo } })) > 0;
  return false;
}

/** A quién le avisa una reacción: el autor o, en un auto-post, su protagonista (el goleador) */
export function duenosDePost(postId: string) {
  return db.post.findUnique({ where: { id: postId }, select: { type: true, authorId: true, subjectUserId: true } });
}

/** Lo que necesita el aviso de un comentario nuevo */
export function datosDeComentario(commentId: string) {
  return db.comment.findUnique({
    where: { id: commentId },
    select: {
      body: true,
      authorId: true,
      postId: true,
      wallUserId: true,
      post: { select: { authorId: true, subjectUserId: true } },
      wallUser: { select: { username: true } },
    },
  });
}
