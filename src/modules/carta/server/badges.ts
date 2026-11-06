/**
 * Motor de insignias (docs/CARTA_E_INSIGNIAS.md §4 · pantallas 14 y 28). Servicio puro: sin base de datos.
 * Evalúa el `criteria` de cada insignia del catálogo con el historial VALIDADO del jugador (regla 2):
 * cuántas veces la ganó, su progreso (las no ganadas en gris con "47 de 50") y una pista con datos reales.
 * Lo que depende de votaciones o del cierre del torneo queda pendiente hasta que existan esos datos.
 */
import { resultadoDelDomingo } from "@/modules/partidos";

export type CriterioInsignia = Record<string, string | number | boolean>;
export type InsigniaCatalogo = { code: string; categoria: string; criteria: CriterioInsignia };

/** Un partido VALIDADO de su equipo en que estaba convocado (en la plantilla del torneo) */
export type PartidoHistorial = {
  matchId: string;
  /** Para ordenar (ms) */
  fecha: number;
  /** En la alineación de la cédula: titular o banca */
  enAlineacion: boolean;
  /** Fue y jugó (lo marca el árbitro) */
  jugo: boolean;
  /** Posición en la alineación */
  posicion: string | null;
  /** Tipo de cada gol suyo (oficial) */
  goles: (string | null)[];
  penalesAtajados: number;
  /** Goles que recibió su equipo */
  golesEnContra: number;
  /** Cumplía una suspensión (pausa la racha de domingos) */
  suspendido: boolean;
};

export type ContextoTorneo = {
  /** "Apertura 2026" */
  nombre: string;
  cerrado: boolean;
  posicionGoleo?: number;
  jornada?: number;
  jornadas?: number;
  /** Del torneo actual (de `conteoDeTarjetas`) */
  amarillas: number;
  rojas: number;
  jugados: number;
  /** Partidos y derrotas de su equipo en la fase regular */
  equipo?: { pj: number; pp: number };
};

export type HistorialJugador = {
  partidos: PartidoHistorial[];
  esPortero: boolean;
  /** Cuenta reclamada durante la beta (o marcada como pionera) */
  esPionero: boolean;
  torneo?: ContextoTorneo;
};

export type EstadoInsignia = {
  code: string;
  /** 0 = no ganada. Las repetibles cuentan cada vez (×3). */
  veces: number;
  progreso?: number;
  meta?: number;
  /** Para las no ganadas sin progreso numérico: "Vas 1º · J15/18", "Ponte guantes" */
  pista?: string;
};

const num = (v: unknown, defecto = 0) => (typeof v === "number" ? v : defecto);

/** La racha más larga de domingos sin faltar que ha tenido (PRD §7.6: descansos y suspensiones pausan) */
export function rachaMaxima(partidos: PartidoHistorial[]): number {
  let max = 0;
  let racha = 0;
  for (const p of [...partidos].sort((a, b) => a.fecha - b.fecha)) {
    const r = resultadoDelDomingo({ orden: p.fecha, status: "VALIDADO", enAlineacion: p.enAlineacion, suspendido: p.suspendido });
    if (r === "CORTA") racha = 0;
    if (r === "SUMA") max = Math.max(max, ++racha);
  }
  return max;
}

/** La racha de hoy (la que muestra el progreso: "19 de 25") */
export function rachaActual(partidos: PartidoHistorial[]): number {
  let racha = 0;
  for (const p of [...partidos].sort((a, b) => b.fecha - a.fecha)) {
    const r = resultadoDelDomingo({ orden: p.fecha, status: "VALIDADO", enAlineacion: p.enAlineacion, suspendido: p.suspendido });
    if (r === "CORTA") break;
    if (r === "SUMA") racha++;
  }
  return racha;
}

