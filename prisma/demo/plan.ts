// Generador PURO de la liga demo (sin base de datos): devuelve las filas listas para `createMany`.
// Determinista: misma semilla + misma fecha = mismos datos e IDs. Lo prueba tests/unit/semilla-demo.test.ts.
//
// Reglas que respeta (CLAUDE.md):
//  1–2. Todo lo jugado (J1–J15) está VALIDADO con su cédula; la J16–J18 está PROGRAMADA.
//  4.   Cada jugador está en un solo equipo del torneo.
//  7.   Dinero en centavos.
//  8.   Sin datos privados (celular, nacimiento, emergencia).
// Tabla, goleo y estadísticas se calculan AQUÍ a partir de los eventos, igual que lo hará la validación
// real (partidos → match.validated). Cuando exista el servicio de tabla del módulo `ligas`, úsalo aquí.
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { Prisma } from "../../src/generated/prisma/client";
import { TZ } from "../../src/shared/lib/dates";
import { Azar, idDemo, slug } from "./azar";
import {
  AFICIONADA,
  ARBITROS,
  ARBITROS_J15,
  ARBITROS_J16,
  BANCA,
  EQUIPOS,
  LIGA,
  ORGANIZADOR,
  RECORD_J15,
  ROL,
  SEDE,
  TARIFA_ARBITRO_CENTS,
  TITULARES,
  TORNEO,
  type ClaveArbitro,
  type ClaveEquipo,
  type EquipoDemo,
  type JugadorDemo,
  type Posicion,
} from "./datos";

// ---------------------------------------------------------------------------
// Lo que el deck fija (pantallas 03, 04, 12, 18, 25b, 32, 56 · hub Mi liga)
// ---------------------------------------------------------------------------
type Ref = `${ClaveEquipo}:${number}`;
type Lado = "L" | "V";
type Resultado = "L" | "E" | "V";
type TipoGol =
  "JUGADA" | "CABEZA" | "PENAL" | "TIRO_LIBRE" | "FUERA_DEL_AREA" | "CHILENA" | "PANENKA" | "OLIMPICO";

const clavePartido = (j: number, local: ClaveEquipo, visita: ClaveEquipo) => `${j}:${local}-${visita}`;

const RESULTADOS_FIJOS: Record<string, Resultado> = {
  "15:DP-RC": "L", // Portales 3–2 Condesa (cédula de la pantalla 56)
  "15:TL-SN": "L", // tiro libre de El Tanque al 34'
  "15:UD-HI": "L", // Halcones cierra con 6
  "14:HI-DP": "V", // Halcones 1–2 Portales
  "12:DP-SN": "L", // doblete del Chícharo vs Narvarte
};
const MARCADORES_FIJOS: Record<string, [number, number]> = { "15:DP-RC": [3, 2], "14:HI-DP": [1, 2] };
/** Árbitros que el deck nombra fuera de la J15 y J16 ("Cédula J14 · árbitro L. Ortega ya firmó") */
const ARBITROS_FIJOS: Record<string, ClaveArbitro> = { "14:HI-DP": "ortega" };

/** Cédula de la J15 Portales–Condesa tal cual el deck (7 eventos, sin nada más) */
const CEDULA_J15: {
  minuto: number;
  tipo: "GOL" | "AMARILLA" | "CAMBIO";
  ref: Ref;
  tipoGol?: TipoGol;
  sale?: Ref;
}[] = [
  { minuto: 12, tipo: "GOL", ref: "DP:9", tipoGol: "JUGADA" },
  { minuto: 31, tipo: "GOL", ref: "RC:9", tipoGol: "JUGADA" },
  { minuto: 58, tipo: "AMARILLA", ref: "RC:5" },
  { minuto: 63, tipo: "GOL", ref: "DP:9", tipoGol: "PANENKA" },
  { minuto: 70, tipo: "GOL", ref: "RC:9", tipoGol: "CABEZA" },
  { minuto: 75, tipo: "CAMBIO", ref: "DP:14", sale: "DP:11" },
  { minuto: 87, tipo: "GOL", ref: "DP:10", tipoGol: "CHILENA" },
];
const GOL_TANQUE_J15 = { jornada: 15, ref: "TL:9" as Ref, minuto: 34, tipoGol: "TIRO_LIBRE" as TipoGol };

/** Goles por torneo (goleo: El Chícharo 19 · El Tanque 16 · El Pelón 13; carta de El Brujo 11) */
const METAS_GOLES: Partial<Record<Ref, number>> = {
  "DP:9": 19,
  "TL:9": 16,
  "RC:9": 13,
  "DP:10": 11,
  "DP:7": 4,
  "DP:3": 3,
  "DP:8": 2,
};
/** Asistencias (cartas de la pantalla 25b y home 03) */
const METAS_ASISTENCIAS: Partial<Record<Ref, number>> = { "DP:10": 9, "DP:9": 7, "DP:7": 6, "DP:8": 3 };
/** "4 partidos anotando seguidos": anota en J12–J15 y no en la J11. Doblete en la J12. */
const GOLES_EN_JORNADA: { ref: Ref; jornada: number; exactos?: number; minimo?: number }[] = [
  { ref: "DP:9", jornada: 11, exactos: 0 },
  { ref: "DP:9", jornada: 12, exactos: 2 },
  { ref: "DP:9", jornada: 13, minimo: 1 },
  { ref: "DP:9", jornada: 14, minimo: 1 },
];
/** Partidos jugados: El Chícharo 14, La Pulga 14, Toñito 13 (los demás de la carta juegan los 15) */
const AUSENCIAS: Partial<Record<Ref, number[]>> = { "DP:9": [7], "DP:7": [3], "DP:8": [4, 9] };
/** No faltan nunca (salvo AUSENCIAS) */
const SIEMPRE: Ref[] = [
  "DP:1",
  "DP:3",
  "DP:7",
  "DP:8",
  "DP:9",
  "DP:10",
  "TL:1",
  "TL:9",
  "RC:1",
  "RC:5",
  "RC:9",
];
/** Presentes por fuerza en una jornada (la cédula de la J15) */
const PRESENTES: Partial<Record<Ref, number[]>> = { "DP:11": [15], "DP:14": [15], "DP:5": [15] };
/** Nunca salen de cambio */
const INTOCABLES: Ref[] = ["DP:7", "DP:8", "DP:9", "DP:10", "TL:9", "RC:9"];
/**
 * Rojas. La de La Roca: la liga aplicó 2 partidos (panel de la liga, "APLICAR: 2 PARTIDOS") y ya cumplió uno.
 * PROVISIONAL (PRD §13.2, por decidir): no está definido si el ajuste de la liga reemplaza a la automática
 * (roja = 1) o se suma; aquí queda una sola sanción manual de 2 partidos, con su bitácora.
 */
const ROJAS: { jornada: number; ref: Ref; minuto: number; partidos: number; automatica: boolean }[] = [
  { jornada: 6, ref: "TL:3", minuto: 64, partidos: 1, automatica: true },
  { jornada: 9, ref: "SN:4", minuto: 58, partidos: 1, automatica: true },
  { jornada: 14, ref: "DP:4", minuto: 71, partidos: 2, automatica: false },
];
/** "Aguas: llevas 4 amarillas" · El Gato: 0 tarjetas en 15 partidos */
const AMARILLAS_EXACTAS: Partial<Record<Ref, number>> = { "DP:9": 4 };
const MAX_AMARILLAS = 4; // con 5 se suspende (Tournament.amarillasParaSuspension): nadie llega
const VALLAS_INVICTAS_PORTALES = 4; // El Gato · 4 vallas invictas
const PENALES_ATAJADOS: { ref: Ref; cuantos: number } = { ref: "TL:1", cuantos: 2 }; // El Pulpo
const MAX_GOLES_RESTO = 10; // nadie más alcanza al podio del goleo
const PROB_FALTA = 0.06;

