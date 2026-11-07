// API pública del módulo `notificaciones`. Otros módulos SOLO importan desde aquí.
// Sus listeners se registran desde server-api.ts (src/modules/listeners.ts).
// "Activar avisos" (push al celular): perfil, campana e instalar
export { ActivarAvisos } from "./components/activar-avisos";
