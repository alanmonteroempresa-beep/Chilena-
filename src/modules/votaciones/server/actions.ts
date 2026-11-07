"use server";

import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { assertCan, DomainError, NotFoundError } from "@/modules/core";
import { getCurrentUser } from "@/modules/core/server-api";
import { partidoDelDia } from "@/modules/partidos/server-api";
import { asegurarListeners } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { pronosticarSchema, votarSchema } from "../schemas";
import { opcionParaVotar } from "./queries";
import { puedeVotar } from "./services/mvp";
import { quinielaCerrada } from "./services/quiniela";

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Sesión + reglas registradas: toda escritura pasa por assertCan (PERMISOS §2) */
async function quien() {
  const usuario = await getCurrentUser();
  if (!usuario) throw new DomainError("Entra para votar.", "SIN_SESION");
  await asegurarListeners();
  return usuario;
}

function fallo(error: unknown): { ok: false; error: string } {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  logger.error("acción de votaciones falló", { error: String(error) });
  return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
}

/** Un toque por voto (pantalla 12): 1 voto por cuenta reclamada; nadie vota por sí mismo */
export async function votar(entrada: unknown): Promise<Resultado> {
  try {
    const { pollId, optionId } = votarSchema.parse(entrada);
    const usuario = await quien();
    const opcion = await opcionParaVotar(pollId, optionId);
    if (!opcion) throw new NotFoundError("Esa votación ya no está.");
    await assertCan(usuario.id, "poll.vote", { targetUserId: opcion.userId ?? undefined, matchId: opcion.poll.matchId ?? undefined });
    const motivo = puedeVotar(opcion.poll, usuario.id, opcion.userId, new Date());
    if (motivo) throw new DomainError(motivo);
    try {
      // Contadores denormalizados en la misma transacción (CLAUDE.md, Arquitectura)
      await db.$transaction([
        db.pollVote.create({ data: { pollId, optionId, voterId: usuario.id } }),
        db.pollOption.update({ where: { id: optionId }, data: { votesCount: { increment: 1 } } }),
        db.poll.update({ where: { id: pollId }, data: { votesCount: { increment: 1 } } }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new DomainError("Ya votaste en esta.");
      throw e;
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}

/** "Mandar mi pronóstico" (pantalla 13): se puede cambiar hasta 1 minuto antes del partido */
export async function pronosticar(entrada: unknown): Promise<Resultado> {
  try {
    const { matchId, local, visita } = pronosticarSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "prediction.create", { matchId });
    const partido = await partidoDelDia(matchId);
    if (!partido) throw new NotFoundError("No encontramos ese partido.");
    if (quinielaCerrada(partido, new Date())) throw new DomainError("Ya cerró la quiniela de este partido.");
    await db.prediction.upsert({
      where: { userId_matchId: { userId: usuario.id, matchId } },
      create: { userId: usuario.id, matchId, homeGoals: local, awayGoals: visita },
      update: { homeGoals: local, awayGoals: visita },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}
