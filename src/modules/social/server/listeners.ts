import "server-only";
import { registerRule } from "@/modules/core";
import { enqueueJob, registerJobHandler } from "@/modules/plataforma/server-api";
import { db } from "@/shared/lib/db";
import { on } from "@/shared/events/bus";
import { publicarInsignia, publicarPartido } from "./publicar";
import { ACCIONES_DE_CUALQUIER_CUENTA, reglaCualquierCuenta } from "./reglas";

const cuentaActiva = async (userId: string) => (await db.user.count({ where: { id: userId, deletedAt: null } })) > 0;

// Eventos que escucha el módulo `social` (ver CLAUDE.md del módulo).
export function registerListeners() {
  // Permisos sociales (PERMISOS.md §1)
  for (const accion of ACCIONES_DE_CUALQUIER_CUENTA) registerRule(accion, reglaCualquierCuenta(cuentaActiva));

  // El feed se llena solo con la cédula validada (PRD §6.1)
  on("match.validated", async ({ matchId }) => {
    await enqueueJob("feed.partido", { matchId });
  });
  on("badge.awarded", async ({ userId, badgeCode }) => {
    await enqueueJob("feed.insignia", { userId, badgeCode });
  });
  registerJobHandler("feed.partido", async (payload) => {
    await publicarPartido((payload as { matchId: string }).matchId);
  });
  registerJobHandler("feed.insignia", async (payload) => {
    const { userId, badgeCode } = payload as { userId: string; badgeCode: string };
    await publicarInsignia(userId, badgeCode);
  });
}
