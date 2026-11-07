"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { assertCan, DomainError } from "@/modules/core";
import { getCurrentUser } from "@/modules/core/server-api";
import { asegurarListeners } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { quitarSuscripcionSchema, suscripcionSchema } from "../schemas";
import { mandarPush } from "./push";

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function fallo(error: unknown): { ok: false; error: string } {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  logger.error("acción de avisos falló", { error: String(error) });
  return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
}

async function quien() {
  const usuario = await getCurrentUser();
  if (!usuario) throw new DomainError("Entra para activar los avisos.", "SIN_SESION");
  await asegurarListeners();
  await assertCan(usuario.id, "push.subscribe");
  return usuario;
}

/** "Activar avisos": guarda el celular de quien está en sesión (si el celular era de otra cuenta, pasa a esta) */
export async function guardarSuscripcion(entrada: unknown): Promise<Resultado> {
  try {
    const s = suscripcionSchema.parse(entrada);
    const usuario = await quien();
    const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
    await db.pushSubscription.upsert({
      where: { endpoint: s.endpoint },
      create: { userId: usuario.id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, userAgent },
      update: { userId: usuario.id, p256dh: s.keys.p256dh, auth: s.keys.auth, userAgent },
    });
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}

/** "Apagar avisos en este celular" */
export async function quitarSuscripcion(entrada: unknown): Promise<Resultado> {
  try {
    const { endpoint } = quitarSuscripcionSchema.parse(entrada);
    const usuario = await quien();
    await db.pushSubscription.deleteMany({ where: { endpoint, userId: usuario.id } });
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}

/** "Mandarme uno de prueba": un push a sus celulares, para ver cómo llegan */
export async function avisoDePrueba(): Promise<Resultado<{ enviados: number }>> {
  try {
    const usuario = await quien();
    const r = await mandarPush([usuario.id], {
      title: "Así te llegan los avisos de Chilena ⚽",
      body: "Te avisamos cuando te toque jugar, cuando sea oficial y cuando haya que votar al MVP.",
      href: "/notificaciones",
      tag: "PRUEBA",
    });
    if (!r.enviados) throw new DomainError("No encontramos este celular. Apaga y vuelve a activar los avisos.");
    return { ok: true, enviados: r.enviados };
  } catch (e) {
    return fallo(e);
  }
}

/** "Marcar leídas" (pantalla 09): todos los avisos de quien está en sesión */
export async function marcarLeidas() {
  const usuario = await getCurrentUser();
  if (!usuario) return;
  await db.notification.updateMany({ where: { userId: usuario.id, readAt: null }, data: { readAt: new Date() } });
  refresh();
}
