/**
 * Publicaciones automáticas de una jornada (PRD §6.1 · pantalla 10): resultado, gol, crónica, tabla y
 * racha. Servicio puro: sin base de datos ni Next. Todo sale de cédulas VALIDADAS (regla 2) y solo con
 * datos reales (regla 9). Hoy se arman al leer; con la cola de `match.validated` se guardarán en `posts`.
 */
import { elegirTitular, type Situacion } from "../templates/titulares";

export type EquipoJornada = {
  id: string;
  nombre: string;
  corto: string;
  slug: string;
  siglas: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
};
export type GolJornada = {
  minuto: number | null;
  /** El equipo al que SUMA (en un autogol, el contrario del jugador) */
  equipoId: string;
  /** Autogol: suma al contrario y no cuenta en el goleo de nadie (PRD §7.7) */
  autogol?: boolean;
  jugadorId: string;
  jugador: string;
  username: string;
  tipoGol: string | null;
};
export type PartidoJornada = {
  id: string;
  jornada: number;
  cancha: string | null;
  /** Hora del partido: ordena lo cronológico (Siguiendo) */
  inicio: Date | null;
  validadoEn: Date | null;
  local: EquipoJornada;
  visita: EquipoJornada;
  golesLocal: number;
  golesVisita: number;
  goles: GolJornada[];
  arbitro: string | null;
};

const DE_TIPO: Record<string, string> = {
  CHILENA: "de chilena",
  PANENKA: "a lo Panenka",
  CABEZA: "de cabeza",
  PENAL: "de penal",
  TIRO_LIBRE: "de tiro libre",
  FUERA_DEL_AREA: "de fuera del área",
  OLIMPICO: "olímpico",
};
/** "Panenka y chilena salen en lima: son golazo" (32a) */
const GOLAZO = new Set(["CHILENA", "PANENKA"]);

/** `fecha`: para ordenar (hora del partido + minuto del gol); `validado`: el día que lo validó la liga */
type Base = { id: string; fecha: number; validado: number; equipos: string[]; jugadores: string[] };
export type Marcador = { local: EquipoJornada; visita: EquipoJornada; golesLocal: number; golesVisita: number };
export type AutoPost =
  | (Base & { tipo: "AUTO_CRONICA"; matchId: string; jornada: number; situacion: Situacion; titular: string; cuerpo: string[]; marcador: Marcador })
  | (Base & {
      tipo: "AUTO_GOL";
      matchId: string;
      jornada: number;
      titular: string;
      grande: string;
      golazo: boolean;
      minuto: number | null;
      autor: { nombre: string; username: string };
      cancha: string | null;
      marcador: Marcador;
    })
  | (Base & { tipo: "AUTO_RESULTADO"; matchId: string; jornada: number; marcador: Marcador; goleadores: { equipoId: string; texto: string }[]; arbitro: string | null })
  | (Base & {
      tipo: "AUTO_TABLA";
      jornada: number;
      tabla: { equipo: EquipoJornada; pts: number; posicion: number | null }[];
      goleo: { nombre: string; username: string; goles: number }[];
    })
  | (Base & { tipo: "AUTO_RACHA"; jornada: number; autor: { nombre: string; username: string }; racha: number })
  | (Base & {
      tipo: "AUTO_INSIGNIA";
      autor: { nombre: string; username: string };
      insignia: { code: string; nombre: string; descripcion: string; icon: string | null };
      veces: number;
    });

/** Insignias que no se anuncian en el feed (se ganan solas o no dicen nada del juego) */
const SIN_ANUNCIO = new Set(["PIONERO"]);

/** "El Brujo ganó la insignia De Chilena" (PRD §6.1 · auto-post de insignia) */
export function postDeInsignia(entrada: {
  userId: string;
  nombre: string;
  username: string;
  equipoId?: string;
  insignia: { code: string; nombre: string; descripcion: string; icon: string | null };
  veces: number;
  fecha: number;
}): AutoPost | null {
  if (SIN_ANUNCIO.has(entrada.insignia.code)) return null;
  return {
    tipo: "AUTO_INSIGNIA",
    id: `insignia:${entrada.userId}:${entrada.insignia.code}:${entrada.veces}`,
    fecha: entrada.fecha,
    validado: entrada.fecha,
    equipos: entrada.equipoId ? [entrada.equipoId] : [],
    jugadores: [entrada.userId],
    autor: { nombre: entrada.nombre, username: entrada.username },
    insignia: entrada.insignia,
    veces: entrada.veces,
  };
}

