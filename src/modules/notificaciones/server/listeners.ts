import "server-only";
import { insigniaPorCodigo } from "@/modules/carta/server-api";
import { personasPorId } from "@/modules/core/server-api";
import { datosDeComentario, duenosDePost } from "@/modules/social/server-api";
import { on } from "@/shared/events/bus";
import { nombreVisible } from "@/shared/lib/personas";
import { notificar } from "./notificar";

const EMOJI: Record<string, string> = { FUEGO: "🔥", GOLAZO: "⚽", TROFEO: "🏆" };
const QUE_COSA: Record<string, string> = {
  NORMAL: "tu publicación",
  AUTO_GOL: "tu gol",
  AUTO_INSIGNIA: "tu insignia",
  AUTO_RACHA: "tu racha",
};

async function persona(id: string) {
  const [p] = await personasPorId([id]);
  return p ? { ...p, nombreVisible: nombreVisible(p) } : null;
}

// Eventos que escucha el módulo `notificaciones` (docs/NOTIFICACIONES.md §2)
export function registerListeners() {
  on("post.reacted", async ({ postId, userId, type }) => {
    const post = await duenosDePost(postId);
    const dueno = post?.authorId ?? post?.subjectUserId;
    const actor = await persona(userId);
    if (!post || !dueno || !actor) return;
    const cosa = QUE_COSA[post.type] ?? "tu publicación";
    await notificar({
      userIds: [dueno],
      actorId: userId,
      type: "REACCION",
      title: `${actor.nombreVisible} le echó ${EMOJI[type] ?? "🔥"} a ${cosa}`,
      href: `/post/${postId}`,
      agrupar: {
        clave: `reaccion:${postId}`,
        nombre: actor.nombreVisible,
        titulo: (q, n) => (n === 1 ? `${q} le echó ${EMOJI[type] ?? "🔥"} a ${cosa}` : `${q} reaccionaron a ${cosa}`),
      },
    });
  });

  on("comment.created", async ({ commentId }) => {
    const c = await datosDeComentario(commentId);
    const actor = c ? await persona(c.authorId) : null;
    if (!c || !actor) return;
    const dueno = c.postId ? (c.post?.authorId ?? c.post?.subjectUserId) : c.wallUserId;
    if (!dueno) return;
    await notificar({
      userIds: [dueno],
      actorId: c.authorId,
      type: "COMENTARIO",
      title: `${actor.nombreVisible} ${c.postId ? "le echó porra a tu publicación" : "te echó porra en tu muro"}`,
      body: `"${c.body.slice(0, 90)}${c.body.length > 90 ? "…" : ""}"`,
      href: c.postId ? `/post/${c.postId}` : `/j/${c.wallUser?.username}#porra`,
    });
  });

  on("user.followed", async ({ followerId, followedUserId }) => {
    if (!followedUserId) return;
    const actor = await persona(followerId);
    if (!actor) return;
    await notificar({
      userIds: [followedUserId],
      actorId: followerId,
      type: "NUEVO_SEGUIDOR",
      title: `${actor.nombreVisible} empezó a seguirte`,
      href: `/j/${actor.username}`,
      agrupar: {
        clave: `seguidores:${followedUserId}`,
        nombre: actor.nombreVisible,
        titulo: (q, n) => (n === 1 ? `${q} empezó a seguirte` : `${q} empezaron a seguirte`),
      },
    });
  });

  on("badge.awarded", async ({ userId, badgeCode }) => {
    const [yo, badge] = await Promise.all([
      persona(userId),
      insigniaPorCodigo(badgeCode),
    ]);
    if (!yo || !badge) return;
    await notificar({
      userIds: [userId],
      type: "INSIGNIA",
      title: `${badge.icon ?? "🏅"} Ganaste la insignia ${badge.nombre}`,
      body: badge.descripcion,
      href: `/j/${yo.username}/insignias`,
    });
  });

  on("card.recalculated", async ({ userId, media, delta }) => {
    if (media == null || !delta) return;
    const yo = await persona(userId);
    if (!yo) return;
    await notificar({
      userIds: [userId],
      type: "CARTA_ACTUALIZADA",
      title: delta > 0 ? `Tu carta subió a ${media} (+${delta})` : `Tu carta bajó a ${media} (${delta})`,
      body: "Sale de la cédula validada de tu último partido.",
      href: `/j/${yo.username}/carta`,
    });
  });
}
