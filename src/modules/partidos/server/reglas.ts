import type { AuthzContext } from "@/modules/core";

/**
 * Permisos del partido (docs/PERMISOS.md §4): por RELACIÓN con ESE partido, nunca por el rol activo.
 * Las búsquedas se inyectan para probar las reglas sin base.
 */

type Asignacion = { refereeId: string | null; refereeStatus: string | null } | null;

/**
 * El árbitro de ESE partido. Capturar la cédula pide además que haya aceptado el partido ("asignado y
 * aceptado"); contestar las correcciones de su cédula, no.
 */
export function reglaArbitroDelPartido(asignacionDe: (matchId: string) => Promise<Asignacion>, { aceptado = false } = {}) {
  return async (userId: string, ctx: AuthzContext) => {
    if (!ctx.matchId) return false;
    const a = await asignacionDe(ctx.matchId);
    if (!a || a.refereeId !== userId) return false;
    return !aceptado || a.refereeStatus === "ACEPTADO";
  };
}
