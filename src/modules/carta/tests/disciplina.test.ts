import { describe, expect, it } from "vitest";
import { disciplina } from "@/modules/carta";
import { conteoDeTarjetas, type TarjetaCedula } from "@/modules/partidos";

// docs/CARTA_E_INSIGNIAS.md §1.2 · PRD §7.8
const t = (tipo: TarjetaCedula["tipo"], jugadorId = "guero"): TarjetaCedula => ({
  jugadorId,
  equipoId: "RC",
  tipo,
});

describe("DIS (disciplina)", () => {
  it("95 − 4 × amarillas − 12 × rojas, mínimo 40", () => {
    expect(disciplina({ amarillas: 0, rojas: 0 })).toBe(95);
    expect(disciplina({ amarillas: 4, rojas: 0 })).toBe(79);
    expect(disciplina({ amarillas: 1, rojas: 1 })).toBe(79);
    expect(disciplina({ amarillas: 10, rojas: 3 })).toBe(40);
  });

  it("la doble amarilla resta como 1 roja, no como roja + 2 amarillas", () => {
    const conteo = conteoDeTarjetas([[t("AMARILLA"), t("AMARILLA"), t("ROJA")]]);
    expect(conteo.get("guero")).toEqual({ amarillas: 0, rojas: 1 });
    expect(disciplina(conteo.get("guero")!)).toBe(95 - 12);
  });

  it("amarilla y luego roja directa: cuentan las dos", () => {
    const conteo = conteoDeTarjetas([[t("AMARILLA"), t("ROJA")]]);
    expect(conteo.get("guero")).toEqual({ amarillas: 1, rojas: 1 });
    expect(disciplina(conteo.get("guero")!)).toBe(95 - 4 - 12);
  });

  it("se cuenta partido por partido: dos amarillas en partidos distintos no son doble amarilla", () => {
    expect(conteoDeTarjetas([[t("AMARILLA")], [t("AMARILLA")]]).get("guero")).toEqual({
      amarillas: 2,
      rojas: 0,
    });
  });
});
