/**
 * La página del partido en estado FINAL (pantalla 32a · resumen oficial y alineaciones).
 * Servicio puro: sin base de datos ni Next. Solo lo que trae la cédula (eventos oficiales, regla 1).
 */

/** Etiqueta del tipo de gol (lámina 29). La jugada normal no lleva etiqueta. */
export const ETIQUETA_TIPO_GOL: Record<string, string> = {
  FUERA_DEL_AREA: "De fuera del área",
  PANENKA: "A lo Panenka",
  TIRO_LIBRE: "Tiro libre",
  CABEZA: "De cabeza",
  CHILENA: "De chilena",
  PENAL: "De penal",
  OLIMPICO: "Olímpico",
};

/** "Panenka y chilena salen en lima: son golazo" (pantalla 32a) */
export const esGolazo = (tipoGol: string | null | undefined) => tipoGol === "PANENKA" || tipoGol === "CHILENA";

export type EventoCedula = {
  minuto: number | null;
  tipo: string;
  equipoId: string | null;
  jugador: string | null;
  jugadorId: string | null;
  asistencia?: string | null;
  /** CAMBIO: el que sale */
  sale?: string | null;
  saleId?: string | null;
  tipoGol?: string | null;
  nota?: string | null;
};

const porMinuto = (a: EventoCedula, b: EventoCedula) => (a.minuto ?? 999) - (b.minuto ?? 999);

/**
 * El marcador que sale de los eventos de la cédula (PRD §7.7): el gol suma a su equipo y el autogol,
 * que se anota con el equipo del jugador que lo hizo, suma al CONTRARIO.
 */
export function marcadorDeEventos(eventos: Pick<EventoCedula, "tipo" | "equipoId">[], localId: string, visitaId: string) {
  let local = 0;
  let visita = 0;
  for (const e of eventos) {
    if (e.tipo === "GOL") {
      if (e.equipoId === localId) local++;
      else if (e.equipoId === visitaId) visita++;
    } else if (e.tipo === "AUTOGOL") {
      if (e.equipoId === localId) visita++;
      else if (e.equipoId === visitaId) local++;
    }
  }
  return { local, visita };
}

/** Goles por equipo (el autogol va del lado al que suma), tarjetas, cambios y cuántos eventos tiene la cédula */
export function resumenDelPartido(eventos: EventoCedula[], localId: string, visitaId: string) {
  const ordenados = [...eventos].sort(porMinuto);
  const sumaA = (e: EventoCedula) =>
    e.tipo === "GOL" ? e.equipoId : e.tipo === "AUTOGOL" ? (e.equipoId === localId ? visitaId : localId) : null;
  const goles = ordenados.filter((e) => e.tipo === "GOL" || e.tipo === "AUTOGOL");
  return {
    golesLocal: goles.filter((e) => sumaA(e) === localId),
    golesVisita: goles.filter((e) => sumaA(e) === visitaId),
    tarjetas: ordenados.filter((e) => e.tipo === "AMARILLA" || e.tipo === "ROJA"),
    cambios: ordenados.filter((e) => e.tipo === "CAMBIO"),
    penales: ordenados.filter((e) => e.tipo === "PENAL_ATAJADO" || e.tipo === "PENAL_FALLADO"),
    total: ordenados.filter((e) => !["INICIO_PARTIDO", "MEDIO_TIEMPO", "FIN_PARTIDO"].includes(e.tipo)).length,
  };
}

export type JugadorAlineacion = {
  userId: string;
  username: string;
  nombre: string;
  numero: number | null;
  titular: boolean;
  posicion: string | null;
  capitan: boolean;
};

export type FilaAlineacion = JugadorAlineacion & {
  goles: number;
  amarillas: number;
  roja: boolean;
  salio: boolean;
  entro: boolean;
};

const ORDEN_POSICION = ["POR", "DFC", "LAT", "MCD", "MC", "MCO", "EXT", "DC"];
const pesoPosicion = (p: string | null) => {
  const i = p ? ORDEN_POSICION.indexOf(p) : -1;
  return i < 0 ? ORDEN_POSICION.length : i;
};

/**
 * La alineación de un equipo con sus marcas (pantalla 32a): titulares de portero a delantero, luego la
 * banca; goles, tarjetas, quién salió y quién entró.
 */
export function alineacionConMarcas(jugadores: JugadorAlineacion[], eventos: EventoCedula[]): FilaAlineacion[] {
  const filas = jugadores.map((j) => {
    const suyos = eventos.filter((e) => e.jugadorId === j.userId);
    return {
      ...j,
      goles: suyos.filter((e) => e.tipo === "GOL").length,
      amarillas: suyos.filter((e) => e.tipo === "AMARILLA").length,
      roja: suyos.some((e) => e.tipo === "ROJA"),
      salio: eventos.some((e) => e.tipo === "CAMBIO" && e.saleId === j.userId),
      entro: suyos.some((e) => e.tipo === "CAMBIO"),
    };
  });
  return filas.sort(
    (a, b) =>
      Number(b.titular) - Number(a.titular) ||
      pesoPosicion(a.posicion) - pesoPosicion(b.posicion) ||
      (a.numero ?? 999) - (b.numero ?? 999),
  );
}
