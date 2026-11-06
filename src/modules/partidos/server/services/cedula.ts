/**
 * La cédula del árbitro al terminar el partido (PRD §7.7 · pantallas 19, 56a y 56b).
 * Servicio puro: sin base de datos ni Next. Lo usan el celular del árbitro (borrador) y el servidor (al
 * enviar y al aceptar una corrección), así los dos validan igual.
 */
import { marcadorDeEventos } from "./resumen-partido";

/** Lámina 29: NORMAL es la jugada de siempre */
export const TIPOS_DE_GOL = ["JUGADA", "CABEZA", "PENAL", "TIRO_LIBRE", "FUERA_DEL_AREA", "CHILENA", "PANENKA", "OLIMPICO"] as const;
export type TipoDeGol = (typeof TIPOS_DE_GOL)[number];

/** Lo que se captura al final: goles, autogoles y tarjetas (los cambios son opcionales y no van aquí) */
export const TIPOS_CAPTURADOS = ["GOL", "AUTOGOL", "AMARILLA", "ROJA"] as const;
export type TipoCapturado = (typeof TIPOS_CAPTURADOS)[number];

/** Motivo de la doble amarilla: la roja que sale sola con la segunda (PRD §7.8) */
export const NOTA_DOBLE_AMARILLA = "Doble amarilla";

export type EventoCapturado = {
  /** `clientId` del celular (uuid); al guardarse se vuelve el id del MatchEvent */
  id: string;
  tipo: TipoCapturado;
  /** Equipo del jugador. En el AUTOGOL también: suma al contrario (PRD §7.7) */
  equipoId: string;
  jugadorId: string;
  minuto: number | null;
  /** Solo en GOL */
  tipoGol: TipoDeGol | null;
  /** Motivo de la tarjeta ("Falta por detrás") */
  nota: string | null;
};

export type Cedula = {
  /** Quién jugó, por equipo */
  jugaron: Record<string, string[]>;
  eventos: EventoCapturado[];
  observaciones: string;
};

export type ContextoCedula = {
  localId: string;
  visitaId: string;
  /** Inscritos y aprobados en el torneo, por equipo (regla 4: nadie está en dos) */
  inscritos: Record<string, string[]>;
  /** Con una suspensión activa: no pueden jugar (PRD §7.6) */
  suspendidos: string[];
  nombres?: Record<string, string>;
};

export const MINUTO_MAXIMO = 130;

const esTarjeta = (t: TipoCapturado) => t === "AMARILLA" || t === "ROJA";

/**
 * Agrega una tarjeta. La segunda amarilla del mismo jugador trae su roja (la cédula guarda las dos
 * amarillas y la expulsión, PRD §7.8). Con una roja ya no se le saca nada más.
 */
export function agregarTarjeta(eventos: EventoCapturado[], t: EventoCapturado, idRoja: string) {
  const suyas = eventos.filter((e) => e.jugadorId === t.jugadorId && esTarjeta(e.tipo));
  if (suyas.some((e) => e.tipo === "ROJA")) return { eventos, dobleAmarilla: false, rechazada: true };
  const amarillas = suyas.filter((e) => e.tipo === "AMARILLA").length;
  if (t.tipo === "AMARILLA" && amarillas >= 1) {
    const roja: EventoCapturado = { ...t, id: idRoja, tipo: "ROJA", tipoGol: null, nota: NOTA_DOBLE_AMARILLA };
    return { eventos: [...eventos, { ...t, tipoGol: null }, roja], dobleAmarilla: true, rechazada: false };
  }
  return { eventos: [...eventos, { ...t, tipoGol: null }], dobleAmarilla: false, rechazada: false };
}