type Ganador = { ganador: EquipoJornada; perdedor: EquipoJornada } | null;

function ganadorDe(p: PartidoJornada): Ganador {
  if (p.golesLocal === p.golesVisita) return null;
  return p.golesLocal > p.golesVisita ? { ganador: p.local, perdedor: p.visita } : { ganador: p.visita, perdedor: p.local };
}

/** El marcador gol por gol (los goles sin minuto no permiten saber el orden) */
function recorrido(p: PartidoJornada) {
  const conMinuto = p.goles.filter((g) => g.minuto != null).sort((a, b) => a.minuto! - b.minuto!);
  let l = 0;
  let v = 0;
  return conMinuto.map((g) => {
    if (g.equipoId === p.local.id) l++;
    else v++;
    return { gol: g, local: l, visita: v };
  });
}

/** Qué pasó en el partido, de lo más fuerte a lo más normal */
export function situacionDelPartido(p: PartidoJornada, liderAntesId?: string): { situacion: Situacion; clave?: GolJornada } {
  const g = ganadorDe(p);
  const pasos = recorrido(p);
  const completo = pasos.length === p.goles.length;
  const porJugador = new Map<string, GolJornada[]>();
  for (const gol of p.goles.filter((x) => !x.autogol)) porJugador.set(gol.jugadorId, [...(porJugador.get(gol.jugadorId) ?? []), gol]);
  const hatTrick = [...porJugador.values()].find((x) => x.length >= 3);
  const chilena = p.goles.find((x) => x.tipoGol === "CHILENA" && !x.autogol);
  if (!g) return { situacion: "EMPATE" };
  const esGanador = (s: { local: number; visita: number }) => (g.ganador.id === p.local.id ? s.local - s.visita : s.visita - s.local);
  if (completo) {
    // Remontada: el ganador fue perdiendo en algún momento
    if (pasos.some((s) => esGanador(s) < 0)) return { situacion: "REMONTADA", clave: pasos.find((s) => esGanador(s) < 0)!.gol };
    // Agónico: el gol que lo puso arriba para siempre llegó al 85' o después
    let decisivo: GolJornada | undefined;
    let antes = 0;
    for (const s of pasos) {
      const d = esGanador(s);
      if (antes <= 0 && d > 0) decisivo = s.gol;
      antes = d;
    }
    if (decisivo && decisivo.minuto! >= 85) return { situacion: "AGONICO", clave: decisivo };
  }
  if (hatTrick) return { situacion: "HAT_TRICK", clave: hatTrick[0] };
  if (liderAntesId && liderAntesId === g.perdedor.id) return { situacion: "LIDER_PIERDE" };
  if (Math.abs(p.golesLocal - p.golesVisita) >= 3) return { situacion: "GOLEADA" };
  if (chilena) return { situacion: "CHILENA", clave: chilena };
  return { situacion: "VICTORIA" };
}

