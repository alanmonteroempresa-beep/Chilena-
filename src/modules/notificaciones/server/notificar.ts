import "server-only";
import type { NotificationType, Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/lib/db";
import { quienes, VENTANA_AGRUPAR_MS } from "./services/campana";

type Aviso = {
  userIds: string[];
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  data?: Record<string, unknown>;
  /** Lo social se agrupa (docs/NOTIFICACIONES.md §1): mismo aviso sin leer de los últimos 10 min */
  agrupar?: { clave: string; nombre: string; titulo: (quienes: string, cuantos: number) => string };
};

/**
 * `notify()` de docs/NOTIFICACIONES.md: guarda en `notifications` (la campana). Nunca a quien hizo la
 * acción ni a perfiles sin reclamar. Push y Broadcast llegan con la PWA.
 */
export async function notificar(a: Aviso) {
  const ids = [...new Set(a.userIds)].filter((id) => id && id !== a.actorId);
  if (!ids.length) return 0;
  const reclamados = await db.user.findMany({
    where: { id: { in: ids }, authId: { not: null }, deletedAt: null },
    select: { id: true },
  });
  let n = 0;
  for (const { id } of reclamados) {
    if (a.agrupar) {
      const previo = await db.notification.findFirst({
        where: {
          userId: id,
          type: a.type,
          readAt: null,
          createdAt: { gte: new Date(Date.now() - VENTANA_AGRUPAR_MS) },
          data: { path: ["clave"], equals: a.agrupar.clave },
        },
        select: { id: true, data: true },
      });
      if (previo) {
        const actores = [...((previo.data as { actores?: string[] } | null)?.actores ?? []), a.agrupar.nombre];
        const unicos = [...new Set(actores)];
        await db.notification.update({
          where: { id: previo.id },
          data: {
            title: a.agrupar.titulo(quienes(unicos), unicos.length),
            actorId: a.actorId ?? null,
            data: { ...(previo.data as object), actores: unicos } as Prisma.InputJsonValue,
            createdAt: new Date(),
          },
        });
        n++;
        continue;
      }
    }
    await db.notification.create({
      data: {
        userId: id,
        actorId: a.actorId ?? null,
        type: a.type,
        title: a.title.slice(0, 200),
        body: a.body ?? null,
        href: a.href ?? null,
        data: { ...(a.data ?? {}), ...(a.agrupar ? { clave: a.agrupar.clave, actores: [a.agrupar.nombre] } : {}) } as Prisma.InputJsonValue,
      },
    });
    n++;
  }
  return n;
}