/** Quita un evento; si era una de las dos amarillas, también la roja que trajo */
export function quitarEvento(eventos: EventoCapturado[], id: string) {
  const quitado = eventos.find((e) => e.id === id);
  let quedan = eventos.filter((e) => e.id !== id);
  if (quitado?.tipo === "AMARILLA") {
    const amarillas = quedan.filter((e) => e.jugadorId === quitado.jugadorId && e.tipo === "AMARILLA").length;
    if (amarillas < 2) quedan = quedan.filter((e) => !(e.jugadorId === quitado.jugadorId && e.tipo === "ROJA" && e.nota === NOTA_DOBLE_AMARILLA));
  }
  return quedan;
}

/** Si quitas a alguien de "Jugaron", se van sus goles y tarjetas */
export function quitarJugador(cedula: Cedula, equipoId: string, jugadorId: string): Cedula {
  return {
    ...cedula,
    jugaron: { ...cedula.jugaron, [equipoId]: (cedula.jugaron[equipoId] ?? []).filter((id) => id !== jugadorId) },
    eventos: cedula.eventos.filter((e) => e.jugadorId !== jugadorId),
  };
}

export const marcadorDeLaCedula = (eventos: EventoCapturado[], localId: string, visitaId: string) =>
  marcadorDeEventos(eventos, localId, visitaId);

/**
 * Lo que impide mandar la cédula, en palabras del llano. Vacío = se puede mandar.
 * El servidor lo vuelve a revisar con los inscritos y las sanciones de la base.
 */
export function problemasDeLaCedula(c: Cedula, ctx: ContextoCedula): string[] {
  const nombre = (id: string) => ctx.nombres?.[id] ?? "Un jugador";
  const problemas: string[] = [];
  const equipos = [ctx.localId, ctx.visitaId];
  const suspendidos = new Set(ctx.suspendidos);
  for (const equipo of Object.keys(c.jugaron)) if (!equipos.includes(equipo)) problemas.push("Hay un equipo que no juega este partido.");
  const vistos = new Set<string>();
  for (const equipo of equipos) {
    const jugaron = c.jugaron[equipo] ?? [];
    if (!jugaron.length) problemas.push("Marca quién jugó de cada equipo.");
    const inscritos = new Set(ctx.inscritos[equipo] ?? []);
    for (const id of jugaron) {
      if (vistos.has(id)) problemas.push(`${nombre(id)} aparece dos veces.`);
      vistos.add(id);
      if (!inscritos.has(id)) problemas.push(`${nombre(id)} no está registrado con ese equipo en el torneo.`);
      if (suspendidos.has(id)) problemas.push(`${nombre(id)} está suspendido: no puede jugar.`);
    }
  }
  const ids = new Set<string>();
  for (const e of c.eventos) {
    if (ids.has(e.id)) problemas.push("Hay un evento repetido.");
    ids.add(e.id);
    if (!equipos.includes(e.equipoId)) problemas.push("Hay un evento de un equipo que no juega este partido.");
    else if (!(c.jugaron[e.equipoId] ?? []).includes(e.jugadorId))
      problemas.push(`${nombre(e.jugadorId)} tiene ${esTarjeta(e.tipo) ? "tarjeta" : "gol"} pero no está marcado en "Jugaron".`);
    if (e.minuto != null && (!Number.isInteger(e.minuto) || e.minuto < 0 || e.minuto > MINUTO_MAXIMO))
      problemas.push(`El minuto ${e.minuto} no cuadra.`);
    if (e.tipo !== "GOL" && e.tipoGol) problemas.push("Solo el gol lleva tipo de gol.");
  }
  const porJugador = new Map<string, EventoCapturado[]>();
  for (const e of c.eventos.filter((x) => esTarjeta(x.tipo))) porJugador.set(e.jugadorId, [...(porJugador.get(e.jugadorId) ?? []), e]);
  for (const [id, ts] of porJugador) {
    if (ts.filter((t) => t.tipo === "ROJA").length > 1) problemas.push(`${nombre(id)} tiene dos rojas.`);
    if (ts.filter((t) => t.tipo === "AMARILLA").length > 2) problemas.push(`${nombre(id)} tiene más de dos amarillas.`);
  }
  return [...new Set(problemas)];
}

