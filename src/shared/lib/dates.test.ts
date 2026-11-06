import { describe, expect, it } from "vitest";
import { hoyCDMX, mesCDMX, textoVencimiento } from "./dates";

// Viernes 6 de noviembre de 2026 a las 20:00 en CDMX = sábado 7 a las 02:00 UTC
const AHORA = new Date("2026-11-07T02:00:00Z");
const dia = (d: number, mes = 10) => new Date(Date.UTC(2026, mes, d));

describe("fechas en CDMX", () => {
  it("hoy es el día de CDMX, no el de UTC", () => {
    expect(hoyCDMX(AHORA)).toBe("2026-11-06");
  });

  it("vencimientos de cuotas y cargos", () => {
    expect(textoVencimiento(dia(6), AHORA)).toBe("vence hoy");
    expect(textoVencimiento(dia(7), AHORA)).toBe("vence mañana, sáb 7");
    expect(textoVencimiento(dia(14), AHORA)).toBe("vence el sáb 14");
    expect(textoVencimiento(dia(5), AHORA)).toBe("venció ayer, jue 5");
    expect(textoVencimiento(dia(3), AHORA)).toBe("venció el mar 3");
  });

  it("el mes en curso como rango", () => {
    expect(mesCDMX(AHORA)).toEqual({ desde: dia(1), hasta: dia(1, 11), nombre: "noviembre" });
    // 31 de diciembre a las 20:00 en CDMX ya es enero en UTC: sigue siendo diciembre
    expect(mesCDMX(new Date("2027-01-01T02:00:00Z")).nombre).toBe("diciembre");
  });
});
