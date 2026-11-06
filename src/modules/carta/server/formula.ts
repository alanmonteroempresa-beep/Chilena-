/**
 * Fórmula de la carta (docs/CARTA_E_INSIGNIAS.md §1). Funciones puras con tests de cada tramo.
 * Las constantes viven aquí y se ajustan con datos reales de la beta.
 * Todo sale de partidos VALIDADOS (regla 2): la ventana son los últimos 20 en que fue convocado.
 */

export type GrupoPosicion = "PORTERO" | "DEFENSA" | "MEDIO" | "DELANTERO";
export type NivelCarta = "bronce" | "plata" | "oro" | "leyenda";
export type ClaveAtributo = "DEF" | "PAS" | "CON" | "DIS" | "CRK" | "RES" | "VAL" | "SEG" | "PEN";

/** Ventana de los atributos: los últimos 20 partidos validados (cualquier torneo o liga) */
export const VENTANA_PARTIDOS = 20;
/** Con menos de 3 partidos validados la carta está "en construcción" (Bronce, media oculta) */
export const PARTIDOS_PARA_MEDIA = 3;
export const MEDIA = { minimo: 40, maximo: 99 } as const;

/** DIS (Disciplina): 95 − 4 × amarillas − 12 × rojas, mínimo 40 */
export const DISCIPLINA = { base: 95, porAmarilla: 4, porRoja: 12, minimo: 40 } as const;

/**
 * Las tarjetas salen de `conteoDeTarjetas` de `partidos`: la doble amarilla llega como
 * 1 roja y 0 amarillas, así que resta 12 y no 20 (PRD §7.8).
 */
export function disciplina(tarjetas: { amarillas: number; rojas: number }): number {
  const valor =
    DISCIPLINA.base - DISCIPLINA.porAmarilla * tarjetas.amarillas - DISCIPLINA.porRoja * tarjetas.rojas;
  return Math.max(DISCIPLINA.minimo, valor);
}

/** Tablas de puntos (dato → atributo) de §1.2 y §1.3. Los datos van de menor a mayor. */
export const TABLAS = {
  DEF: [[0, 45], [0.25, 60], [0.5, 70], [1, 85], [1.5, 95]],
  PAS: [[0, 45], [0.2, 62], [0.4, 75], [0.8, 90]],
  CON: [[0, 40], [0.5, 65], [0.8, 82], [1, 95]],
  RES: [[1, 40], [3, 68], [5, 95]],
  VAL: [[0, 45], [0.2, 65], [0.4, 80], [0.6, 92]],
  // Goles recibidos por partido: menos es mejor
  SEG: [[0.5, 90], [1, 82], [2, 68], [3, 55], [4, 45]],
} as const satisfies Record<string, readonly (readonly [number, number])[]>;

/** CRK: 55 + 10 × MVP + 0.2 × % de votos promedio, máximo 99 */
export const CRACK = { base: 55, porMvp: 10, porPuntoDeVoto: 0.2, maximo: 99 } as const;
/** RES con menos de 5 votos de rivales */
export const RESPETO = { votosMinimos: 5, sinVotos: 70 } as const;
/** PEN: 50 + 12 × atajados, máximo 95 */
export const PENALES = { base: 50, porAtajado: 12, maximo: 95 } as const;

/** Pesos de la media por grupo (§1.4) */
export const PESOS: Record<GrupoPosicion, Partial<Record<ClaveAtributo, number>>> = {
  DELANTERO: { DEF: 0.35, PAS: 0.15, CON: 0.15, DIS: 0.1, CRK: 0.15, RES: 0.1 },
  MEDIO: { DEF: 0.15, PAS: 0.3, CON: 0.2, DIS: 0.1, CRK: 0.15, RES: 0.1 },
  DEFENSA: { DEF: 0.05, PAS: 0.15, CON: 0.3, DIS: 0.2, CRK: 0.15, RES: 0.15 },
  PORTERO: { VAL: 0.25, SEG: 0.25, PEN: 0.1, CON: 0.15, DIS: 0.1, CRK: 0.15 },
};

/** Orden y nombres del reverso (pantalla 25a) */
export const ATRIBUTOS: Record<ClaveAtributo, string> = {
  DEF: "Definición",
  PAS: "Pase",
  CON: "Constancia",
  DIS: "Disciplina",
  CRK: "Crack · votos MVP",
  RES: "Respeto · rivales",
  VAL: "Vallas invictas",
  SEG: "Pocos goles recibidos",
  PEN: "Penales atajados",
};
const ORDEN_CAMPO: ClaveAtributo[] = ["DEF", "PAS", "CON", "DIS", "CRK", "RES"];
const ORDEN_PORTERO: ClaveAtributo[] = ["VAL", "SEG", "PEN", "CON", "DIS", "CRK"];

