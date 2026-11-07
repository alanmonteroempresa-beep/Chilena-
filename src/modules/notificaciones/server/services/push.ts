/**
 * Push al celular (docs/NOTIFICACIONES.md §1 y §2). Puro: qué avisos llegan como push y cuándo no.
 * - Pocas y útiles: solo los tipos ★ del catálogo, más "Vota el MVP" (lo pidió Alan para la beta).
 * - Horario silencioso de 23:00 a 07:00 (CDMX), salvo si tu partido es en menos de 3 h.
 */
import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "@/shared/lib/dates";

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

/** De noche sí suena si tu partido es en menos de 3 h ("Te toca jugar", "No hay juego" a las 6:30…) */
export const PARTIDO_CERCA_MS = 3 * 3_600_000;

export const HORARIO_SILENCIOSO = { desde: 23, hasta: 7 } as const;

/** ¿Es de 23:00 a 06:59 en CDMX? */
export function enHorarioSilencioso(ahora: Date): boolean {
  const hora = Number(formatInTimeZone(ahora, TZ, "H"));
  return hora >= HORARIO_SILENCIOSO.desde || hora < HORARIO_SILENCIOSO.hasta;
}

/** ¿Este aviso también va como push ahora? `partidoEn`: la hora del partido del que habla, si la hay. */
export function debeMandarPush(tipo: string, ahora: Date, partidoEn?: Date | null): boolean {
  if (!TIPOS_PUSH.has(tipo)) return false;
  if (!enHorarioSilencioso(ahora)) return true;
  if (!partidoEn) return false;
  const falta = partidoEn.getTime() - ahora.getTime();
  return falta > 0 && falta <= PARTIDO_CERCA_MS;
}

/** Cuánto lo guarda el servicio de push si el celular está apagado: el recordatorio no sirve después del partido */
export const vidaDelPush = (tipo: string) => (tipo === "RECORDATORIO_PARTIDO" ? 3600 : 6 * 3600);

/** Solo servicios de push de verdad (Chrome, Firefox, Safari, Edge): nunca una URL cualquiera */
export function esServicioDePush(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const h = u.hostname;
    return (
      h === "fcm.googleapis.com" ||
      h === "android.googleapis.com" ||
      h.endsWith(".push.services.mozilla.com") ||
      h === "web.push.apple.com" ||
      h.endsWith(".push.apple.com") ||
      h.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}

/** Cuántos celulares por cuenta (se borra el más viejo) */
export const MAXIMO_CELULARES = 5;

/** Lo que recibe el service worker (`public/sw.js`): título, texto y a dónde lleva al tocarlo */
export type PayloadPush = { title: string; body?: string | null; href?: string | null; tag?: string };

/** Solo rutas de Chilena: nunca una URL de afuera en el aviso */
export const hrefSeguro = (href: string | null | undefined) => (href && href.startsWith("/") && !href.startsWith("//") ? href : "/notificaciones");
