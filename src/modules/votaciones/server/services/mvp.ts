/**
 * MVP del partido (PRD §6.7 · CARTA_E_INSIGNIAS §3 · pantalla 12). Servicio puro: sin base de datos ni Next.
 * - Se abre cuando la liga valida el partido. Candidatos: los que jugaron, de los dos equipos.
 * - Vota cualquier cuenta reclamada, 1 voto por votación; nadie vota por sí mismo.
 * - Cierre (POR APROBAR): a las 22:00 del día en que se valida; si se valida después de las 16:00, a las
 *   22:00 del día siguiente (siempre hay al menos 6 h para votar).
 * - Ganador (POR APROBAR): el de más votos; si empatan, el que llegó primero a ese número. Sin votos, no hay MVP.
 */
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, format } from "date-fns";

const TZ = "America/Mexico_City";
export const HORA_DE_CIERRE = 22;
/** Si se valida después de esta hora, cierra al día siguiente */
export const ULTIMA_HORA_PARA_CERRAR_HOY = 16;

/** A qué hora cierra la votación del MVP de un partido validado en `validadoEn` */
export function cierreDelMvp(validadoEn: Date): Date {
  const local = toZonedTime(validadoEn, TZ);
  const dia = local.getHours() >= ULTIMA_HORA_PARA_CERRAR_HOY ? addDays(local, 1) : local;
  return fromZonedTime(`${format(dia, "yyyy-MM-dd")}T${String(HORA_DE_CIERRE).padStart(2, "0")}:00:00`, TZ);
}

export type JugadorDelPartido = {
  userId: string;
  nombre: string;
  equipo: string;
  goles: { minuto: number | null; tipoGol: string | null }[];
  asistencias: number;
  esPortero: boolean;
  golesRecibidos: number;
  penalesAtajados: number;
};

// Los tipos de gol de la cédula (enum TipoGol); "JUGADA" no se menciona
const TIPO: Record<string, string> = {
  CHILENA: "de chilena",
  CABEZA: "de cabeza",
  TIRO_LIBRE: "de tiro libre",
  PENAL: "de penal",
  PANENKA: "a lo Panenka",
  OLIMPICO: "olímpico",
  FUERA_DEL_AREA: "de fuera del área",
};

/**
 * El renglón del candidato, solo con datos reales de la cédula (regla 9): "2 goles, uno de chilena",
 * "Gol al 64'", "1 asistencia", "Valla invicta", "Atajó un penal"; si no, "Jugó".
 */
export function detalleDelCandidato(j: JugadorDelPartido): string {
  const partes: string[] = [];
  const conTipo = j.goles.find((g) => g.tipoGol && TIPO[g.tipoGol]);
  if (j.goles.length === 1) {
    const g = j.goles[0];
    partes.push(`Gol${g.tipoGol && TIPO[g.tipoGol] ? ` ${TIPO[g.tipoGol]}` : ""}${g.minuto != null ? ` al ${g.minuto}'` : ""}`);
  } else if (j.goles.length > 1) {
    partes.push(`${j.goles.length} goles${conTipo ? `, uno ${TIPO[conTipo.tipoGol!]}` : ""}`);
  }
  if (j.asistencias) partes.push(`${j.asistencias} asistencia${j.asistencias === 1 ? "" : "s"}`);
  if (j.esPortero && j.golesRecibidos === 0) partes.push("Valla invicta");
  if (j.penalesAtajados) partes.push(j.penalesAtajados === 1 ? "Atajó un penal" : `Atajó ${j.penalesAtajados} penales`);
  return partes.length ? partes.join(" · ") : "Jugó";
}

/** Los que más hicieron primero: goles, asistencias, porteros con valla invicta o penal atajado, y luego por nombre */
export function ordenarCandidatos<T extends JugadorDelPartido>(jugadores: T[]): T[] {
  const peso = (j: JugadorDelPartido) =>
    j.goles.length * 10 + j.asistencias * 4 + j.penalesAtajados * 6 + (j.esPortero && j.golesRecibidos === 0 ? 5 : 0);
  return [...jugadores].sort((a, b) => peso(b) - peso(a) || a.nombre.localeCompare(b.nombre, "es"));
}

export type OpcionConVotos = { id: string; votos: number; ultimoVotoEn: Date | null };

/** El de más votos; si empatan, el que llegó primero a ese número (su último voto fue antes). Sin votos: nadie. */
export function ganadorDelMvp(opciones: OpcionConVotos[]): string | null {
  const max = Math.max(0, ...opciones.map((o) => o.votos));
  if (!max) return null;
  const empatados = opciones.filter((o) => o.votos === max);
  empatados.sort((a, b) => (a.ultimoVotoEn?.getTime() ?? Infinity) - (b.ultimoVotoEn?.getTime() ?? Infinity) || a.id.localeCompare(b.id));
  return empatados[0].id;
}

/** ¿Puede votar por este candidato? Nadie vota por sí mismo; la votación debe seguir abierta. */
export function puedeVotar(votacion: { status: string; closesAt: Date }, votante: string, candidato: string | null, ahora: Date): string | null {
  if (votacion.status !== "ABIERTA" || ahora.getTime() >= votacion.closesAt.getTime()) return "Esta votación ya cerró.";
  if (candidato === votante) return "No se vale votar por uno mismo.";
  return null;
}

/**
 * Lo que la carta toma de las votaciones (CRK, CARTA §1): MVP ganados y el % de votos promedio en las
 * votaciones cerradas de MVP donde fue candidato. Solo cuentan las de los partidos de su ventana.
 */
export function votosParaLaCarta(
  votaciones: { matchId: string; ganadorUserId: string | null; total: number; votosDe: Map<string, number> }[],
  userId: string,
  partidosDeLaVentana: Set<string>,
): { mvps: number; porcentajeVotos: number } {
  const suyas = votaciones.filter((v) => partidosDeLaVentana.has(v.matchId) && v.votosDe.has(userId));
  const mvps = suyas.filter((v) => v.ganadorUserId === userId).length;
  const conVotos = suyas.filter((v) => v.total > 0);
  const porcentajeVotos = conVotos.length
    ? conVotos.reduce((s, v) => s + ((v.votosDe.get(userId) ?? 0) * 100) / v.total, 0) / conVotos.length
    : 0;
  return { mvps, porcentajeVotos: Math.round(porcentajeVotos * 10) / 10 };
}
