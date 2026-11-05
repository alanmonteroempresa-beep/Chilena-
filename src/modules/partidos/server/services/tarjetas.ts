/**
 * Tarjetas de la cédula, ya resumidas por jugador y partido (PRD §7.8 y §7.13).
 * Servicio puro: sin base de datos ni Next.
 *
 * Doble amarilla: la cédula trae sus dos amarillas y la expulsión (ROJA), pero cuenta como UNA
 * sola expulsión: 1 partido, 3 puntos de juego limpio, no suma al acumulado y en la carta (DIS y
 * estadísticas) es 1 roja y 0 amarillas. Basta con ver dos amarillas para tratarla así.
 * Amarilla y luego roja directa: la amarilla sí cuenta (4 puntos de juego limpio).
 */

export type TarjetaCedula = {
  jugadorId: string;
  equipoId: string;
  tipo: "AMARILLA" | "ROJA";
  minuto?: number | null;
};

export type TarjetasDelJugador = {
  jugadorId: string;
  equipoId: string;
  /** Amarillas que suman al acumulado en este partido (la doble amarilla no suma) */
  amarillasQueSuman: number;
  expulsado: boolean;
  dobleAmarilla: boolean;
  /** Minuto de la expulsión, si la cédula lo trae */
  minutoExpulsion: number | null;
};

/** Juego limpio (PRD §7.13): amarilla 1, roja 3 */
export const PUNTOS_JUEGO_LIMPIO = { amarilla: 1, roja: 3 } as const;

/** Resume las tarjetas de UN partido por jugador */
export function tarjetasPorJugador(tarjetas: TarjetaCedula[]): TarjetasDelJugador[] {
  const porJugador = new Map<string, TarjetaCedula[]>();
  for (const t of tarjetas) porJugador.set(t.jugadorId, [...(porJugador.get(t.jugadorId) ?? []), t]);

  return [...porJugador.values()].map((suyas) => {
    const amarillas = suyas.filter((t) => t.tipo === "AMARILLA");
    const roja = suyas.find((t) => t.tipo === "ROJA");
    const dobleAmarilla = amarillas.length >= 2;
    const expulsado = dobleAmarilla || roja != null;
    return {
      jugadorId: suyas[0].jugadorId,
      equipoId: suyas[0].equipoId,
      amarillasQueSuman: dobleAmarilla ? 0 : amarillas.length,
      expulsado,
      dobleAmarilla,
      minutoExpulsion: roja?.minuto ?? (dobleAmarilla ? (amarillas[1].minuto ?? null) : null),
    };
  });
}

/** Puntos de juego limpio de cada equipo en UN partido (menos es mejor) */
export function puntosJuegoLimpio(tarjetas: TarjetaCedula[]): Map<string, number> {
  const puntos = new Map<string, number>();
  for (const t of tarjetasPorJugador(tarjetas)) {
    const suyos =
      t.amarillasQueSuman * PUNTOS_JUEGO_LIMPIO.amarilla + (t.expulsado ? PUNTOS_JUEGO_LIMPIO.roja : 0);
    puntos.set(t.equipoId, (puntos.get(t.equipoId) ?? 0) + suyos);
  }
  return puntos;
}

/**
 * Tarjetas que cuentan para la estadística del jugador y para DIS (docs/CARTA_E_INSIGNIAS.md §1.2).
 * Recibe las tarjetas de cada partido por separado: la doble amarilla es 1 roja y 0 amarillas.
 */
export function conteoDeTarjetas(
  porPartido: TarjetaCedula[][],
): Map<string, { amarillas: number; rojas: number }> {
  const conteo = new Map<string, { amarillas: number; rojas: number }>();
  for (const tarjetas of porPartido) {
    for (const t of tarjetasPorJugador(tarjetas)) {
      const c = conteo.get(t.jugadorId) ?? { amarillas: 0, rojas: 0 };
      c.amarillas += t.amarillasQueSuman;
      c.rojas += t.expulsado ? 1 : 0;
      conteo.set(t.jugadorId, c);
    }
  }
  return conteo;
}
