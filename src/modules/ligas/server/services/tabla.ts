/**
 * Tabla del torneo y desempate (PRD §7.13). Servicio puro: sin base de datos ni Next.
 * Solo cuentan los partidos VALIDADOS de la fase regular (regla 2).
 * Desempate fijo en la beta (estilo Liga MX):
 *   puntos → diferencia → goles a favor → resultado entre ellos → juego limpio → sorteo de la liga.
 * El sorteo lo marca la liga en `StandingRow.ordenManual` (con `marcarSorteo` y bitácora).
 */
import { DomainError } from "@/modules/core";

export type EquipoTabla = {
  id: string;
  nombre: string;
  /** `StandingRow.ordenManual`: lo llena la liga al resolver un sorteo (1 va arriba de 2) */
  ordenManual?: number | null;
};

export type PartidoTabla = {
  localId: string;
  visitanteId: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  status: string;
  /** Orden cronológico (para la racha) */
  orden: number;
  /** Sin fase = fase regular */
  fase?: string;
  /** Puntos de juego limpio de cada lado en este partido (`puntosJuegoLimpio` de `partidos`) */
  juegoLimpio?: { local: number; visitante: number };
};

export type ReglasTabla = { puntosVictoria: number; puntosEmpate: number };

export type CriterioDesempate =
  "PUNTOS" | "DIFERENCIA" | "GOLES_A_FAVOR" | "ENTRE_ELLOS" | "JUEGO_LIMPIO" | "SORTEO";

export type FilaTabla = {
  equipoId: string;
  nombre: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  /** Puntos de tarjetas (menos es mejor) */
  juegoLimpio: number;
  /** Últimos 5, del más viejo al más reciente: G gana · E empata · P pierde */
  racha: string;
  posicion: number;
  /** Criterio que lo separó de los empatados en puntos (null si nadie empató con él) */
  desempate: CriterioDesempate | null;
  /** Empate que solo resuelve el sorteo de la liga y todavía no se marca */
  empateSinResolver: boolean;
  /** Posición donde empieza su empate sin resolver (identifica a los empatados para el sorteo) */
  grupoEmpate: number | null;
  ordenManual: number | null;
};

const cuenta = (p: PartidoTabla) =>
  p.status === "VALIDADO" &&
  (p.fase ?? "REGULAR") === "REGULAR" &&
  p.golesLocal != null &&
  p.golesVisitante != null;

type Ctx = { partidos: PartidoTabla[]; reglas: ReglasTabla; sinResolver: FilaTabla[][] };
type Clave = (f: FilaTabla, grupo: FilaTabla[], ctx: Ctx) => number[];

/** Puntos y diferencia solo en los partidos entre los del grupo */
const entreEllos: Clave = (f, grupo, { partidos, reglas }) => {
  const ids = new Set(grupo.map((g) => g.equipoId));
  let pts = 0;
  let dg = 0;
  for (const p of partidos) {
    if (!ids.has(p.localId) || !ids.has(p.visitanteId)) continue;
    const lado = p.localId === f.equipoId ? "L" : p.visitanteId === f.equipoId ? "V" : null;
    if (!lado) continue;
    const a = lado === "L" ? p.golesLocal! : p.golesVisitante!;
    const b = lado === "L" ? p.golesVisitante! : p.golesLocal!;
    pts += a > b ? reglas.puntosVictoria : a === b ? reglas.puntosEmpate : 0;
    dg += a - b;
  }
  return [pts, dg];
};

const CRITERIOS: { nombre: CriterioDesempate; clave: Clave; aplica?: (grupo: FilaTabla[]) => boolean }[] = [
  { nombre: "PUNTOS", clave: (f) => [f.pts] },
  { nombre: "DIFERENCIA", clave: (f) => [f.dg] },
  { nombre: "GOLES_A_FAVOR", clave: (f) => [f.gf] },
  { nombre: "ENTRE_ELLOS", clave: entreEllos },
  { nombre: "JUEGO_LIMPIO", clave: (f) => [-f.juegoLimpio] },
  {
    nombre: "SORTEO",
    clave: (f) => [-(f.ordenManual ?? 0)],
    // Solo resuelve si la liga ordenó a TODOS los empatados
    aplica: (grupo) => grupo.every((f) => f.ordenManual != null),
  },
];

/** Mayor primero */
function comparar(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return y > x ? 1 : -1;
  }
  return 0;
}

const porNombre = (a: FilaTabla, b: FilaTabla) => a.nombre.localeCompare(b.nombre, "es");

