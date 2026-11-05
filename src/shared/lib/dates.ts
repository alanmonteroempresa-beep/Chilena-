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
