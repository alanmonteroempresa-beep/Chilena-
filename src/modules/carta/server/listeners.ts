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
  registerJobHandler("carta.recalcular", async (payload) => {
    const { matchId } = payload as { matchId: string };
    await recalcularCartas(await jugadoresDelPartido(matchId));
  });
}
