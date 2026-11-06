import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

/** Zona de negocio. Se guarda en UTC y se muestra en CDMX. */
export const TZ = "America/Mexico_City";

export function formatCDMX(date: Date, pattern = "EEE d 'de' MMM · HH:mm"): string {
  return formatInTimeZone(date, TZ, pattern, { locale: es });
}

/** Lunes 00:00 (hora CDMX) de la semana de `date`, en UTC. Lo usan las fotos semanales de la carta. */
export function mondayOfWeekCDMX(date: Date): Date {
  const zoned = toZonedTime(date, TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return fromZonedTime(monday, TZ);
}

const DIA = 86_400_000;

/** "2026-11-06": el día de hoy en CDMX (para comparar con fechas sin hora, `@db.Date`) */
export const hoyCDMX = (ahora: Date) => formatInTimeZone(ahora, TZ, "yyyy-MM-dd");

/**
 * Vencimiento de una cuota o cargo (`@db.Date`, sin hora) visto desde hoy en CDMX (pantallas 03 y 04):
 * "vence hoy" · "vence mañana, sáb 7" · "vence el sáb 7" · "venció ayer, jue 5" · "venció el mar 3"
 */
export function textoVencimiento(vence: Date, ahora: Date): string {
  const v = vence.toISOString().slice(0, 10);
  const dias = Math.round((Date.parse(`${v}T00:00:00Z`) - Date.parse(`${hoyCDMX(ahora)}T00:00:00Z`)) / DIA);
  const dia = formatInTimeZone(vence, "UTC", "EEE d", { locale: es }).replace(".", "");
  if (dias === 0) return "vence hoy";
  if (dias === 1) return `vence mañana, ${dia}`;
  if (dias === -1) return `venció ayer, ${dia}`;
  return dias < 0 ? `venció el ${dia}` : `vence el ${dia}`;
}

/** El mes en curso en CDMX como rango de fechas sin hora: [desde, hasta) y su nombre ("noviembre") */
export function mesCDMX(ahora: Date): { desde: Date; hasta: Date; nombre: string } {
  const [y, m] = hoyCDMX(ahora).split("-").map(Number);
  return {
    desde: new Date(Date.UTC(y, m - 1, 1)),
    hasta: new Date(Date.UTC(y, m, 1)),
    nombre: formatInTimeZone(new Date(Date.UTC(y, m - 1, 15)), "UTC", "MMMM", { locale: es }),
  };
}
