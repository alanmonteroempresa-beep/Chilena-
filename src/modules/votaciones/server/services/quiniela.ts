/**
 * Quiniela (PRD §6.8 · pantalla 13). Servicio puro: sin base de datos ni Next.
 * Sin dinero, puro orgullo: 3 puntos si atinas al marcador, 1 si atinas a quién gana (o al empate).
 * Cierra 1 minuto antes del partido. Solo califica un partido VALIDADO (regla 2).
 */

export const PUNTOS_MARCADOR = 3;
export const PUNTOS_GANADOR = 1;
/** Cierra 1 minuto antes de la hora del partido (PERMISOS §2) */
export const CIERRE_ANTES_MS = 60_000;

export type Marcador = { local: number; visita: number };

const signo = (m: Marcador) => Math.sign(m.local - m.visita);

/** 3 por el marcador exacto, 1 por el ganador o el empate, 0 si no */
export function puntosDelPronostico(pronostico: Marcador, oficial: Marcador): number {
  if (pronostico.local === oficial.local && pronostico.visita === oficial.visita) return PUNTOS_MARCADOR;
  return signo(pronostico) === signo(oficial) ? PUNTOS_GANADOR : 0;
}

/** ¿Ya cerró? Un minuto antes de la hora del partido, o si el partido ya empezó o terminó */
export function quinielaCerrada(partido: { scheduledAt: Date | null; status: string }, ahora: Date): boolean {
  if (partido.status !== "PROGRAMADO") return true;
  if (!partido.scheduledAt) return false;
  return ahora.getTime() >= partido.scheduledAt.getTime() - CIERRE_ANTES_MS;
}

/** A qué hora cierra (para "Cierra el domingo a las 10:59") */
export const cierreDeLaQuiniela = (scheduledAt: Date) => new Date(scheduledAt.getTime() - CIERRE_ANTES_MS);

/** Porcentajes que suman 100 (el residuo va a los de mayor decimal) */
export function porcentajes(conteos: number[]): number[] {
  const total = conteos.reduce((s, n) => s + n, 0);
  if (!total) return conteos.map(() => 0);
  const exactos = conteos.map((n) => (n * 100) / total);
  const base = exactos.map(Math.floor);
  let resto = 100 - base.reduce((s, n) => s + n, 0);
  const orden = exactos.map((x, i) => ({ i, dec: x - Math.floor(x) })).sort((a, b) => b.dec - a.dec || a.i - b.i);
  for (const { i } of orden) {
    if (resto <= 0) break;
    base[i]++;
    resto--;
  }
  return base;
}

/** "Lo que dice la porra": qué tanto le van al local, al empate y a la visita */
export function loQueDiceLaPorra(pronosticos: Marcador[]) {
  const conteo = [0, 0, 0];
  for (const p of pronosticos) conteo[p.local > p.visita ? 0 : p.local === p.visita ? 1 : 2]++;
  const [local, empate, visita] = porcentajes(conteo);
  return { total: pronosticos.length, local, empate, visita };
}

export type FilaQuiniela = { userId: string; puntos: number; exactos: number };

/**
 * "Los que más le atinan": por puntos, luego por marcadores exactos. Los empatados comparten lugar
 * (1, 2, 2, 4).
 */
export function rankingDeQuiniela(filas: FilaQuiniela[]): (FilaQuiniela & { posicion: number })[] {
  const orden = [...filas].sort((a, b) => b.puntos - a.puntos || b.exactos - a.exactos || a.userId.localeCompare(b.userId));
  return orden.map((f, i) => {
    let posicion = i + 1;
    for (let j = i - 1; j >= 0 && orden[j].puntos === f.puntos && orden[j].exactos === f.exactos; j--) posicion = j + 1;
    return { ...f, posicion };
  });
}

/** Los atajos de la pantalla (1-0, 2-1, 1-1, 0-1) */
export const ATAJOS: Marcador[] = [
  { local: 1, visita: 0 },
  { local: 2, visita: 1 },
  { local: 1, visita: 1 },
  { local: 0, visita: 1 },
];

/** Límites de los botones +/– */
export const GOLES_MAXIMOS = 20;
