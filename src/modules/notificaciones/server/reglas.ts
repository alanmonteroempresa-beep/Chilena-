/**
 * Activar avisos en su celular (docs/PERMISOS.md): cualquier cuenta reclamada, para sí misma.
 * `reclamada` se inyecta para probar la regla sin base.
 */
export function reglaCuentaReclamada(reclamada: (userId: string) => Promise<boolean>) {
  return async (userId: string) => reclamada(userId);
}