const goleadoresDe = (goles: GolJornada[]) => {
  const conteo = new Map<string, { nombre: string; n: number }>();
  for (const g of goles) {
    const clave = g.autogol ? `autogol:${g.jugadorId}` : g.jugadorId;
    const nombre = g.autogol ? `autogol de ${g.jugador}` : g.jugador;
    conteo.set(clave, { nombre, n: (conteo.get(clave)?.n ?? 0) + 1 });
  }
  const nombres = [...conteo.values()].map((c) => (c.n > 1 ? `${c.nombre} (${c.n})` : c.nombre));
  return nombres.length <= 1 ? nombres.join("") : `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
};

/** La crónica: titular del banco + 2–3 líneas con lo que pasó */
export function cronicaDelPartido(p: PartidoJornada, liderAntesId?: string) {
  const { situacion, clave } = situacionDelPartido(p, liderAntesId);
  const g = ganadorDe(p);
  const en = p.cancha ? ` en la ${p.cancha}` : "";
  const cuerpo: string[] = [];
  cuerpo.push(
    g
      ? `${g.ganador.corto} le ganó ${Math.max(p.golesLocal, p.golesVisita)}–${Math.min(p.golesLocal, p.golesVisita)} a ${g.perdedor.corto}${en}.`
      : `${p.local.corto} y ${p.visita.corto} empataron ${p.golesLocal}–${p.golesVisita}${en}.`,
  );
  const lados = g ? [g.ganador, g.perdedor] : [p.local, p.visita];
  const goles = lados
    .map((e) => ({ e, texto: goleadoresDe(p.goles.filter((x) => x.equipoId === e.id)) }))
    .filter((x) => x.texto)
    .map((x) => `Por ${x.e.corto}: ${x.texto}.`);
  if (goles.length) cuerpo.push(goles.join(" "));
  const primero = recorrido(p)[0]?.gol;
  switch (situacion) {
    case "REMONTADA":
      if (g && primero) cuerpo.push(`${g.perdedor.corto} se fue arriba al ${primero.minuto}' y ${g.ganador.corto} le dio la vuelta.`);
      break;
    case "AGONICO":
      if (clave) cuerpo.push(`El ${clave.minuto}' de ${clave.jugador} llegó cuando ya se olía el empate.`);
      break;
    case "HAT_TRICK":
      if (clave) cuerpo.push(`${clave.jugador} se llevó la pelota a su casa: ${p.goles.filter((x) => x.jugadorId === clave.jugadorId).length} goles.`);
      break;
    case "GOLEADA":
      if (g) cuerpo.push(`${g.ganador.corto} no dejó dudas: ${Math.abs(p.golesLocal - p.golesVisita)} goles de diferencia.`);
      break;
    case "LIDER_PIERDE":
      if (g) cuerpo.push(`${g.perdedor.corto} llegó como líder y se fue con las manos vacías.`);
      break;
    case "CHILENA":
      if (clave) cuerpo.push(`${clave.jugador} se aventó de chilena al ${clave.minuto}'.`);
      break;
  }
  // Los golazos que no fueron la nota principal también se cuentan
  if (cuerpo.length < 3) {
    const golazo = p.goles.find((x) => x.tipoGol && GOLAZO.has(x.tipoGol) && x !== clave);
    if (golazo) cuerpo.push(`${golazo.jugador} anotó ${DE_TIPO[golazo.tipoGol!]}${golazo.minuto != null ? ` al ${golazo.minuto}'` : ""}.`);
  }
  const titular = elegirTitular(situacion, p.id, {
    GANADOR: g?.ganador.corto ?? "",
    CANCHA: p.cancha ?? "",
    MINUTO: clave?.minuto != null ? String(clave.minuto) : "",
    JUGADOR: clave?.jugador ?? "",
  });
  return { situacion, titular, cuerpo: cuerpo.slice(0, 3) };
}

