import "server-only";
import { enqueueJob, registerJobHandler } from "@/modules/plataforma/server-api";
import { on } from "@/shared/events/bus";
import { publicarInsignia, publicarPartido } from "./publicar";

// Eventos que escucha el módulo `social` (ver CLAUDE.md del módulo).
export function registerListeners() {
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
