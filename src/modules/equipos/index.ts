// API pública del módulo `equipos`. Otros módulos SOLO importan desde aquí.
export { registerListeners } from "./server/listeners";

// Gestión del equipo (pantalla 04 · PRD §7.6 y §7.11)
export {
  estadoEnPlantilla,
  necesitaAtencion,
  ordenarPlantilla,
  respuestaDe,
  resumenCuotas,
  resumenPaseDeLista,
  type EstadoEnPlantilla,
  type EstadoPago,
  type Respuesta,
} from "./server/services/plantilla";
