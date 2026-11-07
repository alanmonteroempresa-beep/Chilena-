/**
 * Sanciones (PRD §7.8 · pantalla 47). Servicio puro: sin base de datos ni Next.
 * - Automáticas: salen solas de las cédulas VALIDADAS (regla 2) con las reglas del torneo.
 * - Amarillas: al llegar al umbral se suspende y el acumulado vuelve a 0; la liguilla también lo reinicia.
 * - La liga ajusta una automática en la misma sanción, con motivo y bitácora.
 */
import { DomainError } from "@/modules/core";
import { tarjetasPorJugador, type TarjetaCedula } from "./tarjetas";

export type ReglasSanciones = { partidosPorRoja: number; amarillasParaSuspension: number };

export type PartidoParaSanciones = {
  matchId: string;
  /** Orden cronológico dentro del torneo */
  orden: number;
  /** Para el motivo: "J14", "Semifinal" */
  etiqueta: string;
  status: string;
  /** "REGULAR" o una fase de liguilla */
  fase: string;
  tarjetas: TarjetaCedula[];
};

export type OrigenSancion = "ROJA" | "DOBLE_AMARILLA" | "AMARILLAS";

export type SancionAutomatica = {
  jugadorId: string;
  equipoId: string;
  matchId: string;
  orden: number;
  origen: OrigenSancion;
  partidos: number;
  motivo: string;
};

function recorrer(partidos: PartidoParaSanciones[], reglas: ReglasSanciones) {
  const validados = partidos.filter((p) => p.status === "VALIDADO").sort((a, b) => a.orden - b.orden);
  const acumulado = new Map<string, number>();
  const sanciones: SancionAutomatica[] = [];
  let enLiguilla = false;

  for (const p of validados) {
    // Liguilla: el acumulado vuelve a 0 (las suspensiones pendientes se cumplen igual)
    if (!enLiguilla && p.fase !== "REGULAR") {
      enLiguilla = true;
      acumulado.clear();
    }
    for (const t of tarjetasPorJugador(p.tarjetas)) {
      const base = { jugadorId: t.jugadorId, equipoId: t.equipoId, matchId: p.matchId, orden: p.orden };
      if (t.expulsado) {
        const al = t.minutoExpulsion != null ? ` al ${t.minutoExpulsion}'` : "";
        sanciones.push({
          ...base,
          origen: t.dobleAmarilla ? "DOBLE_AMARILLA" : "ROJA",
          partidos: reglas.partidosPorRoja,
          motivo: `${t.dobleAmarilla ? "Doble amarilla" : "Roja directa"}${al} en la ${p.etiqueta}`,
        });
      }
      if (t.amarillasQueSuman > 0 && reglas.amarillasParaSuspension > 0) {
        const n = (acumulado.get(t.jugadorId) ?? 0) + t.amarillasQueSuman;
        if (n >= reglas.amarillasParaSuspension) {
          sanciones.push({
            ...base,
            origen: "AMARILLAS",
            partidos: 1,
            motivo: `${reglas.amarillasParaSuspension}ª amarilla en la ${p.etiqueta}`,
          });
          acumulado.set(t.jugadorId, 0);
        } else {
          acumulado.set(t.jugadorId, n);
        }
      }
    }
  }
  return { sanciones, acumulado };
}

/** Todas las sanciones automáticas que generan las cédulas validadas del torneo */
export function sancionesAutomaticas(
  partidos: PartidoParaSanciones[],
  reglas: ReglasSanciones,
): SancionAutomatica[] {
  return recorrer(partidos, reglas).sanciones;
}

/** ¿La sanción salió de juntar amarillas? (las automáticas guardan su origen en el motivo que arma `recorrer`) */
export const esPorAmarillas = (motivo: string) => /ª amarilla/.test(motivo);

export type SancionGuardada = { id: string; userId: string | null; matchId: string | null; motivo: string; status: string };

/**
 * Concilia lo que dicen las cédulas validadas con las automáticas guardadas. Una sanción es un hecho:
 * partido + jugador + si fue por amarillas o por expulsión.
 * - `crear`: los hechos que aún no tienen sanción. Una que la liga ANULÓ no se vuelve a crear.
 * - `sobran`: las guardadas (no anuladas) que ya no salen de las cédulas o que están repetidas. Pasa cuando se
 *   validan partidos fuera de orden: la 5ª amarilla cae en otro partido. Se anulan con bitácora.
 */
export function conciliarSanciones(calculadas: SancionAutomatica[], guardadas: SancionGuardada[]) {
  const llave = (matchId: string | null, userId: string | null, amarillas: boolean) => `${matchId}|${userId}|${amarillas}`;
  const deseadas = new Set(calculadas.map((c) => llave(c.matchId, c.jugadorId, c.origen === "AMARILLAS")));
  const vistas = new Set<string>();
  const sobran: SancionGuardada[] = [];
  // Primero las anuladas: si la liga ya anuló el hecho, no se crea otra
  for (const g of [...guardadas].sort((a, b) => Number(a.status !== "ANULADA") - Number(b.status !== "ANULADA"))) {
    const k = llave(g.matchId, g.userId, esPorAmarillas(g.motivo));
    if (g.status === "ANULADA") {
      vistas.add(k);
      continue;
    }
    if (!deseadas.has(k) || vistas.has(k)) sobran.push(g);
    vistas.add(k);
  }
  const crear = calculadas.filter((c) => !vistas.has(llave(c.matchId, c.jugadorId, c.origen === "AMARILLAS")));
  return { crear, sobran };
}

