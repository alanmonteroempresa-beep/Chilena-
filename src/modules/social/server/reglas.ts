import type { Action, AuthzContext } from "@/modules/core";

/**
 * Permisos sociales (docs/PERMISOS.md §1): echar 🔥, comentar en la porra, publicar como persona, seguir
 * y reportar los puede hacer cualquier cuenta activa; el visitante no (sin sesión `can` ya niega).
 * `cuentaActiva` se inyecta para probar la regla sin base.
 */
export const ACCIONES_DE_CUALQUIER_CUENTA = [
  "post.react",
  "comment.create",
  "post.create",
  "user.follow",
  "content.report",
] as const satisfies readonly Action[];

export function reglaCualquierCuenta(cuentaActiva: (userId: string) => Promise<boolean>) {
  return async (userId: string, ctx: AuthzContext) => {
    // Nadie se sigue ni se reporta a sí mismo
    if (ctx.targetUserId && ctx.targetUserId === userId) return false;
    return cuentaActiva(userId);
  };
}
