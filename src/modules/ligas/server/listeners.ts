import "server-only";
import { registerRule } from "@/modules/core";
import { proveerInscritos } from "@/modules/partidos/server-api";
import { on } from "@/shared/events/bus";
import { inscritosDeEquipos, rolEnLiga } from "./queries";
import { reglaAdminDeLiga } from "./reglas";
import { recalcularTabla } from "./tabla";

// Eventos que escucha el módulo `ligas` (ver CLAUDE.md del módulo) y sus permisos (PERMISOS §4)
export function registerListeners() {
  registerRule("match.validate", reglaAdminDeLiga(rolEnLiga));
  // La cédula pregunta quién está inscrito en el torneo (tournament_rosters es de ligas)
  proveerInscritos(inscritosDeEquipos);
  // La tabla guardada sale de los partidos validados (PRD §7.13)
  on("match.validated", async ({ tournamentId }) => {
    if (tournamentId) await recalcularTabla(tournamentId);
  });
}