/** Ordena un grupo aplicando los criterios desde `desde`. Un criterio se re-aplica a los que siguen empatados. */
function ordenar(grupo: FilaTabla[], desde: number, ctx: Ctx): FilaTabla[] {
  if (grupo.length < 2) return grupo;
  for (let i = desde; i < CRITERIOS.length; i++) {
    const { nombre, clave, aplica } = CRITERIOS[i];
    if (aplica && !aplica(grupo)) continue;
    const claves = new Map(grupo.map((f) => [f.equipoId, clave(f, grupo, ctx)]));
    const ordenado = [...grupo].sort((a, b) => comparar(claves.get(a.equipoId)!, claves.get(b.equipoId)!));
    const subgrupos: FilaTabla[][] = [];
    for (const f of ordenado) {
      const ultimo = subgrupos.at(-1);
      if (ultimo && comparar(claves.get(ultimo[0].equipoId)!, claves.get(f.equipoId)!) === 0) ultimo.push(f);
      else subgrupos.push([f]);
    }
    if (subgrupos.length === 1) continue;
    if (i > 0) for (const f of grupo) f.desempate = nombre;
    return subgrupos.flatMap((s) => ordenar(s, i, ctx));
  }
  // Ni el sorteo lo separa: falta que la liga lo marque (provisional, por nombre)
  for (const f of grupo) f.empateSinResolver = true;
  ctx.sinResolver.push(grupo);
  return [...grupo].sort(porNombre);
}

/** Calcula la tabla. `ordenManual` de cada equipo solo pesa como último criterio (sorteo). */
export function calcularTabla({
  equipos,
  partidos,
  reglas,
}: {
  equipos: EquipoTabla[];
  partidos: PartidoTabla[];
  reglas: ReglasTabla;
}): FilaTabla[] {
  const validos = partidos.filter(cuenta).sort((a, b) => a.orden - b.orden);
  const filas = new Map<string, FilaTabla & { resultados: string[] }>(
    equipos.map((e) => [
      e.id,
      {
        equipoId: e.id,
        nombre: e.nombre,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
        juegoLimpio: 0,
        racha: "",
        posicion: 0,
        desempate: null,
        empateSinResolver: false,
        grupoEmpate: null,
        ordenManual: e.ordenManual ?? null,
        resultados: [],
      },
    ]),
  );

  for (const p of validos) {
    for (const lado of ["L", "V"] as const) {
      const f = filas.get(lado === "L" ? p.localId : p.visitanteId);
      if (!f) continue;
      const a = lado === "L" ? p.golesLocal! : p.golesVisitante!;
      const b = lado === "L" ? p.golesVisitante! : p.golesLocal!;
      f.pj++;
      f.gf += a;
      f.gc += b;
      f.juegoLimpio += (lado === "L" ? p.juegoLimpio?.local : p.juegoLimpio?.visitante) ?? 0;
      if (a > b) {
        f.pg++;
        f.resultados.push("G");
      } else if (a === b) {
        f.pe++;
        f.resultados.push("E");
      } else {
        f.pp++;
        f.resultados.push("P");
      }
    }
  }

  const base: FilaTabla[] = [...filas.values()].map(({ resultados, ...f }) => ({
    ...f,
    dg: f.gf - f.gc,
    pts: f.pg * reglas.puntosVictoria + f.pe * reglas.puntosEmpate,
    racha: resultados.slice(-5).join(""),
  }));

  const ctx: Ctx = { partidos: validos, reglas, sinResolver: [] };
  const tabla = ordenar(base, 0, ctx);
  tabla.forEach((f, i) => (f.posicion = i + 1));
  for (const grupo of ctx.sinResolver) {
    const inicio = Math.min(...grupo.map((f) => f.posicion));
    for (const f of grupo) f.grupoEmpate = inicio;
  }
  return tabla;
}

/**
 * La liga resuelve un empate sin resolver por sorteo (PRD §7.13). `orden`: todos los empatados,
 * del que queda arriba al de abajo. Devuelve el `ordenManual` de cada uno y la bitácora (siempre).
 */
export function marcarSorteo(tabla: FilaTabla[], orden: string[], motivo: string) {
  const m = motivo.trim();
  if (!m) throw new DomainError("Escribe el motivo del sorteo.", "SORTEO_SIN_MOTIVO");
  const filas = orden.map((id) => tabla.find((f) => f.equipoId === id));
  if (!filas.length || filas.some((f) => !f))
    throw new DomainError("Ese equipo no está en la tabla.", "SORTEO_EQUIPO_DESCONOCIDO");
  const grupo = filas[0]!.grupoEmpate;
  if (grupo == null)
    throw new DomainError("Ese equipo no tiene un empate por resolver.", "SORTEO_SIN_EMPATE");
  const empatados = tabla.filter((f) => f.grupoEmpate === grupo).map((f) => f.equipoId);
  const completo =
    new Set(orden).size === orden.length &&
    orden.length === empatados.length &&
    empatados.every((id) => orden.includes(id));
  if (!completo)
    throw new DomainError("El sorteo tiene que ordenar a todos los empatados.", "SORTEO_INCOMPLETO");

  const despues = orden.map((equipoId, i) => ({ equipoId, ordenManual: i + 1 }));
  return {
    cambios: despues,
    bitacora: {
      action: "OVERRIDE" as const,
      before: Object.fromEntries(filas.map((f) => [f!.equipoId, f!.ordenManual])),
      after: Object.fromEntries(despues.map((d) => [d.equipoId, d.ordenManual])),
      motivo: m,
    },
  };
}