const PESO_GOL: Record<Posicion, number> = {
  POR: 0,
  DFC: 0.6,
  LAT: 0.7,
  MCD: 1,
  MC: 1.5,
  MCO: 3,
  EXT: 3,
  DC: 5,
};
const TIPOS_GOL: [TipoGol, number][] = [
  ["JUGADA", 50],
  ["CABEZA", 15],
  ["FUERA_DEL_AREA", 12],
  ["PENAL", 10],
  ["TIRO_LIBRE", 7],
  ["PANENKA", 2],
  ["CHILENA", 2],
  ["OLIMPICO", 2],
];
const CON_ASISTENCIA = new Set<TipoGol>(["JUGADA", "CABEZA", "FUERA_DEL_AREA", "CHILENA"]);

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------
type Jugador = {
  id: string;
  ref: Ref;
  equipo: ClaveEquipo;
  numero: number;
  posicion: Posicion;
  datos: JugadorDemo;
  username: string;
};
type EnCancha = {
  jugador: Jugador;
  titular: boolean;
  entra: number;
  sale: number;
  jugo: boolean;
  por?: Jugador;
};
type Evento = {
  tipo: "GOL" | "AMARILLA" | "ROJA" | "CAMBIO" | "PENAL_ATAJADO";
  minuto: number;
  equipo: ClaveEquipo;
  jugador: Jugador;
  asistencia?: Jugador;
  sale?: Jugador;
  tipoGol?: TipoGol;
};
type Partido = {
  id: string;
  clave: string;
  jornada: number;
  horario: number;
  local: ClaveEquipo;
  visita: ClaveEquipo;
  fecha: string;
  arbitro: ClaveArbitro | null;
  jugado: boolean;
  resultado?: Resultado;
  goles: Record<Lado, number>;
  marcadorFijo: boolean;
  alineacion: Record<Lado, EnCancha[]>;
  eventos: Evento[];
};

export type PlanDemo = ReturnType<typeof armarLigaDemo>;

// ---------------------------------------------------------------------------
// Fechas (zona de negocio CDMX, guardado en UTC)
// ---------------------------------------------------------------------------
function sumarDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
const enCDMX = (ymd: string, hhmm: string) => fromZonedTime(`${ymd}T${hhmm}:00`, TZ);
const soloFecha = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const masMinutos = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);

/** Domingo de la J15 = el domingo más reciente ANTES de hoy (si hoy es domingo, hoy toca la J16) */
export function domingoJ15(hoy: Date): string {
  const ymd = formatInTimeZone(hoy, TZ, "yyyy-MM-dd");
  const diaIso = Number(formatInTimeZone(hoy, TZ, "i")); // 1 = lunes … 7 = domingo
  return sumarDias(ymd, -(diaIso === 7 ? 7 : diaIso));
}