/** Amarillas acumuladas hoy por jugador (después de los reinicios) */
export function amarillasAcumuladas(
  partidos: PartidoParaSanciones[],
  reglas: ReglasSanciones,
): Map<string, number> {
  return recorrer(partidos, reglas).acumulado;
}

/** ¿Le falta una para la suspensión? (alerta preventiva y ámbar de la alineación) */
export function aUnaDeLaSuspension(acumuladas: number, umbral: number): boolean {
  return umbral > 1 && acumuladas === umbral - 1;
}

/** "Aguas: llevas 4 amarillas. Una más y te sientas un partido." Usa el acumulado, no el total. */
export function alertaPreventiva(acumuladas: number, umbral: number): string | null {
  return aUnaDeLaSuspension(acumuladas, umbral)
    ? `Aguas: llevas ${acumuladas} amarilla${acumuladas === 1 ? "" : "s"}. Una más y te sientas un partido.`
    : null;
}

/** Partidos cumplidos: los VALIDADOS de su equipo después del de la sanción (los domingos sin partido no cuentan) */
export function partidosCumplidos(
  sancion: { orden: number; partidos: number | null },
  partidosDelEquipo: { orden: number; status: string }[],
): number {
  if (sancion.partidos == null) return 0;
  const despues = partidosDelEquipo.filter((p) => p.status === "VALIDADO" && p.orden > sancion.orden).length;
  return Math.min(sancion.partidos, despues);
}

export type EstadoSancion = "ACTIVA" | "CUMPLIDA" | "ANULADA";

export type SancionActual = {
  partidos: number | null;
  partidosCumplidos: number;
  multaCents: number | null;
  status: EstadoSancion;
};

export type AjusteSancion = {
  /** Nuevo total de partidos (sube o baja) */
  partidos?: number;
  /** Agregar una multa (centavos). Una multa que ya tiene cargo se condona en el cargo. */
  multaCents?: number | null;
  anular?: boolean;
  motivo: string;
};

type CampoBitacora = "partidos" | "multaCents" | "status";

export type ResultadoAjuste = {
  sancion: SancionActual;
  bitacora: {
    action: "UPDATE";
    before: Partial<Record<CampoBitacora, number | string | null>>;
    after: Partial<Record<CampoBitacora, number | string | null>>;
    motivo: string;
  };
  /** La sanción trae multa nueva: hay que crear su cargo a la liga (§7.8, `cargoDeMulta` de `ligas`) */
  creaCargoDeMulta: boolean;
};

/**
 * La liga sube, baja o anula una sanción (automática o manual) en la MISMA sanción.
 * `automatica` no cambia: significa "nació de la cédula".
 */
export function ajustarSancion(actual: SancionActual, ajuste: AjusteSancion): ResultadoAjuste {
  const motivo = ajuste.motivo.trim();
  if (!motivo) throw new DomainError("Escribe el motivo del ajuste.", "SANCION_SIN_MOTIVO");
  if (actual.status === "ANULADA") throw new DomainError("Esta sanción ya está anulada.", "SANCION_ANULADA");

  const nueva: SancionActual = { ...actual };
  if (ajuste.anular) {
    nueva.status = "ANULADA";
  } else {
    if (ajuste.partidos !== undefined) {
      if (!Number.isInteger(ajuste.partidos) || ajuste.partidos < 1)
        throw new DomainError(
          "Deja al menos 1 partido. Para quitarla, anúlala.",
          "SANCION_PARTIDOS_INVALIDOS",
        );
      if (ajuste.partidos < actual.partidosCumplidos)
        throw new DomainError(
          `Ya cumplió ${actual.partidosCumplidos} partido${actual.partidosCumplidos === 1 ? "" : "s"}; no puede quedar en menos.`,
          "SANCION_YA_CUMPLIDA",
        );
      nueva.partidos = ajuste.partidos;
    }
    if (ajuste.multaCents !== undefined && ajuste.multaCents !== actual.multaCents) {
      if (actual.multaCents != null)
        throw new DomainError(
          "Esta multa ya tiene su cargo: para quitarla, condónala en el cargo.",
          "MULTA_CON_CARGO",
        );
      if (ajuste.multaCents !== null && (!Number.isInteger(ajuste.multaCents) || ajuste.multaCents <= 0))
        throw new DomainError("La multa va en centavos enteros y mayor a cero.", "MULTA_INVALIDA");
      nueva.multaCents = ajuste.multaCents;
    }
    if (nueva.partidos != null)
      nueva.status = nueva.partidosCumplidos >= nueva.partidos ? "CUMPLIDA" : "ACTIVA";
  }

  const campos: CampoBitacora[] = ["partidos", "multaCents", "status"];
  const cambiados = campos.filter((c) => nueva[c] !== actual[c]);
  if (!cambiados.length) throw new DomainError("No cambió nada.", "SANCION_SIN_CAMBIOS");

  return {
    sancion: nueva,
    bitacora: {
      action: "UPDATE",
      before: Object.fromEntries(cambiados.map((c) => [c, actual[c]])),
      after: Object.fromEntries(cambiados.map((c) => [c, nueva[c]])),
      motivo,
    },
    creaCargoDeMulta: actual.multaCents == null && nueva.multaCents != null,
  };
}
