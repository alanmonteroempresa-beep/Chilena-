// API pública del módulo `equipos`. Otros módulos SOLO importan desde aquí.

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

// Día de partido: botones del jugador (cliente)
export { BotonesAsistencia } from "./components/dia-de-partido/botones-asistencia";
