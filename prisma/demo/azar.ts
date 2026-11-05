import { createHash } from "node:crypto";

/** Generador pseudoaleatorio con semilla (mulberry32): la liga demo sale idéntica cada vez. */
export class Azar {
  private estado: number;

  constructor(semilla: number) {
    this.estado = semilla >>> 0;
  }

  siguiente(): number {
    this.estado = (this.estado + 0x6d2b79f5) | 0;
    let t = Math.imul(this.estado ^ (this.estado >>> 15), 1 | this.estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero entre min y max, incluidos */
  entero(min: number, max: number): number {
    return min + Math.floor(this.siguiente() * (max - min + 1));
  }

  probabilidad(p: number): boolean {
    return this.siguiente() < p;
  }

  elegir<T>(lista: readonly T[]): T {
    if (lista.length === 0) throw new Error("elegir() con lista vacía");
    return lista[Math.floor(this.siguiente() * lista.length)];
  }

  /** Elige con pesos: [[valor, peso], ...] */
  ponderado<T>(opciones: readonly (readonly [T, number])[]): T {
    const total = opciones.reduce((s, [, p]) => s + p, 0);
    let r = this.siguiente() * total;
    for (const [valor, peso] of opciones) {
      r -= peso;
      if (r < 0) return valor;
    }
    return opciones[opciones.length - 1][0];
  }

  barajar<T>(lista: readonly T[]): T[] {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(this.siguiente() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }
}

/**
 * UUID estable a partir de una clave ("partido", "J15:DP-RC"): al volver a sembrar,
 * las URLs de la demo (/partido/…, /j/…) no cambian. Formato v5 (SHA-1).
 */
export function idDemo(tipo: string, clave: string): string {
  const h = createHash("sha1").update(`chilena-demo:${tipo}:${clave}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/** "El Chícharo" → "el-chicharo" */
export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
