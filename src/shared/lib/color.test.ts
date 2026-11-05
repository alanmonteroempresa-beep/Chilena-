import { describe, expect, it } from "vitest";
import { BLANCO, TINTA, luminancia, textoSobre } from "./color";

describe("textoSobre (siglas en el escudo)", () => {
  it("blanco sobre colores oscuros de equipo", () => {
    expect(textoSobre("#0250B0")).toBe(BLANCO); // Elite Blue
    expect(textoSobre("#6B2FD6")).toBe(BLANCO); // morado
    expect(textoSobre("#8A1C2B")).toBe(BLANCO); // vino
  });

  it("tinta sobre colores claros", () => {
    expect(textoSobre("#D0FF41")).toBe(TINTA); // Volt Lime
    expect(textoSobre("#FFFFFF")).toBe(TINTA);
    expect(textoSobre("#F28C1B")).toBe(TINTA); // naranja de Tigres
  });

  it("acepta hex de 3 dígitos", () => {
    expect(luminancia("#fff")).toBeCloseTo(1);
    expect(luminancia("#000")).toBeCloseTo(0);
  });

  it("rechaza colores inválidos", () => {
    expect(() => luminancia("azul")).toThrow();
  });
});
