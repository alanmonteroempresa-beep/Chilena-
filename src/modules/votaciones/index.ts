// API pública del módulo `votaciones`. Otros módulos SOLO importan desde aquí.
// Sus listeners se registran desde server-api.ts (src/modules/listeners.ts).
export { votosParaLaCarta, cierreDelMvp, ganadorDelMvp } from "./server/services/mvp";
export { puntosDelPronostico, quinielaCerrada } from "./server/services/quiniela";
export { cuandoCierra, yaVotaron } from "./server/services/textos";
