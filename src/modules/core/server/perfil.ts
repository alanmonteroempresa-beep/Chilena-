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

/** Lo que necesita la carta de cada jugador (posición y si es pionero de la beta) */
export function perfilesDeJugadores(userIds: string[]) {
  return db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, isPionero: true, claimedAt: true, playerProfile: { select: { posicionPrincipal: true } } },
  });
}

/** Nombre y username públicos de varias personas (avisos de la campana) */
export function personasPorId(ids: string[]) {
  return db.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, nombre: true, sobrenombre: true } });
}
