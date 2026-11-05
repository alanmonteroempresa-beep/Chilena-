import { describe, expect, it } from "vitest";
import { chipsDelMarcador, textoEstadoMarcador } from "./chip-marcador";

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

describe("chipsDelMarcador (regla 1: marcador oficial = cédula validada)", () => {
  const tipos = (f: Parameters<typeof chipsDelMarcador>[0]) => chipsDelMarcador(f).map((c) => c.tipo);

  it("lo de la banda siempre dice NO OFICIAL, en vivo o no", () => {
    expect(tipos({ tipo: "banda", enVivo: true, minuto: 34 })).toEqual(["en-vivo", "no-oficial"]);
    expect(tipos({ tipo: "banda", enVivo: false })).toEqual(["no-oficial"]);
  });

  it("solo la cédula lleva FINAL y OFICIAL", () => {
    expect(tipos({ tipo: "cedula", arbitro: "J. Mendoza" })).toEqual(["final", "oficial"]);
    for (const enVivo of [true, false]) {
      expect(tipos({ tipo: "banda", enVivo })).not.toContain("oficial");
      expect(tipos({ tipo: "banda", enVivo })).not.toContain("final");
    }
  });
});
