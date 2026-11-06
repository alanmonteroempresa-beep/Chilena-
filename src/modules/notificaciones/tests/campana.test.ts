import { describe, expect, it } from "vitest";
import { accionDe, haceCuanto, pestanaDe, quienes, seccionDe } from "../server/services/campana";

// Pantalla 09 · docs/NOTIFICACIONES.md
const AHORA = new Date("2026-11-08T18:00:00Z"); // domingo 8, 12:00 en CDMX

describe("campana", () => {
  it("pestañas: partidos, liga y social", () => {
    expect(pestanaDe("CEDULA_POR_FIRMAR")).toBe("partidos");
    expect(pestanaDe("PASE_DE_LISTA")).toBe("partidos");
    expect(pestanaDe("CUOTA")).toBe("liga");
    expect(pestanaDe("SANCION")).toBe("liga");
    expect(pestanaDe("REACCION")).toBe("social");
    expect(pestanaDe("INSIGNIA")).toBe("social");
  });

  it("hace cuánto, en CDMX", () => {
    expect(haceCuanto(new Date(AHORA.getTime() - 30_000), AHORA)).toBe("ahorita");
    expect(haceCuanto(new Date(AHORA.getTime() - 2 * 60_000), AHORA)).toBe("hace 2 min");
    expect(haceCuanto(new Date(AHORA.getTime() - 3 * 3_600_000), AHORA)).toBe("hace 3 h");
    expect(haceCuanto(new Date("2026-11-01T18:00:00Z"), AHORA)).toBe("dom 1");
  });

  it("secciones por día de CDMX", () => {
    expect(seccionDe(new Date("2026-11-08T07:00:00Z"), AHORA)).toBe("Hoy");
    // Sábado 7 a las 23:30 en CDMX (ya domingo en UTC) es de ayer
    expect(seccionDe(new Date("2026-11-08T05:30:00Z"), AHORA)).toBe("Esta semana");
    expect(seccionDe(new Date("2026-10-30T18:00:00Z"), AHORA)).toBe("Antes");
  });

  it("agrupa nombres y da la acción del aviso", () => {
    expect(quienes(["Doña Lupe"])).toBe("Doña Lupe");
    expect(quienes(["Doña Lupe", "El Brujo", "Doña Lupe"])).toBe("Doña Lupe y El Brujo");
    expect(quienes(["A", "B", "C", "D"])).toBe("A y 3 más");
    expect(accionDe("CEDULA_POR_FIRMAR")).toBe("Firmar");
    expect(accionDe("COMENTARIO")).toBe("Responder");
    expect(accionDe("PARTIDO_EN_VIVO")).toBeNull();
  });
});
