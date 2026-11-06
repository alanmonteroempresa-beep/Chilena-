import "server-only";
import { cache } from "react";
import { opcionActiva, opcionesDeRol } from "@/modules/core";
import { getCurrentUser } from "@/modules/core/server-api";
import { contextosDeRolEnEquipos } from "@/modules/equipos/server-api";
import { contextosDeRolEnLigas } from "@/modules/ligas/server-api";
import { rolDesdeRoleType, type Rol } from "@/shared/lib/roles";

/**
 * La sesión del recorrido: persona, opciones del selector de rol (equipos y ligas) y la opción activa.
 * Con cache() el layout y la página comparten las mismas consultas en cada petición.
 */
export const sesionActiva = cache(async () => {
  const usuario = await getCurrentUser();
  if (!usuario) return null;
  const [deEquipos, deLigas] = await Promise.all([
    contextosDeRolEnEquipos(usuario.id),
    contextosDeRolEnLigas(usuario.id),
  ]);
  const roles = usuario.roles.map((r) => rolDesdeRoleType(r.role)).filter((r): r is Rol => r !== null);
  const opciones = opcionesDeRol(roles, [...deEquipos, ...deLigas]);
  const activa = opcionActiva(opciones, rolDesdeRoleType(usuario.activeRole));
  return { usuario, opciones, activa };
});