export function autoPostsDeLaJornada(entrada: {
  partidos: PartidoJornada[];
  liderAntesId?: string;
  tabla: { equipo: EquipoJornada; pts: number; posicion: number | null }[];
  goleo: { nombre: string; username: string; goles: number }[];
  rachas: { jugadorId: string; nombre: string; username: string; racha: number }[];
}): AutoPost[] {
  const posts: AutoPost[] = [];
  for (const p of entrada.partidos) {
    const inicio = p.inicio?.getTime() ?? 0;
    const validado = p.validadoEn?.getTime() ?? inicio;
    // La crónica y el resultado van al final del partido; cada gol, en su minuto
    const fecha = inicio + 120 * 60_000;
    const equipos = [p.local.id, p.visita.id];
    const marcador = { local: p.local, visita: p.visita, golesLocal: p.golesLocal, golesVisita: p.golesVisita };
    const jugadores = [...new Set(p.goles.filter((g) => !g.autogol).map((g) => g.jugadorId))];
    const c = cronicaDelPartido(p, entrada.liderAntesId);
    posts.push({ tipo: "AUTO_CRONICA", id: `cronica:${p.id}`, matchId: p.id, jornada: p.jornada, fecha: fecha + 1, validado, equipos, jugadores, marcador, ...c });
    posts.push({
      tipo: "AUTO_RESULTADO",
      id: `resultado:${p.id}`,
      matchId: p.id,
      jornada: p.jornada,
      fecha,
      validado,
      equipos,
      jugadores,
      marcador,
      arbitro: p.arbitro,
      goleadores: [p.local, p.visita]
        .map((e) => ({
          equipoId: e.id,
          texto: p.goles
            .filter((g) => g.equipoId === e.id)
            .sort((a, b) => (a.minuto ?? 999) - (b.minuto ?? 999))
            .map((g) => `${g.autogol ? `Autogol de ${g.jugador}` : g.jugador}${g.minuto != null ? ` ${g.minuto}'` : ""}`)
            .join(" · "),
        }))
        .filter((x) => x.texto),
    });
    for (const [i, g] of p.goles.entries()) {
      // El autogol no es gol de nadie: sale en el resultado y en la crónica, no como post de gol
      if (g.autogol) continue;
      const tipo = g.tipoGol ? DE_TIPO[g.tipoGol] : undefined;
      posts.push({
        tipo: "AUTO_GOL",
        id: `gol:${p.id}:${i}`,
        matchId: p.id,
        jornada: p.jornada,
        fecha: inicio + (g.minuto ?? 0) * 60_000,
        validado,
        equipos: [g.equipoId],
        jugadores: [g.jugadorId],
        titular: `${g.jugador} anotó${tipo ? ` ${tipo}` : ""}${g.minuto != null ? ` al ${g.minuto}'` : ""}`,
        grande: tipo && g.tipoGol !== "PENAL" ? tipo : g.jugador,
        golazo: g.tipoGol != null && GOLAZO.has(g.tipoGol),
        minuto: g.minuto,
        autor: { nombre: g.jugador, username: g.username },
        cancha: p.cancha,
        marcador,
      });
    }
  }
  const jornada = entrada.partidos[0]?.jornada ?? 0;
  const fin = Math.max(0, ...entrada.partidos.map((p) => (p.inicio?.getTime() ?? 0) + 120 * 60_000));
  const validado = Math.max(0, ...entrada.partidos.map((p) => p.validadoEn?.getTime() ?? 0));
  if (entrada.tabla.length) {
    posts.push({
      tipo: "AUTO_TABLA",
      id: `tabla:${jornada}`,
      jornada,
      fecha: fin + 2,
      validado,
      equipos: entrada.tabla.slice(0, 3).map((t) => t.equipo.id),
      jugadores: [],
      tabla: entrada.tabla.slice(0, 3),
      goleo: entrada.goleo.slice(0, 3),
    });
  }
  // Rachas: quien anotó esta jornada y ya lleva 3 o más partidos seguidos anotando
  const anotaron = new Set(entrada.partidos.flatMap((p) => p.goles.filter((g) => !g.autogol).map((g) => g.jugadorId)));
  for (const r of entrada.rachas.filter((x) => x.racha >= 3 && anotaron.has(x.jugadorId))) {
    const suyo = entrada.partidos.find((p) => p.goles.some((g) => g.jugadorId === r.jugadorId));
    posts.push({
      tipo: "AUTO_RACHA",
      id: `racha:${jornada}:${r.jugadorId}`,
      jornada,
      fecha: fin + 1,
      validado,
      equipos: suyo ? [suyo.goles.find((g) => g.jugadorId === r.jugadorId)!.equipoId] : [],
      jugadores: [r.jugadorId],
      autor: { nombre: r.nombre, username: r.username },
      racha: r.racha,
    });
  }
  return posts;
}

const PESO: Record<AutoPost["tipo"], number> = { AUTO_CRONICA: 30, AUTO_RESULTADO: 20, AUTO_TABLA: 15, AUTO_RACHA: 12, AUTO_INSIGNIA: 10, AUTO_GOL: 5 };

/**
 * Para ti (PRD §6.1): primero lo de tu equipo, luego crónicas y resultados de la liga, la tabla, rachas y
 * los golazos. Los goles sin chiste de otros partidos se quedan en Golazos.
 */
export function paraTi(posts: AutoPost[], miEquipoId?: string): AutoPost[] {
  const mio = (p: AutoPost) => (miEquipoId ? p.equipos.includes(miEquipoId) : false);
  return posts
    .filter((p) => p.tipo !== "AUTO_GOL" || p.golazo || mio(p))
    .map((p) => ({ p, peso: (mio(p) ? 100 : 0) + PESO[p.tipo] + (p.tipo === "AUTO_GOL" && p.golazo ? 20 : 0) }))
    .sort((a, b) => b.peso - a.peso || b.p.fecha - a.p.fecha)
    .map((x) => x.p);
}

/** Golazos: solo goles, los de chiste primero */
export const golazos = (posts: AutoPost[]) =>
  posts
    .filter((p): p is Extract<AutoPost, { tipo: "AUTO_GOL" }> => p.tipo === "AUTO_GOL")
    .sort((a, b) => Number(b.golazo) - Number(a.golazo) || b.fecha - a.fecha);

/** Siguiendo: lo de los equipos y cracks que sigue, en orden cronológico (lo más nuevo arriba) */
export function siguiendo(posts: AutoPost[], sigue: { equipos: Set<string>; jugadores: Set<string> }): AutoPost[] {
  return posts
    .filter((p) => p.equipos.some((e) => sigue.equipos.has(e)) || p.jugadores.some((j) => sigue.jugadores.has(j)))
    .sort((a, b) => b.fecha - a.fecha);
}
