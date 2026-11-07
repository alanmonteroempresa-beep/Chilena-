import "server-only";
import { registerRule } from "@/modules/core";
import { db } from "@/shared/lib/db";

const reclamada = async (userId: string) => (await db.user.count({ where: { id: userId, deletedAt: null, authId: { not: null } } })) > 0;

// Permisos de `plataforma`: reportar una falla lo puede cualquier cuenta reclamada (pantalla 42)
export function registerListeners() {
  registerRule("bug.report", (userId) => reclamada(userId));
}
