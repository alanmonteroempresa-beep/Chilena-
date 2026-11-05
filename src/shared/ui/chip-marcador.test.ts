import { describe, expect, it } from "vitest";
import { textoEstadoMarcador } from "./chip-marcador";

describe("textoEstadoMarcador (docs/DISENO.md §4, pantalla 32)", () => {
  it("EN VIVO con minuto", () => {
    expect(textoEstadoMarcador({ tipo: "en-vivo", minuto: 88 })).toBe("EN VIVO · 88'");
    expect(textoEstadoMarcador({ tipo: "en-vivo" })).toBe("EN VIVO");
  });

  it("regla 1: lo de la banda siempre dice NO OFICIAL", () => {
    expect(textoEstadoMarcador({ tipo: "no-oficial" })).toBe("NO OFICIAL · DESDE LA BANDA");
  });

  it("OFICIAL sale de la cédula", () => {
    expect(textoEstadoMarcador({ tipo: "oficial" })).toBe("OFICIAL · CÉDULA");
    expect(textoEstadoMarcador({ tipo: "oficial", arbitro: "J. Mendoza" })).toBe(
      "OFICIAL · CÉDULA DE J. MENDOZA",
    );
  });

  it("FINAL", () => {
    expect(textoEstadoMarcador({ tipo: "final" })).toBe("FINAL");
  });
});
