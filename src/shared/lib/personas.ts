// Cómo se nombra a la gente y a los equipos en pantalla (pantallas 03, 04, 05 y 18).

/** El apodo manda: "El Chícharo"; sin apodo, el nombre */
export const nombreVisible = (p: { sobrenombre?: string | null; nombre: string }) => p.sobrenombre?.trim() || p.nombre;

const ARTICULOS = new Set(["el", "la", "los", "las"]);

/**
 * Iniciales como en el diseño (pantalla 05): sin el artículo del apodo y, si queda una palabra, sus dos
 * primeras letras. "El Brujo" → "BR" · "El Chícharo" → "CH" · "Memo" → "ME" · "Doña Lupe" → "DL"
 */
export function inicialesDe(texto: string): string {
  let palabras = texto.split(/\s+/).filter((p) => /\p{L}/u.test(p));
  if (palabras.length > 1 && ARTICULOS.has(palabras[0].toLowerCase())) palabras = palabras.slice(1);
  const letras =
    palabras.length === 1
      ? (palabras[0].match(/\p{L}/gu) ?? []).slice(0, 2)
      : palabras.slice(0, 2).map((p) => p.match(/\p{L}/u)![0]);
  return (letras.join("") || "CH").toUpperCase();
}

const PREFIJOS = new Set(["dep.", "deportivo", "real", "juventud", "atlético", "atletico", "unión", "union", "sporting", "club", "cf", "atl."]);

/** Nombre corto del equipo para titulares y marcadores: "Dep. Portales" → "Portales", "Tigres del Llano" → "Tigres" */
export function nombreCorto(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);
  const sinPrefijo = palabras.filter((p, i) => !(i === 0 && PREFIJOS.has(p.toLowerCase())));
  return sinPrefijo[0] ?? palabras[0] ?? nombre;
}

/** Árbitros como en el rol de juegos: "J. Mendoza" (pantallas 02, 18 y 45). Con apodo, el apodo. */
export function nombreDeArbitro(p: { sobrenombre?: string | null; nombre: string; apellidos?: string | null }): string {
  if (p.sobrenombre?.trim()) return p.sobrenombre.trim();
  const apellido = p.apellidos?.trim().split(/\s+/)[0];
  return apellido ? `${p.nombre.trim().charAt(0)}. ${apellido}` : p.nombre;
}
