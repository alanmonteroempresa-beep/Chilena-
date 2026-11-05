/**
 * "Domingos sin faltar" (PRD §7.6 · insignias DOMINGOS_5/12/25 · PlayerTournamentStat.rachaAsistencia).
 * Servicio puro: sin base de datos ni Next.
 * - Cuenta ir: aparecer en la alineación de la cédula validada, de titular o en la banca.
 * - Corta: un partido validado de su equipo sin él en la alineación.
 * - Pausa: domingos sin partido de su equipo (descanso, "No hay juego", suspendido, reprogramado),
 *   partidos sin validar y partidos en que cumple una suspensión.
 */

export type DomingoDelEquipo = {
  /** Orden cronológico */
  orden: number;
  /** Estado del partido de su equipo ese domingo; "DESCANSO" si no le tocó */
  status: string;
  /** Está en la alineación de la cédula (titular o banca) */
  enAlineacion: boolean;
  /** Cumplía una suspensión en ese partido */
  suspendido: boolean;
};

export type ResultadoDomingo = "SUMA" | "PAUSA" | "CORTA";

export function resultadoDelDomingo(d: DomingoDelEquipo): ResultadoDomingo {
  if (d.status !== "VALIDADO") return "PAUSA";
  if (d.enAlineacion) return "SUMA";
  return d.suspendido ? "PAUSA" : "CORTA";
}

/** Racha actual: domingos seguidos sin faltar, contando hacia atrás desde el más reciente */
export function rachaAsistencia(domingos: DomingoDelEquipo[]): number {
  let racha = 0;
  for (const d of [...domingos].sort((a, b) => b.orden - a.orden)) {
    const r = resultadoDelDomingo(d);
    if (r === "CORTA") break;
    if (r === "SUMA") racha++;
  }
  return racha;
}
