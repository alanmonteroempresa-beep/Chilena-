import type { RoleType } from "@/generated/prisma/enums";

/**
 * Roles visibles en la app y su botón central de la barra inferior.
 * docs/DISENO.md §3.3 (acento por rol) · docs/PRD.md §5 (navegación) · pantallas 07b, 23, 24
 *
 * El valor coincide con `data-role` en globals.css. "visitante" = sin sesión (sin acento).
 */
export const ROLES = ["jugador", "delegado", "arbitro", "aficionado", "liga"] as const;
export type Rol = (typeof ROLES)[number];
export type RolOVisitante = Rol | "visitante";

export const ETIQUETA_ROL: Record<Rol, string> = {
  jugador: "Jugador",
  delegado: "Delegado",
  arbitro: "Árbitro",
  aficionado: "Aficionado",
  liga: "Liga",
};

/** RoleType del schema → rol de la interfaz. SUPERADMIN no es un modo de la app. */
export function rolDesdeRoleType(roleType: RoleType): Rol | null {
  switch (roleType) {
    case "JUGADOR":
      return "jugador";
    case "DELEGADO":
      return "delegado";
    case "ARBITRO":
      return "arbitro";
    case "AFICIONADO":
      return "aficionado";
    case "LIGA":
      return "liga";
    default:
      return null;
  }
}

export type ClaveAccionCentral = "publicar" | "pase-de-lista" | "capturar" | "programar-jornada";

export type AccionCentral = {
  clave: ClaveAccionCentral;
  /** Texto bajo el botón (cabe en 1/5 de 390 px) */
  etiqueta: string;
  /** Nombre accesible completo */
  nombre: string;
  /**
   * Ruta fija si no depende del contexto. `null` = la pone quien compone la barra
   * (el pase de lista depende del equipo y "Programar jornada" de la liga).
   */
  href: string | null;
};

/** PRD §5: Jugador y Aficionado → Publicar · Delegado → Pase de lista · Árbitro → Capturar · Liga → Programar jornada */
export function accionCentral(rol: RolOVisitante): AccionCentral {
  switch (rol) {
    case "delegado":
      return { clave: "pase-de-lista", etiqueta: "Pase de lista", nombre: "Pase de lista", href: null };
    case "arbitro":
      // Pantalla 02: partidos de hoy + cédula
      return { clave: "capturar", etiqueta: "Capturar", nombre: "Capturar cédula", href: "/arbitro/hoy" };
    case "liga":
      return { clave: "programar-jornada", etiqueta: "Programar", nombre: "Programar jornada", href: null };
    default:
      return { clave: "publicar", etiqueta: "Publicar", nombre: "Publicar", href: "/publicar" };
  }
}