// ---------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------
export function armarLigaDemo({ hoy = new Date(), semilla = 2026 }: { hoy?: Date; semilla?: number } = {}) {
  const azar = new Azar(semilla);
  const ahora = hoy;
  const noDespuesDeAhora = (d: Date) =>
    d.getTime() > ahora.getTime() ? new Date(ahora.getTime() - 60_000) : d;
  const j15 = domingoJ15(hoy);
  const fechaJornada = (n: number) => sumarDias(j15, (n - TORNEO.jornadasJugadas) * 7);
  const fechaInicio = fechaJornada(1);

  // ---- Personas -----------------------------------------------------------
  const usernames = new Set<string>();
  function username(nombre: string, apellidos: string, sobrenombre?: string) {
    const base = sobrenombre?.includes(" ")
      ? slug(sobrenombre)
      : slug(`${sobrenombre ?? nombre} ${apellidos.split(" ")[0]}`);
    let u = base;
    for (let n = 2; usernames.has(u); n++) u = `${base}-${n}`;
    usernames.add(u);
    return u;
  }

  const equipoPorClave = new Map<ClaveEquipo, EquipoDemo>(EQUIPOS.map((e) => [e.clave, e]));
  const jugadores = new Map<Ref, Jugador>();
  for (const e of EQUIPOS) {
    for (const j of e.jugadores) {
      const u = username(j.nombre, j.apellidos, j.sobrenombre);
      jugadores.set(`${e.clave}:${j.numero}`, {
        id: idDemo("usuario", u),
        ref: `${e.clave}:${j.numero}`,
        equipo: e.clave,
        numero: j.numero,
        posicion: j.posicion,
        datos: j,
        username: u,
      });
    }
  }
  const jugador = (ref: Ref) => {
    const j = jugadores.get(ref);
    if (!j) throw new Error(`No existe el jugador ${ref}`);
    return j;
  };
  const plantilla = (clave: ClaveEquipo) => [...jugadores.values()].filter((j) => j.equipo === clave);
  const delegado = (clave: ClaveEquipo) => jugador(`${clave}:${equipoPorClave.get(clave)!.delegado}`);

  const toUser = username(ORGANIZADOR.nombre, ORGANIZADOR.apellidos, ORGANIZADOR.sobrenombre);
  const organizadorId = idDemo("usuario", toUser);
  const arbitros = ARBITROS.map((a) => {
    const u = username(a.nombre, a.apellidos);
    return { ...a, username: u, id: idDemo("usuario", u) };
  });
  const arbitroId = (c: ClaveArbitro) => arbitros.find((a) => a.clave === c)!.id;
  const lupeUser = username(AFICIONADA.nombre, AFICIONADA.apellidos, AFICIONADA.sobrenombre);
  const lupeId = idDemo("usuario", lupeUser);

  const ligaId = idDemo("liga", LIGA.slug);
  const sedeId = idDemo("sede", SEDE.slug);
  const canchaIds = SEDE.canchas.map((c) => idDemo("cancha", `${SEDE.slug}:${c}`));
  const torneoId = idDemo("torneo", `${LIGA.slug}:${TORNEO.slug}`);
  const equipoId = (c: ClaveEquipo) => idDemo("equipo", equipoPorClave.get(c)!.slug);
  const inscripcionId = (c: ClaveEquipo) => idDemo("inscripcion", `${TORNEO.slug}:${c}`);
  const jornadaId = (n: number) => idDemo("jornada", `${TORNEO.slug}:${n}`);

  // ---- Rol ----------------------------------------------------------------
  const partidos: Partido[] = ROL.flatMap((cruces, i) => {
    const jornada = i + 1;
    return cruces.map(([local, visita], k) => {
      // J15 y J16 en el orden de horarios del deck; las demás rotan para que nadie juegue siempre a las 9
      const horario = jornada >= 15 ? k : (k + jornada) % TORNEO.horarios.length;
      const fijo = ARBITROS_FIJOS[clavePartido(jornada, local, visita)];
      const arbitro = fijo
        ? fijo
        : jornada === 15
          ? ARBITROS_J15[horario]
          : jornada === 16
            ? ARBITROS_J16[horario]
            : jornada <= TORNEO.jornadasJugadas
              ? ARBITROS[(horario + jornada) % ARBITROS.length].clave
              : null;
      const clave = clavePartido(jornada, local, visita);
      return {
        id: idDemo("partido", `${TORNEO.slug}:${clave}`),
        clave,
        jornada,
        horario,
        local,
        visita,
        fecha: fechaJornada(jornada),
        arbitro,
        jugado: jornada <= TORNEO.jornadasJugadas,
        goles: { L: 0, V: 0 },
        marcadorFijo: clave in MARCADORES_FIJOS,
        alineacion: { L: [], V: [] },
        eventos: [],
      } satisfies Partido;
    });
  });
  const jugados = partidos.filter((p) => p.jugado);
  const partidoDe = (jornada: number, equipo: ClaveEquipo) =>
    jugados.find((p) => p.jornada === jornada && (p.local === equipo || p.visita === equipo));
  const ladoDe = (p: Partido, equipo: ClaveEquipo): Lado => (p.local === equipo ? "L" : "V");
  const rival = (l: Lado): Lado => (l === "L" ? "V" : "L");

  // ---- Resultados: búsqueda local hasta que cuadre el récord de cada equipo ----
  resolverResultados(jugados, azar);

  // ---- Marcadores ---------------------------------------------------------
  for (const p of jugados) {
    const fijo = MARCADORES_FIJOS[p.clave];
    if (fijo) {
      p.goles = { L: fijo[0], V: fijo[1] };
      continue;
    }
    if (p.resultado === "E") {
      const g = azar.ponderado([
        [0, 2],
        [1, 4],
        [2, 2.5],
        [3, 0.8],
      ] as const);
      p.goles = { L: g, V: g };
    } else {
      const ganador = azar.ponderado([
        [1, 3],
        [2, 4],
        [3, 3],
        [4, 1.5],
        [5, 0.6],
      ] as const);
      let perdedor = azar.ponderado([
        [0, 4],
        [1, 3.5],
        [2, 1.2],
        [3, 0.3],
      ] as const);
      if (perdedor >= ganador) perdedor = ganador - 1;
      p.goles = p.resultado === "L" ? { L: ganador, V: perdedor } : { L: perdedor, V: ganador };
    }
  }
  asegurarGolesMinimos();
  ajustarVallasPortales(jugados, azar);

  /** Los goles fijos por jornada (doblete de la J12, racha del Chícharo) deben caber sin cambiar el resultado */
  function asegurarGolesMinimos() {
    for (const r of GOLES_EN_JORNADA) {
      const n = r.exactos ?? r.minimo ?? 0;
      const equipo = r.ref.split(":")[0] as ClaveEquipo;
      const p = partidoDe(r.jornada, equipo)!;
      const propio = ladoDe(p, equipo);
      while (p.goles[propio] < n) {
        if (p.marcadorFijo) throw new Error(`El marcador fijo de ${p.clave} no deja meter ${n} goles`);
        p.goles[propio] += 1;
        if (p.resultado === "E") p.goles[rival(propio)] += 1;
        else if (p.resultado === rival(propio) && p.goles[propio] >= p.goles[rival(propio)])
          p.goles[rival(propio)] = p.goles[propio] + 1;
      }
    }
  }

  // ---- Suspensiones por roja (se cumplen en las jornadas siguientes) ----------
  const suspendido = (ref: Ref, jornada: number) =>
    ROJAS.some((r) => r.ref === ref && jornada > r.jornada && jornada <= r.jornada + r.partidos);

  // ---- Alineaciones y cambios ---------------------------------------------
  for (const p of jugados) {
    for (const lado of ["L", "V"] as const) {
      const equipo = lado === "L" ? p.local : p.visita;
      p.alineacion[lado] = armarAlineacion(p, equipo);
    }
  }

  function grupo(pos: Posicion) {
    if (pos === "POR") return "POR";
    if (pos === "DFC" || pos === "LAT") return "DEF";
    if (pos === "DC") return "DEL";
    return "MED";
  }

  function armarAlineacion(p: Partido, equipo: ClaveEquipo): EnCancha[] {
    const disponibles = plantilla(equipo).filter((j) => {
      if (suspendido(j.ref, p.jornada)) return false;
      if (AUSENCIAS[j.ref]?.includes(p.jornada)) return false;
      if (PRESENTES[j.ref]?.includes(p.jornada)) return true;
      if (ROJAS.some((r) => r.ref === j.ref && r.jornada === p.jornada)) return true;
      if (SIEMPRE.includes(j.ref)) return true;
      return !azar.probabilidad(j.numero === 1 ? 0.02 : PROB_FALTA);
    });
    // Si falta el portero titular, el suplente siempre llega
    if (!disponibles.some((j) => j.posicion === "POR")) {
      const suplente = plantilla(equipo).find((j) => j.posicion === "POR" && !suspendido(j.ref, p.jornada));
      if (suplente) disponibles.push(suplente);
    }
    const datosEquipo = equipoPorClave.get(equipo)!;
    const porNumero = new Map(disponibles.map((j) => [j.numero, j]));
    const titulares: Jugador[] = [];
    const banca = (datosEquipo.banca ?? BANCA)
      .map((n) => porNumero.get(n))
      .filter((j): j is Jugador => Boolean(j));
    for (const n of datosEquipo.titulares ?? TITULARES) {
      const j = porNumero.get(n);
      if (j) {
        titulares.push(j);
        continue;
      }
      const posicionFaltante = datosEquipo.jugadores.find((x) => x.numero === n)!.posicion;
      const reemplazo =
        banca.find((b) => grupo(b.posicion) === grupo(posicionFaltante)) ??
        banca.find((b) => b.posicion !== "POR");
      if (reemplazo) {
        titulares.push(reemplazo);
        banca.splice(banca.indexOf(reemplazo), 1);
      }
    }
    const enCancha: EnCancha[] = [
      ...titulares.map((j) => ({ jugador: j, titular: true, entra: 0, sale: 90, jugo: true })),
      ...banca.map((j) => ({ jugador: j, titular: false, entra: 90, sale: 90, jugo: false })),
    ];

    const roja = ROJAS.find((r) => r.jornada === p.jornada && jugador(r.ref).equipo === equipo);
    if (roja) {
      const expulsado = enCancha.find((c) => c.jugador.ref === roja.ref);
      if (!expulsado?.titular) throw new Error(`${roja.ref} debe ser titular en la J${roja.jornada}`);
      expulsado.sale = roja.minuto;
    }

    if (p.clave === "15:DP-RC") {
      for (const e of CEDULA_J15)
        if (e.tipo === "CAMBIO" && jugador(e.ref).equipo === equipo)
          cambio(enCancha, jugador(e.ref), jugador(e.sale!), e.minuto);
      return enCancha;
    }
    const cuantos = azar.ponderado([
      [1, 2],
      [2, 4],
      [3, 3],
    ] as const);
    for (let i = 0; i < cuantos; i++) {
      const entra = enCancha.filter((c) => !c.jugo && c.jugador.posicion !== "POR");
      const salen = enCancha.filter(
        (c) =>
          c.titular &&
          c.sale === 90 &&
          c.jugador.posicion !== "POR" &&
          !INTOCABLES.includes(c.jugador.ref) &&
          !ROJAS.some((r) => r.ref === c.jugador.ref && r.jornada === p.jornada),
      );
      if (!entra.length || !salen.length) break;
      cambio(enCancha, azar.elegir(entra).jugador, azar.elegir(salen).jugador, azar.entero(46, 85));
    }
    return enCancha;
  }

  function cambio(enCancha: EnCancha[], entra: Jugador, sale: Jugador, minuto: number) {
    const e = enCancha.find((c) => c.jugador.id === entra.id)!;
    const s = enCancha.find((c) => c.jugador.id === sale.id)!;
    e.entra = minuto;
    e.sale = 90;
    e.jugo = true;
    e.por = sale;
    s.sale = minuto;
  }

  const enCanchaDe = (p: Partido, j: Jugador) =>
    p.alineacion[ladoDe(p, j.equipo)].find((c) => c.jugador.id === j.id && c.jugo);
  const enCanchaAl = (p: Partido, j: Jugador, minuto: number) => {
    const c = enCanchaDe(p, j);
    return Boolean(c && minuto > c.entra && minuto <= c.sale);
  };
  const minutoPara = (p: Partido, j: Jugador) => {
    const c = enCanchaDe(p, j)!;
    return azar.entero(c.entra + 1, c.sale);
  };

  // Cambios como eventos de la cédula
  for (const p of jugados) {
    for (const lado of ["L", "V"] as const) {
      for (const c of p.alineacion[lado].filter((x) => !x.titular && x.jugo)) {
        if (!c.por) throw new Error(`Cambio sin jugador que sale en ${p.clave}`);
        p.eventos.push({
          tipo: "CAMBIO",
          minuto: c.entra,
          equipo: c.jugador.equipo,
          jugador: c.jugador,
          sale: c.por,
        });
      }
    }
  }

  // ---- Goles ----------------------------------------------------------------
  const golesDe = (p: Partido, equipo: ClaveEquipo) =>
    p.eventos.filter((e) => e.tipo === "GOL" && e.equipo === equipo);
  const libres = (p: Partido, equipo: ClaveEquipo) => p.goles[ladoDe(p, equipo)] - golesDe(p, equipo).length;
  const golesTotales = (j: Jugador) =>
    jugados.reduce(
      (s, p) => s + p.eventos.filter((e) => e.tipo === "GOL" && e.jugador.id === j.id).length,
      0,
    );
  const anotar = (p: Partido, j: Jugador, minuto?: number, tipoGol?: TipoGol) =>
    p.eventos.push({
      tipo: "GOL",
      minuto: minuto ?? minutoPara(p, j),
      equipo: j.equipo,
      jugador: j,
      tipoGol: tipoGol ?? azar.ponderado(TIPOS_GOL),
    });
  /** Sube un gol al equipo en un partido que ganó (no cambia el resultado ni las vallas del rival) */
  const subirGol = (p: Partido, equipo: ClaveEquipo) => {
    const l = ladoDe(p, equipo);
    if (p.marcadorFijo || p.resultado !== l) return false;
    p.goles[l] += 1;
    return true;
  };

  // Cédula J15 Portales–Condesa (completa) y tiro libre del Tanque
  const j15DP = jugados.find((p) => p.clave === "15:DP-RC")!;
  for (const e of CEDULA_J15) {
    const j = jugador(e.ref);
    if (e.tipo === "GOL") anotar(j15DP, j, e.minuto, e.tipoGol);
    if (e.tipo === "AMARILLA")
      j15DP.eventos.push({ tipo: "AMARILLA", minuto: e.minuto, equipo: j.equipo, jugador: j });
  }
  {
    const p = partidoDe(GOL_TANQUE_J15.jornada, "TL")!;
    anotar(p, jugador(GOL_TANQUE_J15.ref), GOL_TANQUE_J15.minuto, GOL_TANQUE_J15.tipoGol);
  }
  const cerrado = (p: Partido) => p === j15DP;

  // Goles exactos o mínimos por jornada
  const bloqueado = new Set<string>(); // `${ref}:${jornada}`
  for (const r of GOLES_EN_JORNADA) {
    const j = jugador(r.ref);
    const p = partidoDe(r.jornada, j.equipo)!;
    if (!enCanchaDe(p, j)) throw new Error(`${r.ref} debe jugar la J${r.jornada}`);
    const n = r.exactos ?? r.minimo ?? 0;
    while (libres(p, j.equipo) < n)
      if (!subirGol(p, j.equipo)) throw new Error(`No caben ${n} goles en ${p.clave}`);
    for (let i = 0; i < n; i++) anotar(p, j);
    if (r.exactos != null) bloqueado.add(`${r.ref}:${r.jornada}`);
  }

  // Metas de goleo: se reparten gol por gol entre los partidos que jugó
  const metas = Object.entries(METAS_GOLES) as [Ref, number][];
  for (const [ref, meta] of metas.sort((a, b) => b[1] - a[1])) {
    const j = jugador(ref);
    const suyos = jugados.filter(
      (p) => enCanchaDe(p, j) && !cerrado(p) && !bloqueado.has(`${ref}:${p.jornada}`),
    );
    while (golesTotales(j) < meta) {
      const conLugar = suyos.filter((p) => libres(p, j.equipo) > 0);
      if (conLugar.length) {
        anotar(azar.elegir(conLugar), j);
        continue;
      }
      const ganados = suyos.filter((p) => p.resultado === ladoDe(p, j.equipo) && !p.marcadorFijo);
      if (!ganados.length) throw new Error(`No hay dónde meter los goles de ${ref}`);
      // Sube el marcador donde hubo menos goles para no inflar un solo partido
      const p = [...ganados].sort((a, b) => a.goles[ladoDe(a, j.equipo)] - b.goles[ladoDe(b, j.equipo)])[0];
      subirGol(p, j.equipo);
    }
  }

  // El resto de los goles: a quien estuvo en la cancha, según su posición
  const conMeta = new Set<string>(metas.map(([ref]) => jugador(ref).id));
  for (const p of jugados) {
    if (cerrado(p)) continue;
    for (const equipo of [p.local, p.visita]) {
      while (libres(p, equipo) > 0) {
        const candidatos = p.alineacion[ladoDe(p, equipo)].filter(
          (c) =>
            c.jugo &&
            !conMeta.has(c.jugador.id) &&
            PESO_GOL[c.jugador.posicion] > 0 &&
            golesTotales(c.jugador) < MAX_GOLES_RESTO,
        );
        if (!candidatos.length) throw new Error(`Nadie puede anotar en ${p.clave}`);
        const j = azar.ponderado(candidatos.map((c) => [c.jugador, PESO_GOL[c.jugador.posicion]] as const));
        anotar(p, j);
      }
    }
  }

  // ---- Asistencias ----------------------------------------------------------
  const asistibles = (equipo: ClaveEquipo) =>
    jugados
      .filter((p) => !cerrado(p))
      .flatMap((p) =>
        p.eventos
          .filter(
            (e) => e.tipo === "GOL" && e.equipo === equipo && !e.asistencia && CON_ASISTENCIA.has(e.tipoGol!),
          )
          .map((e) => ({ p, e })),
      );
  const metasAsist = Object.entries(METAS_ASISTENCIAS) as [Ref, number][];
  for (const [ref, meta] of metasAsist.sort((a, b) => b[1] - a[1])) {
    const j = jugador(ref);
    for (let i = 0; i < meta; i++) {
      let opciones = asistibles(j.equipo).filter(
        ({ p, e }) => e.jugador.id !== j.id && enCanchaAl(p, j, e.minuto),
      );
      if (!opciones.length) {
        // Un tiro libre o penal sin asistencia pasa a gol de jugada para que quepa la asistencia
        opciones = jugados
          .filter((p) => !cerrado(p))
          .flatMap((p) =>
            p.eventos
              .filter((e) => e.tipo === "GOL" && e.equipo === j.equipo && !e.asistencia)
              .map((e) => ({ p, e })),
          )
          .filter(({ p, e }) => e.jugador.id !== j.id && enCanchaAl(p, j, e.minuto));
        if (!opciones.length) throw new Error(`No hay goles para las asistencias de ${ref}`);
      }
      const elegido = azar.elegir(opciones).e;
      if (!CON_ASISTENCIA.has(elegido.tipoGol!)) elegido.tipoGol = "JUGADA";
      elegido.asistencia = j;
    }
  }
  const conMetaAsist = new Set<string>(metasAsist.map(([ref]) => jugador(ref).id));
  for (const equipo of EQUIPOS.map((e) => e.clave)) {
    for (const { p, e } of asistibles(equipo)) {
      if (!azar.probabilidad(0.5)) continue;
      const opciones = p.alineacion[ladoDe(p, equipo)].filter(
        (c) =>
          c.jugador.id !== e.jugador.id &&
          c.jugador.posicion !== "POR" &&
          !conMetaAsist.has(c.jugador.id) &&
          enCanchaAl(p, c.jugador, e.minuto),
      );
      if (opciones.length) e.asistencia = azar.elegir(opciones).jugador;
    }
  }

  // ---- Tarjetas -------------------------------------------------------------
  const amarillasDe = (j: Jugador) =>
    jugados.reduce(
      (s, p) => s + p.eventos.filter((e) => e.tipo === "AMARILLA" && e.jugador.id === j.id).length,
      0,
    );
  const amonestar = (p: Partido, j: Jugador) =>
    p.eventos.push({ tipo: "AMARILLA", minuto: minutoPara(p, j), equipo: j.equipo, jugador: j });
  for (const [ref, n] of Object.entries(AMARILLAS_EXACTAS) as [Ref, number][]) {
    const j = jugador(ref);
    const opciones = azar.barajar(jugados.filter((p) => !cerrado(p) && enCanchaDe(p, j)));
    for (const p of opciones.slice(0, n)) amonestar(p, j);
  }
  for (const r of ROJAS) {
    const j = jugador(r.ref);
    const p = partidoDe(r.jornada, j.equipo)!;
    p.eventos.push({ tipo: "ROJA", minuto: r.minuto, equipo: j.equipo, jugador: j });
  }
  for (const p of jugados) {
    if (cerrado(p)) continue;
    for (const equipo of [p.local, p.visita]) {
      const cuantas = azar.ponderado([
        [0, 3],
        [1, 4],
        [2, 2.5],
        [3, 0.8],
      ] as const);
      for (let i = 0; i < cuantas; i++) {
        const opciones = p.alineacion[ladoDe(p, equipo)].filter(
          (c) =>
            c.jugo &&
            c.jugador.posicion !== "POR" &&
            !(c.jugador.ref in AMARILLAS_EXACTAS) &&
            amarillasDe(c.jugador) < MAX_AMARILLAS &&
            !p.eventos.some(
              (e) => (e.tipo === "AMARILLA" || e.tipo === "ROJA") && e.jugador.id === c.jugador.id,
            ),
        );
        if (opciones.length) amonestar(p, azar.elegir(opciones).jugador);
      }
    }
  }

  // Penales atajados de El Pulpo
  {
    const j = jugador(PENALES_ATAJADOS.ref);
    const opciones = azar.barajar(jugados.filter((p) => !cerrado(p) && p.jornada < 15 && enCanchaDe(p, j)));
    for (const p of opciones.slice(0, PENALES_ATAJADOS.cuantos))
      p.eventos.push({ tipo: "PENAL_ATAJADO", minuto: minutoPara(p, j), equipo: j.equipo, jugador: j });
  }

  for (const p of jugados) p.eventos.sort((a, b) => a.minuto - b.minuto);

  // ---- Tabla y estadísticas (solo partidos VALIDADOS) -----------------------
  const tablaHasta = (ultima: number) => {
    const filas = EQUIPOS.map((e) => ({
      clave: e.clave,
      nombre: e.nombre,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      racha: [] as string[],
    }));
    const fila = (c: ClaveEquipo) => filas.find((f) => f.clave === c)!;
    for (const p of jugados.filter((x) => x.jornada <= ultima).sort((a, b) => a.jornada - b.jornada)) {
      for (const lado of ["L", "V"] as const) {
        const f = fila(lado === "L" ? p.local : p.visita);
        f.pj++;
        f.gf += p.goles[lado];
        f.gc += p.goles[rival(lado)];
        const r =
          p.goles[lado] > p.goles[rival(lado)] ? "G" : p.goles[lado] === p.goles[rival(lado)] ? "E" : "P";
        if (r === "G") f.pg++;
        else if (r === "E") f.pe++;
        else f.pp++;
        f.racha.push(r);
      }
    }
    // Puntos con la configuración del torneo. Desempate PROVISIONAL (PRD §13.1, por decidir):
    // puntos, diferencia, goles a favor.
    return filas
      .map((f) => ({ ...f, dg: f.gf - f.gc, pts: f.pg * TORNEO.puntosVictoria + f.pe * TORNEO.puntosEmpate }))
      .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre, "es"))
      .map((f, i) => ({ ...f, posicion: i + 1 }));
  };
  const tabla = tablaHasta(TORNEO.jornadasJugadas);
  const tablaAnterior = tablaHasta(TORNEO.jornadasJugadas - 1);

  const estadisticas = new Map(
    [...jugadores.values()].map((j) => {
      const suyos = jugados
        .filter((p) => p.alineacion[ladoDe(p, j.equipo)].some((c) => c.jugador.id === j.id && c.jugo))
        .sort((a, b) => a.jornada - b.jornada);
      const cuenta = (tipo: Evento["tipo"]) =>
        jugados.reduce(
          (s, p) => s + p.eventos.filter((e) => e.tipo === tipo && e.jugador.id === j.id).length,
          0,
        );
      const golesEn = (p: Partido) =>
        p.eventos.filter((e) => e.tipo === "GOL" && e.jugador.id === j.id).length;
      let rachaGoles = 0;
      for (const p of [...suyos].reverse()) {
        if (golesEn(p) === 0) break;
        rachaGoles++;
      }
      // PROVISIONAL (PRD §13.5, por decidir): "domingos sin faltar" = jornadas seguidas en las que jugó
      // (un suplente que fue y no entró cuenta como falta). La recomendación es contar también la banca.
      let rachaAsistencia = 0;
      for (let n = TORNEO.jornadasJugadas; n >= 1; n--) {
        if (!suyos.some((p) => p.jornada === n)) break;
        rachaAsistencia++;
      }
      // Goles recibidos y vallas: solo para porteros, en los partidos que jugaron
      const deArco = j.posicion === "POR" ? suyos : [];
      const recibidos = deArco.map((p) => p.goles[rival(ladoDe(p, j.equipo))]);
      return [
        j.id,
        {
          partidos: suyos.length,
          goles: cuenta("GOL"),
          asistencias: jugados.reduce(
            (s, p) => s + p.eventos.filter((e) => e.asistencia?.id === j.id).length,
            0,
          ),
          amarillas: cuenta("AMARILLA"),
          rojas: cuenta("ROJA"),
          golesRecibidos: recibidos.reduce((s, g) => s + g, 0),
          vallasInvictas: recibidos.filter((g) => g === 0).length,
          penalesAtajados: cuenta("PENAL_ATAJADO"),
          rachaGoles,
          rachaAsistencia,
        },
      ] as const;
    }),
  );

  // ---- Filas para la base -----------------------------------------------------
  const zonaEquipo = (c: ClaveEquipo) => equipoPorClave.get(c)!;
  const users: Prisma.UserCreateManyInput[] = [];
  const delegadosIds = new Set(EQUIPOS.map((e) => delegado(e.clave).id));
  for (const j of jugadores.values()) {
    const e = zonaEquipo(j.equipo);
    users.push({
      id: j.id,
      username: j.username,
      nombre: j.datos.nombre,
      apellidos: j.datos.apellidos,
      sobrenombre: j.datos.sobrenombre ?? null,
      zona: e.zona,
      alcaldia: e.alcaldia,
      activeRole: delegadosIds.has(j.id) ? "DELEGADO" : "JUGADOR",
      // Perfil sin reclamar: lo dio de alta su delegado (CLAUDE.md, "Perfiles sin reclamar")
      createdById: delegadosIds.has(j.id) ? null : delegado(j.equipo).id,
    });
  }
  users.push(
    {
      id: organizadorId,
      username: toUser,
      nombre: ORGANIZADOR.nombre,
      apellidos: ORGANIZADOR.apellidos,
      sobrenombre: ORGANIZADOR.sobrenombre,
      zona: LIGA.zona,
      alcaldia: LIGA.alcaldia,
      activeRole: "LIGA",
    },
    ...arbitros.map((a) => ({
      id: a.id,
      username: a.username,
      nombre: a.nombre,
      apellidos: a.apellidos,
      zona: LIGA.zona,
      alcaldia: LIGA.alcaldia,
      activeRole: "ARBITRO" as const,
    })),
    {
      id: lupeId,
      username: lupeUser,
      nombre: AFICIONADA.nombre,
      apellidos: AFICIONADA.apellidos,
      sobrenombre: AFICIONADA.sobrenombre,
      zona: LIGA.zona,
      alcaldia: LIGA.alcaldia,
      activeRole: "AFICIONADO",
    },
  );

  const userRoles: Prisma.UserRoleCreateManyInput[] = [
    ...[...jugadores.values()].map((j) => ({ userId: j.id, role: "JUGADOR" as const })),
    ...[...delegadosIds].map((id) => ({ userId: id, role: "DELEGADO" as const })),
    { userId: organizadorId, role: "LIGA" },
    ...arbitros.map((a) => ({ userId: a.id, role: "ARBITRO" as const })),
    { userId: lupeId, role: "AFICIONADO" },
  ];

  const playerProfiles: Prisma.PlayerProfileCreateManyInput[] = [...jugadores.values()].map((j) => {
    const s = estadisticas.get(j.id)!;
    return {
      userId: j.id,
      posiciones: [j.posicion],
      posicionPrincipal: j.posicion,
      pieHabil: j.datos.zurdo ? "IZQUIERDO" : "DERECHO",
      numeroFavorito: j.numero,
      tiposFutbol: ["SOCCER"],
      categoriasInteres: ["LIBRE"],
      // Carrera = solo lo validado en Chilena (por ahora, este torneo)
      partidos: s.partidos,
      goles: s.goles,
      asistencias: s.asistencias,
      amarillas: s.amarillas,
      rojas: s.rojas,
    };
  });

  const pitados = (c: ClaveArbitro) => jugados.filter((p) => p.arbitro === c).length;
  const refereeProfiles: Prisma.RefereeProfileCreateManyInput[] = arbitros.map((a) => ({
    userId: a.id,
    tiposFutbol: ["SOCCER"],
    categorias: ["LIBRE"],
    zonasInteres: [LIGA.zona],
    temporadas: a.temporadas,
    partidosPitados: pitados(a.clave),
  }));

  // Seguidores de Doña Lupe: 3 equipos y 14 cracks (pantalla 05)
  const equiposQueSigue: ClaveEquipo[] = ["DP", "TL", "JT"];
  const cracksQueSigue: Ref[] = [
    "DP:9",
    "DP:10",
    "DP:1",
    "DP:4",
    "DP:7",
    "DP:3",
    "DP:8",
    "TL:9",
    "TL:1",
    "TL:10",
    "RC:9",
    "RC:1",
    "JT:7",
    "JT:9",
  ];
  const seguidos = new Set(cracksQueSigue.map((r) => jugador(r).id));
  for (const u of users) {
    if (seguidos.has(u.id!)) u.followersCount = 1;
    if (u.id === lupeId) u.followingCount = cracksQueSigue.length;
  }

  const league: Prisma.LeagueCreateManyInput = {
    id: ligaId,
    slug: LIGA.slug,
    nombre: LIGA.nombre,
    siglas: LIGA.siglas,
    codigoAcceso: LIGA.codigoAcceso,
    descripcion: LIGA.descripcion,
    zona: LIGA.zona,
    alcaldia: LIGA.alcaldia,
    tiposFutbol: ["SOCCER"],
    categorias: ["LIBRE"],
    verificada: true,
    followersCount: 1,
    createdById: organizadorId,
  };
  const venue: Prisma.VenueCreateManyInput = {
    id: sedeId,
    slug: SEDE.slug,
    nombre: SEDE.nombre,
    direccion: SEDE.direccion,
    alcaldia: SEDE.alcaldia,
    zona: SEDE.zona,
    createdById: organizadorId,
  };
  const fields: Prisma.FieldCreateManyInput[] = SEDE.canchas.map((nombre, i) => ({
    id: canchaIds[i],
    venueId: sedeId,
    nombre,
    superficie: "SINTETICO",
    tipoFutbol: "SOCCER",
  }));

  const teams: Prisma.TeamCreateManyInput[] = EQUIPOS.map((e) => ({
    id: equipoId(e.clave),
    slug: e.slug,
    nombre: e.nombre,
    siglas: e.clave,
    colorPrimario: e.colorPrimario,
    colorSecundario: e.colorSecundario,
    zona: e.zona,
    alcaldia: e.alcaldia,
    tipoFutbol: "SOCCER",
    categoria: "LIBRE",
    diasJuego: [0],
    followersCount: equiposQueSigue.includes(e.clave) ? 1 : 0,
    createdById: delegado(e.clave).id,
  }));
  const alta = enCDMX(sumarDias(fechaInicio, -30), "20:00");
  const teamMembers: Prisma.TeamMemberCreateManyInput[] = [...jugadores.values()].map((j) => {
    const e = zonaEquipo(j.equipo);
    const esDelegado = j.numero === e.delegado;
    return {
      id: idDemo("miembro", j.ref),
      teamId: equipoId(j.equipo),
      userId: j.id,
      role: esDelegado ? "DELEGADO_PRINCIPAL" : j.numero === e.capitan ? "CAPITAN" : "JUGADOR",
      status: "ACTIVO",
      numero: j.numero,
      posicion: j.posicion,
      invitedById: esDelegado ? null : delegado(j.equipo).id,
      joinedAt: alta,
    };
  });

  const tournament: Prisma.TournamentCreateManyInput = {
    id: torneoId,
    leagueId: ligaId,
    slug: TORNEO.slug,
    nombre: TORNEO.nombre,
    categoria: "LIBRE",
    tipoFutbol: "SOCCER",
    rama: "VARONIL",
    formato: "LIGA_LIGUILLA",
    idaYVuelta: true,
    status: "EN_CURSO",
    fechaInicio: soloFecha(fechaInicio),
    numJornadas: TORNEO.numJornadas,
    diasSemana: [0],
    horarios: TORNEO.horarios,
    duracionPartidoMin: TORNEO.duracionPartidoMin,
    costoInscripcionCents: TORNEO.costoInscripcionCents,
    costoArbitrajeCents: TORNEO.costoArbitrajeCents,
    ventanaFichajesAbierta: false,
    puntosVictoria: TORNEO.puntosVictoria,
    puntosEmpate: TORNEO.puntosEmpate,
  };
  const tournamentTeams: Prisma.TournamentTeamCreateManyInput[] = EQUIPOS.map((e, i) => ({
    id: inscripcionId(e.clave),
    tournamentId: torneoId,
    teamId: equipoId(e.clave),
    status: "ACEPTADA",
    seed: i + 1,
    requestedAt: enCDMX(sumarDias(fechaInicio, -21), "19:00"),
    decidedAt: enCDMX(sumarDias(fechaInicio, -20), "10:00"),
  }));
  const tournamentRosters: Prisma.TournamentRosterCreateManyInput[] = [...jugadores.values()].map((j) => ({
    id: idDemo("registro", `${TORNEO.slug}:${j.ref}`),
    tournamentId: torneoId,
    tournamentTeamId: inscripcionId(j.equipo),
    userId: j.id,
    numero: j.numero,
    status: "ACTIVO",
    registeredAt: enCDMX(sumarDias(fechaInicio, -14), "19:00"),
    approvedAt: enCDMX(sumarDias(fechaInicio, -13), "10:00"),
  }));
  const tournamentReferees: Prisma.TournamentRefereeCreateManyInput[] = arbitros.map((a) => ({
    tournamentId: torneoId,
    userId: a.id,
    status: "ACTIVO",
  }));
  const rounds: Prisma.RoundCreateManyInput[] = ROL.map((_, i) => ({
    id: jornadaId(i + 1),
    tournamentId: torneoId,
    numero: i + 1,
    nombre: `Jornada ${i + 1}`,
    fase: "REGULAR",
    fechaInicio: soloFecha(fechaJornada(i + 1)),
    publicada: i + 1 <= TORNEO.jornadasJugadas + 1,
    cerrada: i + 1 <= TORNEO.jornadasJugadas,
  }));

  const horaDe = (p: Partido) => enCDMX(p.fecha, TORNEO.horarios[p.horario]);
  const inicioDe = (p: Partido) => masMinutos(horaDe(p), 5);
  const finDe = (p: Partido) => masMinutos(inicioDe(p), TORNEO.duracionPartidoMin + 15);
  const matches: Prisma.MatchCreateManyInput[] = partidos.map((p) => {
    const base = {
      id: p.id,
      kind: "TORNEO" as const,
      tournamentId: torneoId,
      roundId: jornadaId(p.jornada),
      homeTeamId: equipoId(p.local),
      awayTeamId: equipoId(p.visita),
      fieldId: canchaIds[TORNEO.canchaPorHorario[p.horario]],
      scheduledAt: horaDe(p),
      refereeId: p.arbitro ? arbitroId(p.arbitro) : null,
      arbitrajeCents: p.arbitro ? TARIFA_ARBITRO_CENTS : null,
    };
    if (!p.jugado) {
      return {
        ...base,
        status: "PROGRAMADO" as const,
        // J16: el deck tiene un árbitro por confirmar (Ortega) y Narvarte–Pensil sin asignar
        refereeStatus: p.arbitro
          ? p.arbitro === "ortega"
            ? ("ASIGNADO" as const)
            : ("ACEPTADO" as const)
          : null,
      };
    }
    const ganador = p.resultado === "E" ? null : equipoId(p.resultado === "L" ? p.local : p.visita);
    return {
      ...base,
      status: "VALIDADO" as const,
      homeScore: p.goles.L,
      awayScore: p.goles.V,
      winnerTeamId: ganador,
      liveHomeScore: p.goles.L,
      liveAwayScore: p.goles.V,
      liveViewers: p === j15DP ? 128 : 0,
      refereeStatus: "ACEPTADO" as const,
      startedAt: inicioDe(p),
      endedAt: finDe(p),
      validatedAt: noDespuesDeAhora(enCDMX(sumarDias(p.fecha, 1), "10:00")),
      validatedById: organizadorId,
    };
  });

  const lineups: Prisma.LineupCreateManyInput[] = [];
  const lineupPlayers: Prisma.LineupPlayerCreateManyInput[] = [];
  for (const p of jugados) {
    for (const lado of ["L", "V"] as const) {
      const equipo = lado === "L" ? p.local : p.visita;
      const id = idDemo("alineacion", `${p.clave}:${equipo}`);
      lineups.push({
        id,
        matchId: p.id,
        teamId: equipoId(equipo),
        submittedById: delegado(equipo).id,
        submittedAt: masMinutos(horaDe(p), -40),
      });
      const capitan = zonaEquipo(equipo).capitan;
      for (const c of p.alineacion[lado]) {
        lineupPlayers.push({
          lineupId: id,
          userId: c.jugador.id,
          numero: c.jugador.numero,
          titular: c.titular,
          posicion: c.jugador.posicion,
          capitan: c.jugador.numero === capitan,
          jugo: c.jugo,
        });
      }
    }
  }

  const tipoEvento = (e: Evento) => e.tipo;
  const matchEvents: Prisma.MatchEventCreateManyInput[] = jugados.flatMap((p) =>
    p.eventos.map((e, i) => ({
      id: idDemo("evento", `${p.clave}:${i}`),
      matchId: p.id,
      type: tipoEvento(e),
      minute: e.minuto,
      teamId: equipoId(e.equipo),
      playerId: e.jugador.id,
      assistPlayerId: e.asistencia?.id ?? null,
      playerOutId: e.sale?.id ?? null,
      tipoGol: e.tipoGol ?? null,
      source: "ARBITRO" as const,
      oficial: true,
      createdById: arbitroId(p.arbitro!),
      createdAt: masMinutos(finDe(p), 5),
    })),
  );

  const matchReports: Prisma.MatchReportCreateManyInput[] = jugados.map((p) => {
    const fin = finDe(p);
    return {
      id: idDemo("cedula", p.clave),
      matchId: p.id,
      source: "APP_ARBITRO",
      refereeId: arbitroId(p.arbitro!),
      status: "VALIDADA",
      homeScore: p.goles.L,
      awayScore: p.goles.V,
      submittedAt: masMinutos(fin, 12),
      homeSignedById: delegado(p.local).id,
      homeSignedAt: masMinutos(fin, 18),
      awaySignedById: delegado(p.visita).id,
      awaySignedAt: masMinutos(fin, 26),
      // Copia inmutable al enviar (regla 3)
      snapshot: {
        homeScore: p.goles.L,
        awayScore: p.goles.V,
        eventos: p.eventos.map((e) => ({
          tipo: e.tipo,
          minuto: e.minuto,
          equipo: e.equipo,
          jugador: e.jugador.id,
          ...(e.asistencia ? { asistencia: e.asistencia.id } : {}),
          ...(e.sale ? { sale: e.sale.id } : {}),
          ...(e.tipoGol ? { tipoGol: e.tipoGol } : {}),
        })),
      },
    };
  });

  // Marcador desde la banda de la J15 (NO oficial): lo fue contando Doña Lupe
  const liveScoreUpdates: Prisma.LiveScoreUpdateCreateManyInput[] = [];
  {
    let l = 0;
    let v = 0;
    for (const e of j15DP.eventos.filter((x) => x.tipo === "GOL")) {
      if (e.equipo === j15DP.local) l++;
      else v++;
      liveScoreUpdates.push({
        id: idDemo("banda", `${j15DP.clave}:${e.minuto}`),
        matchId: j15DP.id,
        reporterId: lupeId,
        homeScore: l,
        awayScore: v,
        minute: e.minuto,
        nota: e.tipoGol === "CHILENA" ? `${e.minuto}' ${e.jugador.datos.sobrenombre}, de chilena` : null,
        createdAt: masMinutos(inicioDe(j15DP), e.minuto + (e.minuto > 45 ? 15 : 0) + 1),
      });
    }
  }

  const sanctions: Prisma.SanctionCreateManyInput[] = ROJAS.map((r) => {
    const j = jugador(r.ref);
    const cumplidos = Math.min(r.partidos, TORNEO.jornadasJugadas - r.jornada);
    return {
      id: idDemo("sancion", `${r.jornada}:${r.ref}`),
      tournamentId: torneoId,
      userId: j.id,
      tournamentTeamId: inscripcionId(j.equipo),
      matchId: partidoDe(r.jornada, j.equipo)!.id,
      type: "SUSPENSION_PARTIDOS",
      partidos: r.partidos,
      partidosCumplidos: cumplidos,
      motivo: `Roja directa al ${r.minuto}' en la J${r.jornada}`,
      automatica: r.automatica,
      status: cumplidos >= r.partidos ? "CUMPLIDA" : "ACTIVA",
      createdById: r.automatica ? null : organizadorId,
    };
  });

  // Bitácora (CLAUDE.md: cambios a resultados y sanciones): la liga validó cada partido y aplicó la sanción manual
  const auditLogs: Prisma.AuditLogCreateManyInput[] = [
    ...jugados.map((p) => ({
      id: idDemo("bitacora", `validar:${p.clave}`),
      actorId: organizadorId,
      action: "VALIDATE" as const,
      entityType: "Match",
      entityId: p.id,
      before: { status: "FINALIZADO" },
      after: { status: "VALIDADO", homeScore: p.goles.L, awayScore: p.goles.V },
      createdAt: noDespuesDeAhora(enCDMX(sumarDias(p.fecha, 1), "10:00")),
    })),
    ...sanctions
      .filter((s) => !s.automatica)
      .map((s) => ({
        id: idDemo("bitacora", `sancion:${s.id}`),
        actorId: organizadorId,
        action: "CREATE" as const,
        entityType: "Sanction",
        entityId: s.id!,
        after: { type: s.type, partidos: s.partidos, userId: s.userId },
        motivo: s.motivo,
      })),
  ];

  const standings: Prisma.StandingRowCreateManyInput[] = tabla.map((f) => ({
    tournamentTeamId: inscripcionId(f.clave),
    tournamentId: torneoId,
    pj: f.pj,
    pg: f.pg,
    pe: f.pe,
    pp: f.pp,
    gf: f.gf,
    gc: f.gc,
    dg: f.dg,
    pts: f.pts,
    posicion: f.posicion,
    posicionAnterior: tablaAnterior.find((a) => a.clave === f.clave)!.posicion,
    // Últimos 5 resultados, del más viejo al más reciente (G gana · E empata · P pierde)
    racha: f.racha.slice(-5).join(""),
  }));

  const playerTournamentStats: Prisma.PlayerTournamentStatCreateManyInput[] = [...jugadores.values()].map(
    (j) => ({
      tournamentId: torneoId,
      userId: j.id,
      ...estadisticas.get(j.id)!,
    }),
  );

  // ---- Dinero (solo control, regla 7) ----------------------------------------
  const leagueReferees: Prisma.LeagueRefereeCreateManyInput[] = arbitros.map((a) => ({
    leagueId: ligaId,
    userId: a.id,
    status: "ACTIVO",
    tarifaCents: TARIFA_ARBITRO_CENTS,
  }));
  const leagueCharges: Prisma.LeagueChargeCreateManyInput[] = [];
  for (const e of EQUIPOS) {
    const inscripcionPendiente = e.clave === "RC"; // panel de la liga: Real Condesa debe $2,500
    leagueCharges.push({
      id: idDemo("cobro", `inscripcion:${e.clave}`),
      leagueId: ligaId,
      tournamentId: torneoId,
      tournamentTeamId: inscripcionId(e.clave),
      concept: "INSCRIPCION",
      descripcion: `Inscripción ${TORNEO.nombre}`,
      amountCents: TORNEO.costoInscripcionCents,
      dueDate: soloFecha(sumarDias(fechaInicio, -7)),
      status: inscripcionPendiente ? "PENDIENTE" : "CONFIRMADO",
      confirmedAt: inscripcionPendiente ? null : enCDMX(sumarDias(fechaInicio, -8), "12:00"),
      recordedById: organizadorId,
    });
    for (const p of partidos.filter(
      (x) => (x.local === e.clave || x.visita === e.clave) && x.jornada <= TORNEO.jornadasJugadas + 1,
    )) {
      // Pendientes: Narvarte no pagó la J15 (vencido) · Portales y Narvarte deben la J16
      const pendiente =
        (p.jornada === TORNEO.jornadasJugadas && e.clave === "SN") ||
        (p.jornada === TORNEO.jornadasJugadas + 1 && (e.clave === "DP" || e.clave === "SN"));
      leagueCharges.push({
        id: idDemo("cobro", `arbitraje:${p.clave}:${e.clave}`),
        leagueId: ligaId,
        tournamentId: torneoId,
        tournamentTeamId: inscripcionId(e.clave),
        matchId: p.id,
        concept: "ARBITRAJE",
        descripcion: `Arbitraje J${p.jornada}`,
        amountCents: TORNEO.costoArbitrajeCents,
        dueDate: soloFecha(sumarDias(p.fecha, -1)),
        status: pendiente ? "PENDIENTE" : "CONFIRMADO",
        confirmedAt: pendiente ? null : noDespuesDeAhora(enCDMX(sumarDias(p.fecha, -1), "12:00")),
        recordedById: organizadorId,
      });
    }
  }
  {
    const roja = ROJAS.find((r) => r.ref === "DP:4")!;
    leagueCharges.push({
      id: idDemo("cobro", "multa:DP:4"),
      leagueId: ligaId,
      tournamentId: torneoId,
      tournamentTeamId: inscripcionId("DP"),
      matchId: partidoDe(roja.jornada, "DP")!.id,
      concept: "MULTA",
      descripcion: `Multa · roja de ${jugador("DP:4").datos.sobrenombre}`,
      amountCents: 30_000,
      dueDate: soloFecha(sumarDias(fechaJornada(TORNEO.jornadasJugadas + 1), -1)),
      status: "PENDIENTE",
      recordedById: organizadorId,
    });
  }
  const refereePayments: Prisma.RefereePaymentCreateManyInput[] = jugados.map((p) => ({
    id: idDemo("pago-arbitro", p.clave),
    leagueId: ligaId,
    refereeId: arbitroId(p.arbitro!),
    matchId: p.id,
    amountCents: TARIFA_ARBITRO_CENTS,
    status: "CONFIRMADO",
    paidAt: masMinutos(finDe(p), 15),
  }));

  // Cuota del mes de Portales (pantallas 03, 04, 31, 54)
  const fechaJ16 = fechaJornada(TORNEO.jornadasJugadas + 1);
  const mes = formatInTimeZone(enCDMX(fechaJ16, "12:00"), TZ, "MMMM", { locale: es });
  const cuotaId = idDemo("cuota", `DP:${mes}`);
  const teamDues: Prisma.TeamDueCreateManyInput[] = [
    {
      id: cuotaId,
      teamId: equipoId("DP"),
      concepto: `Cuota de ${mes}`,
      amountCents: 65_000,
      dueDate: soloFecha(sumarDias(j15, 2)),
      createdById: delegado("DP").id,
    },
  ];
  const cuotaPendiente: Ref[] = ["DP:9", "DP:7", "DP:14"];
  const cuotaReportada: Ref[] = ["DP:15"];
  const teamDuePayments: Prisma.TeamDuePaymentCreateManyInput[] = plantilla("DP").map((j) => {
    if (cuotaPendiente.includes(j.ref)) return { dueId: cuotaId, userId: j.id, status: "PENDIENTE" as const };
    if (cuotaReportada.includes(j.ref))
      return {
        dueId: cuotaId,
        userId: j.id,
        status: "REPORTADO" as const,
        reportedAt: masMinutos(ahora, -180),
      };
    return {
      dueId: cuotaId,
      userId: j.id,
      status: "CONFIRMADO" as const,
      reportedAt: noDespuesDeAhora(enCDMX(sumarDias(j15, -5), "21:00")),
      confirmedAt: noDespuesDeAhora(enCDMX(sumarDias(j15, -4), "09:00")),
      confirmedById: delegado("DP").id,
    };
  });

  // Pase de lista de la J16 de Portales: 11 de 16 van (pantalla 04)
  const j16DP = partidos.find(
    (p) => p.jornada === TORNEO.jornadasJugadas + 1 && (p.local === "DP" || p.visita === "DP"),
  )!;
  const attendanceLinks: Prisma.AttendanceLinkCreateManyInput[] = [
    {
      token: idDemo("pase", j16DP.clave).replace(/-/g, "").slice(0, 12),
      matchId: j16DP.id,
      teamId: equipoId("DP"),
      expiresAt: enCDMX(j16DP.fecha, "23:59"),
      createdAt: masMinutos(ahora, -26 * 60),
    },
  ];
  // La Roca también va en la lista con su alerta: las alertas no bloquean (PRD §7.6), decide el delegado
  const noVa: Partial<Record<Ref, string>> = {
    "DP:15": "Le toca trabajar",
    "DP:4": "Suspendido · roja en la J14",
  };
  const sinRespuesta: Ref[] = ["DP:7", "DP:14", "DP:12"];
  const matchAttendances: Prisma.MatchAttendanceCreateManyInput[] = plantilla("DP").map((j, i) => {
    if (sinRespuesta.includes(j.ref))
      return { matchId: j16DP.id, userId: j.id, teamId: equipoId("DP"), status: "CONVOCADO" as const };
    const nota = noVa[j.ref];
    return {
      matchId: j16DP.id,
      userId: j.id,
      teamId: equipoId("DP"),
      status: nota ? ("NO_VA" as const) : ("VA" as const),
      channel: j.ref === "DP:9" || j.ref === "DP:3" ? ("APP" as const) : ("LINK" as const),
      nota: nota ?? null,
      respondedAt: masMinutos(ahora, -(60 + i * 37)),
    };
  });

  const teamFollows: Prisma.TeamFollowCreateManyInput[] = equiposQueSigue.map((c) => ({
    userId: lupeId,
    teamId: equipoId(c),
  }));
  const userFollows: Prisma.UserFollowCreateManyInput[] = cracksQueSigue.map((r) => ({
    followerId: lupeId,
    followedId: jugador(r).id,
  }));
  const leagueFollows: Prisma.LeagueFollowCreateManyInput[] = [{ userId: lupeId, leagueId: ligaId }];

  return {
    claves: {
      ligaSlug: LIGA.slug,
      sedeSlug: SEDE.slug,
      equipoSlugs: EQUIPOS.map((e) => e.slug),
      usernames: users.map((u) => u.username),
      fechaJ15: j15,
    },
    users,
    userRoles,
    playerProfiles,
    refereeProfiles,
    league,
    leagueAdmins: [
      { leagueId: ligaId, userId: organizadorId, role: "DUENO" },
    ] as Prisma.LeagueAdminCreateManyInput[],
    venue,
    fields,
    leagueVenues: [{ leagueId: ligaId, venueId: sedeId }] as Prisma.LeagueVenueCreateManyInput[],
    leagueReferees,
    teams,
    teamMembers,
    tournament,
    tournamentTeams,
    tournamentRosters,
    tournamentReferees,
    rounds,
    matches,
    lineups,
    lineupPlayers,
    matchEvents,
    matchReports,
    liveScoreUpdates,
    sanctions,
    standings,
    playerTournamentStats,
    leagueCharges,
    refereePayments,
    teamDues,
    teamDuePayments,
    attendanceLinks,
    matchAttendances,
    teamFollows,
    userFollows,
    leagueFollows,
    auditLogs,
    /** Para el log y los tests */
    resumen: {
      tabla: tabla.map((f) => ({
        equipo: f.nombre,
        clave: f.clave,
        pj: f.pj,
        pg: f.pg,
        pe: f.pe,
        pp: f.pp,
        dg: f.dg,
        pts: f.pts,
      })),
      goleo: [...jugadores.values()]
        .map((j) => ({
          ref: j.ref,
          nombre: j.datos.sobrenombre ?? j.datos.nombre,
          goles: estadisticas.get(j.id)!.goles,
        }))
        .sort((a, b) => b.goles - a.goles)
        .slice(0, 5),
    },
  };
}