// ---- Correcciones (pantalla 19): el delegado señala, el árbitro acepta o rechaza

export const TIPOS_DE_CORRECCION = ["JUGADOR_EQUIVOCADO", "MINUTO", "TIPO_EVENTO", "FALTA_EVENTO", "SOBRA_EVENTO"] as const;
export type TipoDeCorreccion = (typeof TIPOS_DE_CORRECCION)[number];

/** Lo que propone el delegado (`MatchReportCorrection.propuesta`) */
export type Propuesta = {
  jugadorId?: string;
  equipoId?: string;
  minuto?: number | null;
  tipo?: TipoCapturado;
  tipoGol?: TipoDeGol | null;
};

export type Correccion = { kind: TipoDeCorreccion; eventoId: string | null; propuesta: Propuesta };

/** Cómo queda la lista de eventos si el árbitro acepta (la cédula cambia y se vuelve a firmar) */
export function aplicarCorreccion(eventos: EventoCapturado[], c: Correccion, idNuevo: string): EventoCapturado[] {
  if (c.kind === "FALTA_EVENTO") {
    const p = c.propuesta;
    if (!p.tipo || !p.jugadorId || !p.equipoId) throw new Error("A la propuesta le falta el evento.");
    return [
      ...eventos,
      {
        id: idNuevo,
        tipo: p.tipo,
        equipoId: p.equipoId,
        jugadorId: p.jugadorId,
        minuto: p.minuto ?? null,
        tipoGol: p.tipo === "GOL" ? (p.tipoGol ?? null) : null,
        nota: null,
      },
    ];
  }
  const actual = eventos.find((e) => e.id === c.eventoId);
  if (!actual) throw new Error("Ese evento ya no está en la cédula.");
  if (c.kind === "SOBRA_EVENTO") return eventos.filter((e) => e.id !== actual.id);
  const p = c.propuesta;
  const cambiado: EventoCapturado =
    c.kind === "JUGADOR_EQUIVOCADO"
      ? { ...actual, jugadorId: p.jugadorId ?? actual.jugadorId, equipoId: p.equipoId ?? actual.equipoId }
      : c.kind === "MINUTO"
        ? { ...actual, minuto: p.minuto ?? null }
        : {
            ...actual,
            tipo: p.tipo ?? actual.tipo,
            tipoGol: (p.tipo ?? actual.tipo) === "GOL" ? (p.tipoGol ?? actual.tipoGol) : null,
          };
  return eventos.map((e) => (e.id === actual.id ? cambiado : e));
}

const ETIQUETA_TIPO: Record<TipoCapturado, string> = { GOL: "Gol", AUTOGOL: "Autogol", AMARILLA: "Amarilla", ROJA: "Roja" };

/** "Gol · El Brujo · 63'" (lo que DICE la cédula y lo que DEBE DECIR) */
export function textoDelEvento(e: Pick<EventoCapturado, "tipo" | "minuto" | "jugadorId">, nombres: Record<string, string>) {
  return [ETIQUETA_TIPO[e.tipo], nombres[e.jugadorId] ?? "¿quién?", e.minuto != null ? `${e.minuto}'` : null].filter(Boolean).join(" · ");
}

/** "Chícharo 12' · 63' · Brujo 87'" (resumen de la pantalla 56b) */
export function lineaDeGoles(eventos: EventoCapturado[], nombres: Record<string, string>) {
  const goles = eventos
    .filter((e) => e.tipo === "GOL" || e.tipo === "AUTOGOL")
    .sort((a, b) => (a.minuto ?? 999) - (b.minuto ?? 999));
  if (!goles.length) return "Sin goles";
  return goles
    .map((g) => `${g.tipo === "AUTOGOL" ? "autogol de " : ""}${nombres[g.jugadorId] ?? "?"}${g.minuto != null ? ` ${g.minuto}'` : ""}`)
    .join(" · ");
}
