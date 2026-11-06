/**
 * Selector de rol (pantallas 07 y 24 · PRD §3 y §5). Servicio puro: arma las opciones del chip a partir de
 * los roles de la persona y sus contextos (equipo, liga), y decide la opción activa y el botón central.
 */
import { ROLES, type Rol } from "@/shared/lib/roles";
import type { OpcionRol } from "@/shared/ui/role-switcher";

export type Contexto = OpcionRol & {
  /** Para el botón central: equipo (pase de lista) o liga (programar jornada) */
  slugEquipo?: string;
  slugLiga?: string;
};

/** Escudos neutros cuando el contexto no trae colores (ligas y roles sin equipo) */
const ESCUDO_NEUTRO: Record<Rol, OpcionRol["escudo"]> = {
  jugador: { color: "#0250B0", colorFranja: "#FFFFFF" },
  delegado: { color: "#6B2FD6", colorFranja: "#FFFFFF" },
  arbitro: { color: "#08716D", colorFranja: "#FFFFFF" },
  aficionado: { color: "#B8228F", colorFranja: "#FFFFFF" },
  liga: { color: "#262B33", colorFranja: "#C6D0DD" },
};

/** Qué dice el selector cuando tiene el rol pero todavía no un equipo o liga */
export const SIN_CONTEXTO: Record<Rol, { titulo: string; detalle: string }> = {
  jugador: { titulo: "Sin equipo", detalle: "Todavía no estás en un equipo" },
  delegado: { titulo: "Sin equipo", detalle: "Todavía no tienes equipo a tu cargo" },
  arbitro: { titulo: "Sin liga", detalle: "Todavía no arbitras en una liga" },
  aficionado: { titulo: "Sin equipos", detalle: "Sigue a tu equipo para ver su porra" },
  liga: { titulo: "Sin liga", detalle: "Todavía no administras una liga" },
};

/**
 * Una opción por contexto (equipo o liga), en el orden de ROLES. Si la persona tiene el rol pero ningún
 * contexto, sale una opción genérica para que pueda cambiar a ese rol igual.
 */
export function opcionesDeRol(roles: Rol[], contextos: Contexto[]): Contexto[] {
  const tiene = new Set(roles);
  return ROLES.filter((r) => tiene.has(r)).flatMap((rol) => {
    const suyos = contextos.filter((c) => c.rol === rol);
    if (suyos.length) return suyos;
    return [{ id: `${rol}:sin-contexto`, rol, ...SIN_CONTEXTO[rol], escudo: ESCUDO_NEUTRO[rol] }];
  });
}

/** La opción del rol activo (o la primera si el rol activo no aplica) */
export function opcionActiva(opciones: Contexto[], rolActivo: Rol | null): Contexto | undefined {
  return opciones.find((o) => o.rol === rolActivo) ?? opciones[0];
}

/** Ruta del botón central según el contexto (la de jugador y aficionado es fija: /publicar) */
export function hrefCentral(opcion: Contexto | undefined): string | undefined {
  if (!opcion) return undefined;
  if (opcion.rol === "delegado" && opcion.slugEquipo) return `/equipo/${opcion.slugEquipo}/pase-de-lista`;
  if (opcion.rol === "liga" && opcion.slugLiga) return `/admin/${opcion.slugLiga}/calendario`;
  return undefined;
}

export const escudoNeutro = (rol: Rol) => ESCUDO_NEUTRO[rol];
