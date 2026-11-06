/**
 * El próximo partido en el inicio (pantallas 02, 03, 04, 05 y 18). Servicio puro: sin base de datos ni Next.
 * Fechas en la zona de negocio (CDMX); se guardan en UTC.
 */
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { TZ } from "@/shared/lib/dates";

const HORA = 3_600_000;

/** "05 DÍAS · 19 HORAS" (pantalla 03). Ya empezado o en el pasado: 0 y 0. */
export function cuentaRegresiva(ahora: Date, inicio: Date): { dias: number; horas: number } {
  const falta = Math.max(0, inicio.getTime() - ahora.getTime());
  const horasTotales = Math.floor(falta / HORA);
  return { dias: Math.floor(horasTotales / 24), horas: horasTotales % 24 };
}

const diaCDMX = (d: Date) => formatInTimeZone(d, TZ, "yyyy-MM-dd");

function diasEntre(ahora: Date, inicio: Date): number {
  const a = new Date(`${diaCDMX(ahora)}T00:00:00Z`).getTime();
  const b = new Date(`${diaCDMX(inicio)}T00:00:00Z`).getTime();
  return Math.round((b - a) / (24 * HORA));
}

/**
 * Titular de momento del próximo partido: "TE TOCA / EL DOMINGO" (pantalla 03).
 * Hoy → "TE TOCA / HOY"; mañana → "TE TOCA / MAÑANA"; en la semana → el día; más lejos → la fecha.
 */
export function cuandoTeToca(ahora: Date, inicio: Date): string {
  const dias = diasEntre(ahora, inicio);
  if (dias <= 0) return "HOY";
  if (dias === 1) return "MAÑANA";
  if (dias < 7) return `EL ${formatInTimeZone(inicio, TZ, "EEEE", { locale: es }).toUpperCase()}`;
  return `EL ${formatInTimeZone(inicio, TZ, "d 'DE' MMMM", { locale: es }).toUpperCase()}`;
}

const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Dom 8 · 11:00 · Cancha 2" (pantallas 03 y 05) */
export function horarioCorto(inicio: Date, cancha?: string | null): string {
  const dia = conMayuscula(formatInTimeZone(inicio, TZ, "EEE d", { locale: es }).replace(".", ""));
  const hora = formatInTimeZone(inicio, TZ, "HH:mm");
  return [dia, hora, cancha].filter(Boolean).join(" · ");
}

/** "09:00" en CDMX */
export const horaCDMX = (d: Date) => formatInTimeZone(d, TZ, "HH:mm");

/** "DOMINGO 8" en CDMX (encabezado de la jornada, pantalla 18) */
export const diaDeLaJornada = (d: Date) =>
  formatInTimeZone(d, TZ, "EEEE d", { locale: es }).toUpperCase();