// ---------------------------------------------------------------------------
// Resultados que cuadran con RECORD_J15 (búsqueda local con semilla)
// ---------------------------------------------------------------------------
function resolverResultados(jugados: Partido[], azar: Azar) {
  const fuerza = (c: ClaveEquipo) => EQUIPOS.find((e) => e.clave === c)!.fuerza;
  const libres = jugados.filter((p) => !(p.clave in RESULTADOS_FIJOS));
  for (const p of jugados) if (p.clave in RESULTADOS_FIJOS) p.resultado = RESULTADOS_FIJOS[p.clave];

  const costo = () => {
    let total = 0;
    for (const e of EQUIPOS) {
      let g = 0;
      let em = 0;
      let pe = 0;
      for (const p of jugados) {
        if (p.local !== e.clave && p.visita !== e.clave) continue;
        const lado: Lado = p.local === e.clave ? "L" : "V";
        if (p.resultado === "E") em++;
        else if (p.resultado === lado) g++;
        else pe++;
      }
      const r = RECORD_J15[e.clave];
      total += Math.abs(g - r.g) + Math.abs(em - r.e) + Math.abs(pe - r.p);
    }
    return total;
  };

  for (let intento = 0; intento < 200; intento++) {
    // Arranque creíble: el más fuerte suele ganar
    for (const p of libres) {
      const d = fuerza(p.local) - fuerza(p.visita);
      p.resultado = azar.ponderado([
        ["L", Math.max(0.05, 0.4 + d)],
        ["E", 0.25],
        ["V", Math.max(0.05, 0.35 - d)],
      ] as const);
    }
    let actual = costo();
    for (let paso = 0; paso < 4000 && actual > 0; paso++) {
      const p = azar.elegir(libres);
      const antes = p.resultado!;
      p.resultado = azar.elegir((["L", "E", "V"] as const).filter((r) => r !== antes));
      const nuevo = costo();
      if (nuevo <= actual || azar.probabilidad(0.02)) actual = nuevo;
      else p.resultado = antes;
    }
    if (actual === 0) return;
  }
  throw new Error("No se encontró un rol de resultados que cuadre con RECORD_J15");
}

