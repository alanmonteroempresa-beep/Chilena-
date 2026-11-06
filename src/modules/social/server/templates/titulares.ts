/**
 * Bancos de titulares por situación (docs/CARTA_E_INSIGNIAS.md §5, beta sin IA).
 * Solo datos reales; la picardía es sobre el juego, nunca sobre una persona (regla 9).
 */
export type Situacion =
  | "REMONTADA"
  | "AGONICO"
  | "HAT_TRICK"
  | "LIDER_PIERDE"
  | "GOLEADA"
  | "CHILENA"
  | "EMPATE"
  | "VICTORIA";

export const TITULARES: Record<Situacion, string[]> = {
  GOLEADA: ["¡{GANADOR} NO TUVO PIEDAD!", "¡BAILE EN {CANCHA}!"],
  AGONICO: ["¡SUFRIÓ, PERO CUMPLIÓ!", "¡AL {MINUTO}', CUANDO NADIE CREÍA!"],
  REMONTADA: ["¡LA VOLTEARON!", "¡DE MENOS A MÁS!"],
  EMPATE: ["¡NADIE SE QUISO IR CON LAS MANOS VACÍAS!"],
  CHILENA: ["¡{JUGADOR} SE AVENTÓ DE CHILENA!"],
  LIDER_PIERDE: ["¡LOS BAJARON DE LA NUBE!"],
  HAT_TRICK: ["¡LA PELOTA SE LA LLEVA {JUGADOR}!"],
  // Victoria sin nada especial (propuesta en CARTA §5)
  VICTORIA: ["¡{GANADOR} SE LLEVÓ LOS TRES PUNTOS!", "¡TRES PUNTOS PARA {GANADOR}!"],
};

/** Cuál titular del banco: estable por partido (sin guardar todavía el "no repetir en 4 semanas") */
export function elegirTitular(situacion: Situacion, semilla: string, datos: Record<string, string>): string {
  const banco = TITULARES[situacion];
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const plantilla = banco[h % banco.length];
  // Los datos van en mayúsculas (titular de momento); si falta un dato, no se usa esa plantilla
  const lleno = plantilla.replace(/\{(\w+)\}/g, (_, k: string) => (datos[k] ?? `{${k}}`).toUpperCase());
  return lleno.includes("{") ? banco.find((b) => !/\{\w+\}/.test(b)) ?? lleno : lleno;
}
