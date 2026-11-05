/**
 * Fórmula de la carta (docs/CARTA_E_INSIGNIAS.md §1). Funciones puras con tests de cada tramo.
 * Las constantes viven aquí y se ajustan con datos reales de la beta.
 * Por ahora: DIS. Los demás atributos llegan con la fase de la carta.
 */

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
