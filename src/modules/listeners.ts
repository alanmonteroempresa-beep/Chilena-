// Registro central de listeners de eventos. Lo carga shared/events/bus.ts la primera vez que se emite algo.
import { registerListeners as carta } from "@/modules/carta";
import { registerListeners as comunidad } from "@/modules/comunidad";
import { registerListeners as equipos } from "@/modules/equipos";
import { registerListeners as ligas } from "@/modules/ligas";
import { registerListeners as notificaciones } from "@/modules/notificaciones";
import { registerListeners as partidos } from "@/modules/partidos";
import { registerListeners as social } from "@/modules/social";
import { registerListeners as votaciones } from "@/modules/votaciones";

export function registerAllListeners() {
  for (const register of [partidos, ligas, equipos, carta, social, votaciones, comunidad, notificaciones]) {
    register();
  }
}
