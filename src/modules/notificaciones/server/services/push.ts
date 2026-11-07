/**
 * Push al celular (docs/NOTIFICACIONES.md §1 y §2). Puro: qué avisos llegan como push y cuándo no.
 * - Pocas y útiles: solo los tipos ★ del catálogo, más "Vota el MVP" (decisión de la beta).
 * - Horario silencioso de 23:00 a 07:00 (CDMX); el recordatorio del partido sí llega (falta menos de 3 h).
 */
import { formatInTimeZone } from "date-fns-tz";

const TZ = "America/Mexico_City";

/** Los que llegan al celular. Lo demás (social, insignias, carta) solo a la campana. */
export const TIPOS_PUSH = new Set([
  "RECORDATORIO_PARTIDO", // Te toca jugar
  "RESULTADO_OFICIAL", // Ya es oficial
  "VOTACION_ABIERTA", // Vota el MVP
  "PASE_DE_LISTA",
  "CEDULA_POR_FIRMAR",
  "CORRECCION_CEDULA",
  "ASIGNACION_ARBITRO",
  "NO_HAY_JUEGO",
  "PARTIDO_SUSPENDIDO",
]);

/** Los que pasan aunque sea de noche: el partido es en menos de 3 h */
const SIN_HORARIO = new Set(["RECORDATORIO_PARTIDO"]);

export const HORARIO_SILENCIOSO = { desde: 23, hasta: 7 } as const;

/** ¿Es de 23:00 a 06:59 en CDMX? */
export function enHorarioSilencioso(ahora: Date): boolean {
  const hora = Number(formatInTimeZone(ahora, TZ, "H"));
  return hora >= HORARIO_SILENCIOSO.desde || hora < HORARIO_SILENCIOSO.hasta;
}

/** ¿Este aviso también va como push ahora? */
export function debeMandarPush(tipo: string, ahora: Date): boolean {
  if (!TIPOS_PUSH.has(tipo)) return false;
  return SIN_HORARIO.has(tipo) || !enHorarioSilencioso(ahora);
}

/** Lo que recibe el service worker (`public/sw.js`): título, texto y a dónde lleva al tocarlo */
export type PayloadPush = { title: string; body?: string | null; href?: string | null; tag?: string };

/** Solo rutas de Chilena: nunca una URL de afuera en el aviso */
export const hrefSeguro = (href: string | null | undefined) => (href && href.startsWith("/") && !href.startsWith("//") ? href : "/notificaciones");