/** El Gato termina la J15 con exactamente 4 vallas invictas */
function ajustarVallasPortales(jugados: Partido[], azar: Azar) {
  const dePortales = jugados.filter((p) => p.local === "DP" || p.visita === "DP");
  const contra = (p: Partido) => (p.local === "DP" ? "V" : "L") as Lado;
  const propio = (p: Partido) => (p.local === "DP" ? "L" : "V") as Lado;
  const vallas = () => dePortales.filter((p) => p.goles[contra(p)] === 0).length;
  for (let i = 0; i < 50 && vallas() !== VALLAS_INVICTAS_PORTALES; i++) {
    if (vallas() > VALLAS_INVICTAS_PORTALES) {
      const p = azar.elegir(dePortales.filter((x) => !x.marcadorFijo && x.goles[contra(x)] === 0));
      if (p.resultado === "E") {
        p.goles = { L: p.goles.L + 1, V: p.goles.V + 1 };
      } else {
        if (p.goles[propio(p)] < 2) p.goles[propio(p)] = 2;
        p.goles[contra(p)] = 1;
      }
    } else {
      const opciones = dePortales.filter(
        (x) => !x.marcadorFijo && x.resultado === propio(x) && x.goles[contra(x)] > 0,
      );
      if (!opciones.length) break;
      const p = azar.elegir(opciones);
      p.goles[contra(p)] = 0;
    }
  }
  if (vallas() !== VALLAS_INVICTAS_PORTALES) throw new Error("No cuadran las vallas invictas de Portales");
}
