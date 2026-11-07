import "server-only";
import { registerRule } from "@/modules/core";
import { cuentaReclamada } from "@/modules/core/server-api";
import { reglaReportarFalla } from "./reglas";

// Permisos de `plataforma`: reportar una falla lo puede cualquier cuenta reclamada (pantalla 42)
export function registerListeners() {
  registerRule("bug.report", reglaReportarFalla(cuentaReclamada));
}
