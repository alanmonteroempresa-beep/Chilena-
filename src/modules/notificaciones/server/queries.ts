import "server-only";
import type { NotificationType } from "@/generated/prisma/client";
import { db } from "@/shared/lib/db";

/** Avisos sin leer (el numerito de la campana) */
export const sinLeer = (userId: string) => db.notification.count({ where: { userId, readAt: null } });

/** Los avisos de la campana, lo más nuevo arriba (pantalla 09) */
export function avisosDe(userId: string, tipos?: NotificationType[], take = 60) {
  return db.notification.findMany({
    where: { userId, ...(tipos ? { type: { in: tipos } } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
      data: true,
      actor: { select: { nombre: true, sobrenombre: true } },
    },
  });
}

/** Abre un aviso: lo marca leído (solo si es de quien lo abre) y dice a dónde ir */
export async function abrirAviso(id: string, userId: string) {
  const aviso = await db.notification.findFirst({ where: { id, userId }, select: { href: true, readAt: true } });
  if (aviso && !aviso.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  return aviso?.href ?? null;
}
