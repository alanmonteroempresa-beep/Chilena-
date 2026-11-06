import type { AuthzContext } from "@/modules/core";

/**
 * Permisos del equipo (docs/PERMISOS.md §3): por RELACIÓN con ese equipo, nunca por el rol activo.
 * Las búsquedas se inyectan para probar las reglas sin base.
 */

/** Mandar el pase de lista y la alineación: delegado principal o auxiliar de ESE equipo */
export function reglaDelegadoDelEquipo(esDelegado: (userId: string, teamId: string) => Promise<boolean>) {
  return async (userId: string, ctx: AuthzContext) => (ctx.teamId ? esDelegado(userId, ctx.teamId) : false);
}

/** Contestar el pase de lista en la app: cada quien por sí mismo y solo de su equipo */
export function reglaContestarPorMi(esMiembro: (userId: string, teamId: string) => Promise<boolean>) {
  return async (userId: string, ctx: AuthzContext) => {
    if (!ctx.teamId) return false;
    if (ctx.targetUserId && ctx.targetUserId !== userId) return false;
    return esMiembro(userId, ctx.teamId);
  };
}
