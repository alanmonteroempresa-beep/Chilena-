/**
 * Reportar falla (pantalla 42 · PERMISOS): cualquier cuenta reclamada. `reclamada` se inyecta para probar la
 * regla sin base.
 */
export function reglaReportarFalla(reclamada: (userId: string) => Promise<boolean>) {
  return async (userId: string) => reclamada(userId);
}
