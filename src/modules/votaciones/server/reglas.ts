import type { AuthzContext } from "@/modules/core";

/**
 * Permisos de votaciones y quiniela (docs/PERMISOS.md §2): cualquier cuenta reclamada, y nadie vota por sí
 * mismo (`targetUserId` = el candidato). Que la votación siga abierta y que la quiniela no haya cerrado lo
 * revisa la acción con los servicios puros. `reclamada` se inyecta para probar la regla sin base.
 */
export function reglaCuentaReclamada(reclamada: (userId: string) => Promise<boolean>) {
  return async (userId: string, ctx: AuthzContext) => {
    if (ctx.targetUserId && ctx.targetUserId === userId) return false;
    return reclamada(userId);
  };
}
