"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/modules/core/server-api";
import { db } from "@/shared/lib/db";

/** "Marcar leídas" (pantalla 09): todos los avisos de quien está en sesión */
export async function marcarLeidas() {
  const usuario = await getCurrentUser();
  if (!usuario) return;
  await db.notification.updateMany({ where: { userId: usuario.id, readAt: null }, data: { readAt: new Date() } });
  refresh();
}
