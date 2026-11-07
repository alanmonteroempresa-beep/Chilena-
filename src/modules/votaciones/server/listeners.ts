import "server-only";
import { registerRule } from "@/modules/core";
import { registerJobHandler } from "@/modules/plataforma/server-api";
import { on } from "@/shared/events/bus";
import { abrirMvp, cerrarVotacion } from "./mvp";
import { cuentaReclamada } from "./queries";
import { calificarQuiniela } from "./quiniela";
import { reglaCuentaReclamada } from "./reglas";

// Eventos que escucha el módulo `votaciones` (ver CLAUDE.md del módulo) y sus permisos (PERMISOS §2)
export function registerListeners() {
  registerRule("poll.vote", reglaCuentaReclamada(cuentaReclamada));
  registerRule("prediction.create", reglaCuentaReclamada(cuentaReclamada));

  // Partido validado: califica la quiniela y abre la votación del MVP (regla 2: solo VALIDADO cuenta)
  on("match.validated", async ({ matchId }) => {
    await calificarQuiniela(matchId);
    await abrirMvp(matchId);
  });
  // El cierre lo programa `abrirMvp` en la cola (pg_cron la corre cada minuto)
  registerJobHandler("votacion.cerrar", async (payload) => {
    const { pollId } = payload as { pollId: string };
    await cerrarVotacion(pollId);
  });
}
