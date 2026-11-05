/**
 * Color de texto legible sobre el color de un equipo (escudos con siglas).
 * Usa la luminancia relativa de WCAG: sobre colores claros va tinta (#07090C), sobre oscuros blanco.
 */
export const TINTA = "#07090C";
export const BLANCO = "#FFFFFF";

function canal(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  const limpio = hex.replace("#", "");
  const completo =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;
  if (!/^[0-9a-fA-F]{6}$/.test(completo)) throw new Error(`Color inválido: ${hex}`);
  const r = parseInt(completo.slice(0, 2), 16);
  const g = parseInt(completo.slice(2, 4), 16);
  const b = parseInt(completo.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: number, b: number) {
  const [claro, oscuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (oscuro + 0.05);
}

export function textoSobre(fondo: string): typeof TINTA | typeof BLANCO {
  const l = luminancia(fondo);
  return contraste(l, luminancia(TINTA)) >= contraste(l, luminancia(BLANCO)) ? TINTA : BLANCO;
}
