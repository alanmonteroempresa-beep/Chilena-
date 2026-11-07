import "server-only";
import { jugadoresDelPartido } from "@/modules/ligas/server-api";
import { enqueueJob, registerJobHandler } from "@/modules/plataforma/server-api";
import { on } from "@/shared/events/bus";
import { recalcularCartas } from "./persistir";

// Eventos que escucha el módulo `carta` (ver CLAUDE.md del módulo).
export function registerListeners() {
  // Al validar un partido: recalcular la carta y las insignias de las dos plantillas (en la cola)
  on("match.validated", async ({ matchId }) => {
    await enqueueJob("carta.recalcular", { matchId });
  });
  // Cerró una votación (MVP, El Muro…): CRK y las insignias votadas de los de ese partido
  on("poll.closed", async ({ matchId, winnerUserId }) => {
    if (matchId) await enqueueJob("carta.recalcular", { matchId });
    else if (winnerUserId) await enqueueJob("carta.recalcular", { userIds: [winnerUserId] });
  });
  registerJobHandler("carta.recalcular", async (payload) => {
    const { matchId, userIds } = payload as { matchId?: string; userIds?: string[] };
    await recalcularCartas(matchId ? await jugadoresDelPartido(matchId) : (userIds ?? []));
  });
}
