import type { AuthzContext } from "@/modules/core";

/**
 * Permisos de la liga (docs/PERMISOS.md §4): por RELACIÓN con ESA liga, nunca por el rol activo.
 * La búsqueda se inyecta para probar las reglas sin base.
 */
export type RolDeLiga = "DUENO" | "ADMINISTRADOR" | "GESTOR";

/** Validar resultados (y contestar una corrección que el árbitro dejó 48 h sin contestar): Admin y Dueño */
export function reglaAdminDeLiga(rolEn: (userId: string, leagueId: string) => Promise<RolDeLiga | null>, roles: RolDeLiga[] = ["DUENO", "ADMINISTRADOR"]) {
  return async (userId: string, ctx: AuthzContext) => {
    if (!ctx.leagueId) return false;
    const rol = await rolEn(userId, ctx.leagueId);
    return rol != null && roles.includes(rol);
  };
}
