import "server-only";
import { proveerInscritos } from "@/modules/partidos/server-api";
import { inscritosDeEquipos } from "./queries";

// Eventos que escucha el módulo `ligas` (ver CLAUDE.md del módulo).
export function registerListeners() {
  // La cédula pregunta quién está inscrito en el torneo (tournament_rosters es de ligas)
  proveerInscritos(inscritosDeEquipos);
  // on("match.validated", async ({ matchId }) => { ... });
}
