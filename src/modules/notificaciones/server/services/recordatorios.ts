/** "Te toca jugar" (RECORDATORIO_PARTIDO, docs/NOTIFICACIONES.md §2). Puro. */

/** Sale 1 h antes del partido */
export const ANTES_DEL_PARTIDO_MS = 60 * 60_000;

/** Una clave por persona, partido y hora: si reprograman el partido, sale otro recordatorio */
export const claveDeRecordatorio = (matchId: string, inicio: Date, userId: string) => `recordatorio:${matchId}:${inicio.toISOString()}:${userId}`;
export const prefijoDeRecordatorio = (matchId: string) => `recordatorio:${matchId}:`;

/**
 * A quién: los que dijeron "Voy" y el árbitro si ACEPTÓ el partido (regla 9: solo datos reales). Si el
 * árbitro también dijo "Voy", va como árbitro una sola vez.
 */
export function quienesRecordar({ confirmados, arbitro }: { confirmados: string[]; arbitro: { id: string; aceptado: boolean } | null }) {
  const pita = arbitro?.aceptado ? arbitro.id : null;
  return { jugadores: [...new Set(confirmados)].filter((u) => u !== pita), arbitro: pita };
}

/** ¿Este partido ya está dentro de la hora antes? */
export const tocaRecordar = (inicio: Date, ahora: Date) => inicio.getTime() > ahora.getTime() && inicio.getTime() - ahora.getTime() <= ANTES_DEL_PARTIDO_MS;
