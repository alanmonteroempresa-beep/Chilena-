// API pública de servidor del módulo `notificaciones` (no la importes desde componentes cliente).
export { registerListeners } from "./server/listeners";
export { notificar } from "./server/notificar";
export { abrirAviso, sinLeer } from "./server/queries";
export { Campana } from "./components/campana";
export type { Pestana } from "./server/services/campana";
export { mandarRecordatorios, olvidarRecordatorios } from "./server/recordatorios";
export { mandarPush } from "./server/push";
