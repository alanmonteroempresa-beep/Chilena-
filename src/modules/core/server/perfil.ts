import "server-only";
import { db } from "@/shared/lib/db";
import { publicUserSelect } from "./queries";

/**
 * Perfil público (pantallas 06, 14, 25 y 28): solo `publicUserSelect` y, del perfil de jugador, lo que
 * no es privado (nada de tallas ni de la regla 8).
 */
export function perfilPublico(username: string) {
  return db.user.findFirst({
    where: { username, deletedAt: null },
    select: {
      ...publicUserSelect,
      playerProfile: {
        select: {
          posicionPrincipal: true,
          pieHabil: true,
          partidos: true,
          goles: true,
          asistencias: true,
          amarillas: true,
          rojas: true,
          titulos: true,
        },
      },
      roles: { select: { role: true } },
    },
  });
}
