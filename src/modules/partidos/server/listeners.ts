import "server-only";
import { registerRule } from "@/modules/core";
import { arbitroDelPartido } from "./queries";
import { reglaArbitroDelPartido } from "./reglas";

// Eventos que escucha el módulo `partidos` (ver CLAUDE.md del módulo) y sus permisos (PERMISOS §4).
// Firmar y señalar son del delegado de ESE equipo: los registra `equipos`, que sabe quién es delegado.
export function registerListeners() {
  registerRule("report.capture", reglaArbitroDelPartido(arbitroDelPartido, { aceptado: true }));
  registerRule("report.respondCorrection", reglaArbitroDelPartido(arbitroDelPartido));
}
