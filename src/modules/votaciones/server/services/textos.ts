/** Textos de las votaciones y la quiniela (pantallas 12 y 13). Puro. */
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const TZ = "America/Mexico_City";
const dia = (d: Date) => formatInTimeZone(d, TZ, "yyyy-MM-dd");

/** "hoy a las 22:00", "mañana a las 22:00", "el domingo a las 10:59" (CDMX) */
export function cuandoCierra(cierre: Date, ahora: Date): string {
  const hora = formatInTimeZone(cierre, TZ, "HH:mm");
  if (dia(cierre) === dia(ahora)) return `hoy a las ${hora}`;
  if (dia(cierre) === dia(new Date(ahora.getTime() + 86_400_000))) return `mañana a las ${hora}`;
  return `el ${formatInTimeZone(cierre, TZ, "EEEE", { locale: es })} a las ${hora}`;
}

/** "418 ya votaron", "1 ya votó", "Nadie ha votado" */
export function yaVotaron(n: number): string {
  if (!n) return "Nadie ha votado";
  return `${n} ya vot${n === 1 ? "ó" : "aron"}`;
}
