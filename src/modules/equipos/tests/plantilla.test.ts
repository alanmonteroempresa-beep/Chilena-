import { describe, expect, it } from "vitest";
import {
  estadoEnPlantilla,
  necesitaAtencion,
  ordenarPlantilla,
  respuestaDe,
  resumenCuotas,
  resumenPaseDeLista,
  type EstadoEnPlantilla,
  type Respuesta,
} from "../server/services/plantilla";

// Pantalla 04 · PRD §7.6 y §7.11
describe("plantilla del delegado", () => {
  it("suspendido manda sobre la cuota; 'Ya pagué' sin confirmar queda en revisión", () => {
    expect(estadoEnPlantilla({ suspendido: true, pagoCuota: "PENDIENTE" })).toBe("SUSPENDIDO");
    expect(estadoEnPlantilla({ suspendido: false, pagoCuota: "PENDIENTE" })).toBe("CUOTA_PENDIENTE");
    expect(estadoEnPlantilla({ suspendido: false, pagoCuota: "REPORTADO" })).toBe("EN_REVISION");
    expect(estadoEnPlantilla({ suspendido: false, pagoCuota: "CONFIRMADO" })).toBe("HABILITADO");
    expect(estadoEnPlantilla({ suspendido: false, pagoCuota: "CONDONADO" })).toBe("HABILITADO");
    expect(estadoEnPlantilla({ suspendido: false })).toBe("HABILITADO");
  });

  it("convocado sin contestar es 'sin respuesta'", () => {
    expect(respuestaDe("CONVOCADO")).toBe("SIN_RESPUESTA");
    expect(respuestaDe(undefined)).toBe("SIN_RESPUESTA");
    expect(respuestaDe("PRESENTE")).toBe("VA");
    expect(respuestaDe("AUSENTE")).toBe("NO_VA");
  });

  it("primero los que necesitan atención", () => {
    const j = (nombre: string, numero: number, estado: EstadoEnPlantilla, respuesta: Respuesta) => ({
      nombre,
      numero,
      estado,
      respuesta,
    });
    const orden = ordenarPlantilla([
      j("El Gato", 1, "HABILITADO", "VA"),
      j("Lalo", 12, "HABILITADO", "SIN_RESPUESTA"),
      j("Kike", 14, "CUOTA_PENDIENTE", "SIN_RESPUESTA"),
      j("Rambo", 15, "HABILITADO", "NO_VA"),
      j("La Roca", 4, "SUSPENDIDO", "SIN_RESPUESTA"),
      j("La Pulga", 7, "CUOTA_PENDIENTE", "SIN_RESPUESTA"),
    ]).map((x) => x.nombre);
    expect(orden).toEqual(["La Roca", "La Pulga", "Kike", "Rambo", "Lalo", "El Gato"]);
    expect(necesitaAtencion({ estado: "HABILITADO", respuesta: "VA" })).toBe(false);
    expect(necesitaAtencion({ estado: "HABILITADO", respuesta: "NO_VA" })).toBe(true);
  });

  it("el pase de lista cuenta al suspendido en el total (11 de 16)", () => {
    const r: Respuesta[] = [...Array(11).fill("VA"), "NO_VA", "LESIONADO", "SIN_RESPUESTA", "SIN_RESPUESTA", "SIN_RESPUESTA"];
    expect(resumenPaseDeLista(r)).toEqual({ total: 16, van: 11, noVan: 2, sinContestar: 3 });
  });

  it("cuotas: lo que deben en centavos", () => {
    expect(resumenCuotas(["CONFIRMADO", "CONFIRMADO", "CONDONADO", "REPORTADO", "PENDIENTE", "PENDIENTE"], 65_000)).toEqual({
      total: 6,
      alCorriente: 3,
      enRevision: 1,
      deben: 2,
      adeudoCents: 130_000,
    });
  });
});
