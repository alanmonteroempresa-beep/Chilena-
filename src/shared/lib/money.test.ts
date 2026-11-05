import { describe, expect, it } from "vitest";
import { formatMXN, pesosToCents } from "./money";

describe("dinero en centavos (regla 7)", () => {
  it("formatea centavos como pesos", () => {
    expect(formatMXN(65_000)).toBe("$650");
  });
  it("rechaza montos que no son centavos enteros", () => {
    expect(() => formatMXN(650.5)).toThrow();
  });
  it("convierte pesos a centavos", () => {
    expect(pesosToCents(650)).toBe(65_000);
  });
});
