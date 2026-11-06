/**
 * La campana (pantalla 09 · docs/NOTIFICACIONES.md). Servicio puro: sin base de datos ni Next.
 */
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { TZ } from "@/shared/lib/dates";

export type Pestana = "todas" | "partidos" | "social" | "liga";

const PARTIDOS = new Set([
  "PASE_DE_LISTA",
  "RECORDATORIO_PARTIDO",
  "PARTIDO_EN_VIVO",
  "RESULTADO_OFICIAL",
  "CEDULA_POR_FIRMAR",
  "CORRECCION_CEDULA",
  "ASIGNACION_ARBITRO",
  "NO_HAY_JUEGO",
  "PARTIDO_SUSPENDIDO",
  "ALERTA_TARJETAS",
  "VOTACION_ABIERTA",
  "QUINIELA",
]);
const LIGA = new Set(["SANCION", "CUOTA", "PAGO_REPORTADO", "LIGA", "RETA", "INVITACION_EQUIPO", "ALTA_EQUIPO", "PERFIL_CREADO"]);

/** Pestañas de la campana: Todas · Partidos · Social · Liga */
export function pestanaDe(tipo: string): Exclude<Pestana, "todas"> {
  if (PARTIDOS.has(tipo)) return "partidos";
  if (LIGA.has(tipo)) return "liga";
  return "social";
}

/** El chip de acción de cada aviso (pantalla 09: VER ROL · RESPONDER · FIRMAR · PAGAR) */
const ACCION: Record<string, string> = {
  PASE_DE_LISTA: "Contestar",
  RECORDATORIO_PARTIDO: "Ver rol",
  RESULTADO_OFICIAL: "Ver partido",
  CEDULA_POR_FIRMAR: "Firmar",
  CORRECCION_CEDULA: "Revisar",
  ASIGNACION_ARBITRO: "Ver partido",
  COMENTARIO: "Responder",
  CUOTA: "Pagar",
  PAGO_REPORTADO: "Confirmar",
  INSIGNIA: "Ver insignia",
  CARTA_ACTUALIZADA: "Ver carta",
  VOTACION_ABIERTA: "Votar",
  QUINIELA: "Pronosticar",
  NUEVO_SEGUIDOR: "Ver perfil",
};
export const accionDe = (tipo: string) => ACCION[tipo] ?? null;

const MIN = 60_000;
const HORA = 60 * MIN;

/** "hace 2 min" · "hace 3 h" · "dom 11" (CDMX) */
export function haceCuanto(fecha: Date, ahora: Date): string {
  const d = ahora.getTime() - fecha.getTime();
  if (d < MIN) return "ahorita";
  if (d < HORA) return `hace ${Math.floor(d / MIN)} min`;
  if (d < 24 * HORA) return `hace ${Math.floor(d / HORA)} h`;
  return formatInTimeZone(fecha, TZ, "EEE d", { locale: es }).replace(".", "");
}

/** Secciones de la lista: Hoy · Esta semana · Antes (por el día en CDMX) */
export function seccionDe(fecha: Date, ahora: Date): "Hoy" | "Esta semana" | "Antes" {
  const dia = (x: Date) => Date.parse(`${formatInTimeZone(x, TZ, "yyyy-MM-dd")}T00:00:00Z`);
  const dias = (dia(ahora) - dia(fecha)) / (24 * HORA);
  if (dias < 1) return "Hoy";
  if (dias < 7) return "Esta semana";
  return "Antes";
}

/** "Doña Lupe" · "Doña Lupe y El Brujo" · "Doña Lupe y 12 más" (agrupar lo social, ventana de 10 min) */
export function quienes(nombres: string[]): string {
  const unicos = [...new Set(nombres)];
  if (unicos.length <= 1) return unicos[0] ?? "";
  if (unicos.length === 2) return `${unicos[0]} y ${unicos[1]}`;
  return `${unicos[0]} y ${unicos.length - 1} más`;
}

/** Ventana para agrupar reacciones y seguidores en un solo aviso */
export const VENTANA_AGRUPAR_MS = 10 * MIN;
