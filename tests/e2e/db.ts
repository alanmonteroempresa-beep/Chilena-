import { execFileSync } from "node:child_process";

// Lo que escriben los E2E en chilena-dev (la misma base de las cuentas de prueba) lleva esta marca y se
// borra al terminar con scripts/limpiar-e2e.ts.
export const MARCA = "[e2e]";

export function limpiarE2E() {
  execFileSync("npx", ["tsx", "scripts/limpiar-e2e.ts"], { stdio: "inherit" });
}
