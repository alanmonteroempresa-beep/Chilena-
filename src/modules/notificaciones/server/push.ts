import "server-only";
import webpush, { WebPushError } from "web-push";
import type { NotificationType } from "@/generated/prisma/client";
import { isEnabled } from "@/modules/core/server-api";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { hrefSeguro, vidaDelPush, type PayloadPush } from "./services/push";

// Push web con VAPID (docs/NOTIFICACIONES.md). Las llaves viven solo en el servidor (CLAUDE.md, Variables).
let listo: boolean | null = null;
function configurar() {
  if (listo != null) return listo;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) {
    logger.warn("push sin llaves VAPID: solo campana");
    return (listo = false);
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hola@chilena.mx", publica, privada);
  return (listo = true);
}

/**
 * Manda un push a todos los celulares de estas personas (sus suscripciones). Las que el servicio da por
 * muertas (404/410) se borran. Respeta el flag `push.enabled` y la preferencia por tipo si se pasa `tipo`.
 */
export async function mandarPush(userIds: string[], payload: PayloadPush, { tipo }: { tipo?: NotificationType } = {}) {
  const nada = { enviados: 0, muertos: 0, personas: new Set<string>() };
  if (!userIds.length || !configurar() || !(await isEnabled("push.enabled"))) return nada;
  const apagados = tipo
    ? new Set(
        (await db.notificationPreference.findMany({ where: { userId: { in: userIds }, type: tipo, push: false }, select: { userId: true } })).map(
          (p) => p.userId,
        ),
      )
    : new Set<string>();
  const subs = await db.pushSubscription.findMany({
    where: { userId: { in: userIds.filter((u) => !apagados.has(u)) } },
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
  });
  const cuerpo = JSON.stringify({ title: payload.title, body: payload.body ?? "", href: hrefSeguro(payload.href), tag: payload.tag });
  const resultados = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, cuerpo, {
        TTL: vidaDelPush(tipo ?? ""),
        urgency: "high",
        timeout: 8000,
      }),
    ),
  );
  const muertos: string[] = [];
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") return;
    const e = r.reason;
    if (e instanceof WebPushError && (e.statusCode === 404 || e.statusCode === 410)) muertos.push(subs[i].id);
    logger.warn("push falló", {
      status: e instanceof WebPushError ? e.statusCode : null,
      servicio: new URL(subs[i].endpoint).hostname,
      cuerpo: e instanceof WebPushError ? String(e.body).slice(0, 200) : String(e).slice(0, 200),
    });
  });
  if (muertos.length) await db.pushSubscription.deleteMany({ where: { id: { in: muertos } } });
  const enviados = resultados.filter((r) => r.status === "fulfilled").length;
  return { enviados, muertos: muertos.length, personas: new Set(subs.filter((_, i) => resultados[i].status === "fulfilled").map((s) => s.userId)) };
}
