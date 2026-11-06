import "server-only";
import { registerRule } from "@/modules/core";
import { esDelegadoDe, esMiembroDe } from "./queries";
import { reglaContestarPorMi, reglaDelegadoDelEquipo } from "./reglas";

// Eventos que escucha el módulo `equipos` (ver CLAUDE.md del módulo) y sus permisos (PERMISOS §3)
export function registerListeners() {
  registerRule("attendance.sendLink", reglaDelegadoDelEquipo(esDelegadoDe));
  registerRule("lineup.submit", reglaDelegadoDelEquipo(esDelegadoDe));
  registerRule("attendance.respond", reglaContestarPorMi(esMiembroDe));
  // La cédula (PERMISOS §4): firma y señala errores el delegado de ESE equipo; `partidos` revisa el partido
  registerRule("report.sign", reglaDelegadoDelEquipo(esDelegadoDe));
  registerRule("report.requestCorrection", reglaDelegadoDelEquipo(esDelegadoDe));
}
