"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { assertCan, DomainError, NotFoundError } from "@/modules/core";
import { getCurrentUser } from "@/modules/core/server-api";
import { equipoDeCadaQuien } from "@/modules/equipos/server-api";
import { torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { asegurarListeners, emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { comentarioSchema, publicacionSchema, reaccionSchema, reporteSchema, seguirSchema } from "../schemas";

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Sesión + reglas registradas: toda escritura pasa por assertCan (PERMISOS.md) */
async function quien() {
  const usuario = await getCurrentUser();
  if (!usuario) throw new DomainError("Entra para hacer esto.", "SIN_SESION");
  await asegurarListeners();
  return usuario;
}

function fallo(error: unknown): { ok: false; error: string } {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  logger.error("acción social falló", { error: String(error) });
  return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
}

/** 🔥 ⚽ 🏆 (PRD §6.1): una reacción por persona; tocar la misma la quita, otra la cambia */
export async function reaccionar(entrada: unknown): Promise<Resultado<{ mia: string | null }>> {
  try {
    const { postId, tipo } = reaccionSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "post.react");
    const mia = await db.$transaction(async (tx) => {
      const post = await tx.post.findFirst({ where: { id: postId, deletedAt: null, hidden: false }, select: { id: true } });
      if (!post) throw new NotFoundError("Esa publicación ya no está.");
      const previa = await tx.reaction.findUnique({ where: { postId_userId: { postId, userId: usuario.id } } });
      if (previa?.type === tipo) {
        await tx.reaction.delete({ where: { postId_userId: { postId, userId: usuario.id } } });
        await tx.post.update({ where: { id: postId }, data: { reactionsCount: { decrement: 1 } } });
        return null;
      }
      if (previa) await tx.reaction.update({ where: { postId_userId: { postId, userId: usuario.id } }, data: { type: tipo } });
      else {
        await tx.reaction.create({ data: { postId, userId: usuario.id, type: tipo } });
        await tx.post.update({ where: { id: postId }, data: { reactionsCount: { increment: 1 } } });
      }
      return tipo;
    });
    if (mia) await emit("post.reacted", { postId, userId: usuario.id, type: mia });
    return { ok: true, mia };
  } catch (e) {
    return fallo(e);
  }
}

/** La porra (PRD §6.3): comentario en una publicación o en el muro de un jugador */
export async function comentar(entrada: unknown): Promise<Resultado> {
  try {
    const { postId, muroDe, texto } = comentarioSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "comment.create");
    const comentario = await db.$transaction(async (tx) => {
      if (postId) {
        const post = await tx.post.findFirst({ where: { id: postId, deletedAt: null, hidden: false }, select: { id: true } });
        if (!post) throw new NotFoundError("Esa publicación ya no está.");
        await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
      } else {
        const muro = await tx.user.findFirst({ where: { id: muroDe, deletedAt: null }, select: { id: true } });
        if (!muro) throw new NotFoundError("Ese perfil ya no está.");
      }
      return tx.comment.create({ data: { authorId: usuario.id, postId: postId ?? null, wallUserId: muroDe ?? null, body: texto }, select: { id: true } });
    });
    await emit("comment.created", { commentId: comentario.id, postId: postId ?? null });
    refresh();
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}

export type EstadoPublicar = { estado: "inicial" } | { estado: "error"; mensaje: string; texto: string };

/** Publicar como persona (pantalla 34): texto; se liga a su equipo y a su liga para salir en su feed */
export async function publicar(_previo: EstadoPublicar, formData: FormData): Promise<EstadoPublicar> {
  const crudo = String(formData.get("texto") ?? "");
  let postId: string;
  try {
    const { texto } = publicacionSchema.parse({ texto: crudo });
    const usuario = await quien();
    await assertCan(usuario.id, "post.create");
    const [miembro] = await equipoDeCadaQuien([usuario.id]);
    const equipoId = miembro?.team.id ?? (await db.teamFollow.findFirst({ where: { userId: usuario.id }, orderBy: { createdAt: "asc" }, select: { teamId: true } }))?.teamId;
    const torneo = equipoId ? (await torneoVigenteDelEquipo(equipoId))?.tournament : null;
    const post = await db.post.create({
      data: {
        type: "NORMAL",
        source: "HUMANO",
        authorAs: "USER",
        authorId: usuario.id,
        subjectUserId: usuario.id,
        teamId: miembro?.team.id ?? null,
        leagueId: torneo?.league.id ?? null,
        tournamentId: torneo?.id ?? null,
        body: texto,
        data: { equipos: equipoId ? [equipoId] : [], jugadores: [usuario.id] },
      },
      select: { id: true },
    });
    postId = post.id;
    await emit("post.created", { postId });
  } catch (e) {
    const r = fallo(e);
    const mensaje = e instanceof Error && "issues" in e ? (e as { issues: { message: string }[] }).issues[0]?.message : r.error;
    return { estado: "error", mensaje: mensaje ?? r.error, texto: crudo };
  }
  redirect(`/inicio?publicado=${postId}`);
}

/** Seguir a un jugador o a un equipo (contadores en la misma transacción) */
export async function seguir(entrada: unknown): Promise<Resultado<{ siguiendo: boolean }>> {
  try {
    const { persona, equipo, seguir: quiere } = seguirSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "user.follow", { targetUserId: persona });
    const cambio = await db.$transaction(async (tx) => {
      if (persona) {
        const ya = await tx.userFollow.findUnique({ where: { followerId_followedId: { followerId: usuario.id, followedId: persona } } });
        if (quiere === Boolean(ya)) return false;
        if (quiere) await tx.userFollow.create({ data: { followerId: usuario.id, followedId: persona } });
        else await tx.userFollow.delete({ where: { followerId_followedId: { followerId: usuario.id, followedId: persona } } });
        const d = quiere ? 1 : -1;
        await tx.user.update({ where: { id: persona }, data: { followersCount: { increment: d } } });
        await tx.user.update({ where: { id: usuario.id }, data: { followingCount: { increment: d } } });
        return true;
      }
      const ya = await tx.teamFollow.findUnique({ where: { userId_teamId: { userId: usuario.id, teamId: equipo! } } });
      if (quiere === Boolean(ya)) return false;
      if (quiere) await tx.teamFollow.create({ data: { userId: usuario.id, teamId: equipo! } });
      else await tx.teamFollow.delete({ where: { userId_teamId: { userId: usuario.id, teamId: equipo! } } });
      await tx.team.update({ where: { id: equipo! }, data: { followersCount: { increment: quiere ? 1 : -1 } } });
      return true;
    });
    if (cambio && quiere) await emit("user.followed", { followerId: usuario.id, followedUserId: persona, teamId: equipo });
    return { ok: true, siguiendo: quiere };
  } catch (e) {
    return fallo(e);
  }
}

/** Reportar un comentario (regla 10): llega a la moderación de la liga dueña del contenido */
export async function reportar(entrada: unknown): Promise<Resultado> {
  try {
    const { comentarioId, motivo } = reporteSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "content.report");
    const c = await db.comment.findFirst({
      where: { id: comentarioId, deletedAt: null },
      select: { id: true, authorId: true, post: { select: { leagueId: true } } },
    });
    if (!c) throw new NotFoundError("Ese comentario ya no está.");
    if (c.authorId === usuario.id) throw new DomainError("No puedes reportarte a ti mismo.");
    const ya = await db.report.findFirst({ where: { reporterId: usuario.id, targetType: "COMMENT", targetId: c.id }, select: { id: true } });
    if (!ya) {
      await db.report.create({
        data: { reporterId: usuario.id, targetType: "COMMENT", targetId: c.id, motivo, leagueId: c.post?.leagueId ?? null },
      });
    }
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}
