/**
 * Goleo del torneo (pantallas 03 y Mi liga). Servicio puro: sin base de datos ni Next.
 * Solo cuentan partidos VALIDADOS (regla 2): las filas salen de `player_tournament_stats`, que solo
 * se alimenta de cédulas validadas.
 */

export type FilaGoleo = { userId: string; goles: number };

/**
 * Posición de cada quien en el goleo, con empates compartidos (19, 16, 16, 13 → 1, 2, 2, 4).
 * Sin goles no hay posición: "#1 del goleo" solo con datos reales (regla 9).
 */
export function posicionesDelGoleo(filas: FilaGoleo[]): Map<string, number> {
  const orden = [...filas].filter((f) => f.goles > 0).sort((a, b) => b.goles - a.goles);
  const posiciones = new Map<string, number>();
  orden.forEach((f, i) => {
    const anterior = orden[i - 1];
    posiciones.set(f.userId, anterior && anterior.goles === f.goles ? posiciones.get(anterior.userId)! : i + 1);
  });
  return posiciones;
}

/** Chips de la pantalla 03: "🔥 4 PARTIDOS ANOTANDO" y "#1 GOLEO · 19" */
export function chipsDelJugador(stats: { goles: number; rachaGoles: number }, posicion?: number): string[] {
  const chips: string[] = [];
  if (stats.rachaGoles >= 2) chips.push(`🔥 ${stats.rachaGoles} partidos anotando`);
  if (posicion && stats.goles > 0) chips.push(`#${posicion} goleo · ${stats.goles}`);
  return chips;
}

const DE_TIPO: Record<string, string> = {
  CHILENA: "de chilena",
  PANENKA: "a lo Panenka",
  CABEZA: "de cabeza",
  PENAL: "de penal",
  TIRO_LIBRE: "de tiro libre",
  FUERA_DEL_AREA: "de fuera del área",
  OLIMPICO: "olímpico",
};

/** "87' El Brujo, de chilena." (pantalla 05). Solo con lo que trae la cédula. */
export function lineaDeGol(gol: { minuto: number | null; nombre: string; tipoGol: string | null }): string {
  const minuto = gol.minuto != null ? `${gol.minuto}' ` : "";
  const tipo = gol.tipoGol ? DE_TIPO[gol.tipoGol] : undefined;
  return `${minuto}${gol.nombre}${tipo ? `, ${tipo}` : ""}.`;
}