/** Interpolación lineal entre los puntos de la tabla; fuera de rango se toma el extremo */
export function interpolar(x: number, puntos: readonly (readonly [number, number])[]): number {
  if (x <= puntos[0][0]) return puntos[0][1];
  const ultimo = puntos[puntos.length - 1];
  if (x >= ultimo[0]) return ultimo[1];
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i];
    if (x <= x1) {
      const [x0, y0] = puntos[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return ultimo[1];
}

/** Posición → grupo (§1.1). Sin posición: la que más jugó en las alineaciones; sin datos, MEDIO. */
export function grupoDePosicion(posicion?: string | null, masJugada?: string | null): GrupoPosicion {
  const p = posicion ?? masJugada;
  switch (p) {
    case "POR":
      return "PORTERO";
    case "DFC":
    case "LAT":
      return "DEFENSA";
    case "EXT":
    case "DC":
      return "DELANTERO";
    default:
      return "MEDIO";
  }
}

export const crack = (mvps: number, porcentajeVotos: number) =>
  Math.min(CRACK.maximo, CRACK.base + CRACK.porMvp * mvps + CRACK.porPuntoDeVoto * porcentajeVotos);

/** RES: promedio de los votos (1–5) SOLO de rivales (regla 6); con menos de 5 votos, 70 */
export function respeto(votosDeRivales: number[]): number {
  if (votosDeRivales.length < RESPETO.votosMinimos) return RESPETO.sinVotos;
  const promedio = votosDeRivales.reduce((s, v) => s + v, 0) / votosDeRivales.length;
  return interpolar(promedio, TABLAS.RES);
}

export const penales = (atajados: number) => Math.min(PENALES.maximo, PENALES.base + PENALES.porAtajado * atajados);

/** Bono de los DEFENSA: vallas invictas de su equipo por partido jugado → +1 (0.2), +2 (0.4), +3 (0.6) */
export function bonoDefensivo(vallasPorPartido: number): number {
  if (vallasPorPartido >= 0.6) return 3;
  if (vallasPorPartido >= 0.4) return 2;
  if (vallasPorPartido >= 0.2) return 1;
  return 0;
}

/** Nivel por media (§1.5). En construcción siempre es Bronce. */
export function nivelDeCarta(media: number | null, partidosValidados: number): NivelCarta {
  if (media == null || partidosValidados < PARTIDOS_PARA_MEDIA) return "bronce";
  if (media >= 85 && partidosValidados >= 30) return "leyenda";
  if (media >= 75) return "oro";
  if (media >= 65) return "plata";
  return "bronce";
}

/** Lo que hizo en su ventana (los últimos 20 partidos validados en que fue convocado) */
export type Ventana = {
  convocados: number;
  /** Fue y jugó (lo marca el árbitro en la cédula) */
  jugados: number;
  goles: number;
  asistencias: number;
  /** De `conteoDeTarjetas`: la doble amarilla ya viene como 1 roja */
  amarillas: number;
  rojas: number;
  mvps: number;
  /** % de votos promedio en las votaciones de MVP (0–100) */
  porcentajeVotos: number;
  votosDeRivales: number[];
  /** De su equipo, en los partidos que jugó */
  vallasInvictas: number;
  golesRecibidos: number;
  penalesAtajados: number;
};

export type Carta = {
  grupo: GrupoPosicion;
  atributos: { clave: ClaveAtributo; nombre: string; valor: number }[];
  /** null mientras está en construcción */
  media: number | null;
  enConstruccion: boolean;
  nivel: NivelCarta;
  partidosValidados: number;
};

/**
 * La carta completa: atributos del grupo, media con pesos (y bono defensivo) y nivel.
 * `partidosValidados` = partidos validados que jugó en total (para "en construcción" y Leyenda).
 */
export function calcularCarta(v: Ventana, grupo: GrupoPosicion, partidosValidados: number): Carta {
  const porPartido = (n: number) => (v.jugados > 0 ? n / v.jugados : 0);
  const valores: Record<ClaveAtributo, number> = {
    DEF: interpolar(porPartido(v.goles), TABLAS.DEF),
    PAS: interpolar(porPartido(v.asistencias), TABLAS.PAS),
    CON: interpolar(v.convocados > 0 ? v.jugados / v.convocados : 0, TABLAS.CON),
    DIS: disciplina(v),
    CRK: crack(v.mvps, v.porcentajeVotos),
    RES: respeto(v.votosDeRivales),
    VAL: interpolar(porPartido(v.vallasInvictas), TABLAS.VAL),
    // Sin partidos jugados no hay goles en contra que medir: el extremo bajo
    SEG: v.jugados > 0 ? interpolar(porPartido(v.golesRecibidos), TABLAS.SEG) : TABLAS.SEG[TABLAS.SEG.length - 1][1],
    PEN: penales(v.penalesAtajados),
  };
  const orden = grupo === "PORTERO" ? ORDEN_PORTERO : ORDEN_CAMPO;
  const atributos = orden.map((clave) => ({ clave, nombre: ATRIBUTOS[clave], valor: Math.round(valores[clave]) }));
  const enConstruccion = partidosValidados < PARTIDOS_PARA_MEDIA;
  const pesos = PESOS[grupo];
  const suma = atributos.reduce((s, a) => s + (pesos[a.clave] ?? 0) * a.valor, 0);
  const bono = grupo === "DEFENSA" ? bonoDefensivo(porPartido(v.vallasInvictas)) : 0;
  const media = enConstruccion ? null : Math.min(MEDIA.maximo, Math.max(MEDIA.minimo, Math.round(suma) + bono));
  return { grupo, atributos, media, enConstruccion, nivel: nivelDeCarta(media, partidosValidados), partidosValidados };
}
