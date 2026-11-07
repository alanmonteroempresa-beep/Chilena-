// Registro central de listeners de eventos. Lo carga shared/events/bus.ts la primera vez que se emite algo
// (y la cola antes de correr trabajos). Va por server-api: los listeners usan la base y la cola.
import { registerListeners as carta } from "@/modules/carta/server-api";
import { registerListeners as comunidad } from "@/modules/comunidad/server-api";
import { registerListeners as equipos } from "@/modules/equipos/server-api";
import { registerListeners as ligas } from "@/modules/ligas/server-api";
import { registerListeners as notificaciones } from "@/modules/notificaciones/server-api";
import { registerListeners as partidos } from "@/modules/partidos/server-api";
import { registerListeners as plataforma } from "@/modules/plataforma/server-api";
import { registerListeners as social } from "@/modules/social/server-api";
import { registerListeners as votaciones } from "@/modules/votaciones/server-api";

export function registerAllListeners() {
  for (const register of [partidos, ligas, equipos, carta, social, votaciones, comunidad, notificaciones, plataforma]) {
    register();
  }
}