export function evaluarInsignia(badge: InsigniaCatalogo, h: HistorialJugador): EstadoInsignia {
  const c = badge.criteria;
  const jugados = h.partidos.filter((p) => p.jugo);
  const goles = jugados.flatMap((p) => p.goles);
  const t = h.torneo;
  const base = { code: badge.code };
  switch (c.type) {
    case "goals_total": {
      const meta = num(c.gte, 1);
      return goles.length >= meta ? { ...base, veces: 1 } : { ...base, veces: 0, progreso: goles.length, meta };
    }
    case "goals_in_match": {
      const veces = jugados.filter((p) => p.goles.length >= num(c.gte, 2)).length;
      return { ...base, veces };
    }
    case "goal_type":
      return { ...base, veces: goles.filter((g) => g === c.value).length };
    case "clean_sheet": {
      const veces = jugados.filter((p) => p.posicion === "POR" && p.golesEnContra === 0).length;
      return veces || h.esPortero ? { ...base, veces } : { ...base, veces: 0, pista: "Ponte guantes" };
    }
    case "event": {
      const veces = h.partidos.reduce((s, p) => s + (c.value === "PENAL_ATAJADO" ? p.penalesAtajados : 0), 0);
      if (veces) return { ...base, veces };
      return h.esPortero ? { ...base, veces: 0, progreso: 0, meta: 1 } : { ...base, veces: 0, pista: "Ponte guantes" };
    }
    case "attendance_streak": {
      const meta = num(c.gte, 5);
      return rachaMaxima(h.partidos) >= meta
        ? { ...base, veces: 1 }
        : { ...base, veces: 0, progreso: rachaActual(h.partidos), meta };
    }
    case "matches_total": {
      const meta = num(c.gte, 100);
      return jugados.length >= meta ? { ...base, veces: 1 } : { ...base, veces: 0, progreso: jugados.length, meta };
    }
    case "top_scorer":
      return {
        ...base,
        veces: 0,
        pista:
          t?.posicionGoleo && t.jornada && t.jornadas
            ? `Vas ${t.posicionGoleo}º · J${t.jornada}/${t.jornadas}`
            : "Al cierre del torneo",
      };
    case "no_cards_tournament": {
      if (!t) return { ...base, veces: 0, pista: "Al cierre del torneo" };
      const tarjetas = [t.amarillas ? `${t.amarillas} 🟨` : "", t.rojas ? `${t.rojas} 🟥` : ""].filter(Boolean).join(" ");
      return tarjetas
        ? { ...base, veces: 0, pista: `${tarjetas} este torneo` }
        : { ...base, veces: 0, progreso: Math.min(t.jugados, num(c.minMatches, 8)), meta: num(c.minMatches, 8) };
    }
    case "unbeaten_regular":
      if (!t?.equipo) return { ...base, veces: 0, pista: "Al cierre de la fase regular" };
      return t.equipo.pp > 0
        ? { ...base, veces: 0, pista: "Próximo torneo" }
        : { ...base, veces: 0, pista: `Van ${t.equipo.pj} sin perder` };
    case "champion":
    case "runner_up":
      return { ...base, veces: 0, pista: "Al cierre del torneo" };
    case "poll_win":
      return { ...base, veces: 0, pista: "Por votación" };
    case "beta_pioneer":
      return h.esPionero ? { ...base, veces: 1 } : { ...base, veces: 0, pista: "Solo en la beta" };
    default:
      return { ...base, veces: 0 };
  }
}

/** Las insignias de jugador (sin las de aficionado), en el orden del catálogo */
export function evaluarInsignias(catalogo: InsigniaCatalogo[], h: HistorialJugador): EstadoInsignia[] {
  return catalogo.filter((b) => b.categoria !== "AFICIONADO").map((b) => evaluarInsignia(b, h));
}

/** Rareza = % de los jugadores que la tienen (pantalla 28: "41% la tiene", "Sólo el 8%") */
export function rarezas(estadosPorJugador: EstadoInsignia[][]): Map<string, number> {
  const total = estadosPorJugador.length;
  const conteo = new Map<string, number>();
  for (const estados of estadosPorJugador)
    for (const e of estados) if (e.veces > 0) conteo.set(e.code, (conteo.get(e.code) ?? 0) + 1);
  return new Map([...conteo].map(([code, n]) => [code, total ? Math.max(1, Math.round((n / total) * 100)) : 0]));
}

/** "La que tienes más cerca" (pantalla 28): la no ganada con más avance */
export function laMasCercana(estados: EstadoInsignia[]): EstadoInsignia | undefined {
  return estados
    .filter((e) => e.veces === 0 && e.meta && e.progreso != null && e.progreso > 0)
    .sort((a, b) => b.progreso! / b.meta! - a.progreso! / a.meta!)[0];
}
