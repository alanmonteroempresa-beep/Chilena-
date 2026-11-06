/**
 * Gestión del equipo (pantalla 04 · PRD §7.6 y §7.11). Servicio puro: sin base de datos ni Next.
 * Plantilla "primero los que necesitan atención", pase de lista y cuotas.
 */

/** Chip de la plantilla: Suspendido (rojo) · Cuota pendiente / En revisión (ámbar) · Habilitado */
export type EstadoEnPlantilla = "SUSPENDIDO" | "CUOTA_PENDIENTE" | "EN_REVISION" | "HABILITADO";
/** Lo que contestó al pase de lista del domingo */
export type Respuesta = "VA" | "NO_VA" | "LESIONADO" | "SIN_RESPUESTA";
export type EstadoPago = "PENDIENTE" | "REPORTADO" | "CONFIRMADO" | "CONDONADO";

/** AttendanceStatus → respuesta. CONVOCADO = todavía no contesta. */
export function respuestaDe(status: string | null | undefined): Respuesta {
  switch (status) {
    case "VA":
    case "PRESENTE":
      return "VA";
    case "NO_VA":
    case "AUSENTE":
      return "NO_VA";
    case "LESIONADO":
      return "LESIONADO";
    default:
      return "SIN_RESPUESTA";
  }
}

/**
 * Suspendido manda (no puede jugar, §7.6). La cuota es ámbar: "asunto interno del equipo".
 * "Ya pagué" sin confirmar queda En revisión (§7.11). Sin cuota del mes o pagada: Habilitado.
 */
export function estadoEnPlantilla(j: { suspendido: boolean; pagoCuota?: EstadoPago | null }): EstadoEnPlantilla {
  if (j.suspendido) return "SUSPENDIDO";
  if (j.pagoCuota === "PENDIENTE") return "CUOTA_PENDIENTE";
  if (j.pagoCuota === "REPORTADO") return "EN_REVISION";
  return "HABILITADO";
}

const PESO_ESTADO: Record<EstadoEnPlantilla, number> = {
  SUSPENDIDO: 0,
  CUOTA_PENDIENTE: 1,
  EN_REVISION: 2,
  HABILITADO: 3,
};
const PESO_RESPUESTA: Record<Respuesta, number> = { NO_VA: 0, SIN_RESPUESTA: 1, LESIONADO: 2, VA: 3 };

/** "Primero los que necesitan atención" (pantalla 04): estado, luego respuesta, luego dorsal */
export function ordenarPlantilla<T extends { estado: EstadoEnPlantilla; respuesta: Respuesta; numero: number | null }>(
  jugadores: T[],
): T[] {
  return [...jugadores].sort(
    (a, b) =>
      PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] ||
      PESO_RESPUESTA[a.respuesta] - PESO_RESPUESTA[b.respuesta] ||
      (a.numero ?? 999) - (b.numero ?? 999),
  );
}

/** ¿Necesita atención? Lo que cuenta el filtro "Atención · 5" del diseño */
export const necesitaAtencion = (j: { estado: EstadoEnPlantilla; respuesta: Respuesta }) =>
  j.estado !== "HABILITADO" || j.respuesta === "NO_VA" || j.respuesta === "SIN_RESPUESTA";

/** "11/16 van el domingo · 3 sin contestar" (pantallas 04 y 20). El suspendido cuenta en el total (§7.6). */
export function resumenPaseDeLista(respuestas: Respuesta[]) {
  return {
    total: respuestas.length,
    van: respuestas.filter((r) => r === "VA").length,
    noVan: respuestas.filter((r) => r === "NO_VA" || r === "LESIONADO").length,
    sinContestar: respuestas.filter((r) => r === "SIN_RESPUESTA").length,
  };
}

/** "Cuotas al corriente 14/16 · 2 deben $1,300" (pantalla 04). Condonado cuenta como al corriente. */
export function resumenCuotas(pagos: EstadoPago[], montoCents: number) {
  const deben = pagos.filter((p) => p === "PENDIENTE").length;
  return {
    total: pagos.length,
    alCorriente: pagos.filter((p) => p === "CONFIRMADO" || p === "CONDONADO").length,
    enRevision: pagos.filter((p) => p === "REPORTADO").length,
    deben,
    adeudoCents: deben * montoCents,
  };
}
