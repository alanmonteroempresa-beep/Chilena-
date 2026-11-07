import { describe, expect, it } from "vitest";
import { can, registerRule } from "@/modules/core";
import { reglaReportarFalla } from "../server/reglas";
import { reporteFallaSchema } from "../schemas";
import { descripcionDelReporte } from "../server/services/fallas";

// Pantalla 42 · Reportar falla
describe("reportar falla", () => {
  it("guarda qué pasó al principio del texto", () => {
    expect(descripcionDelReporte("DATO_MAL", "  En la tabla Portales sale con 32 ")).toBe("Un dato está mal · En la tabla Portales sale con 32");
  });
  it("pide algo de texto y solo pantallas de Chilena", () => {
    const base = { tipo: "NO_CARGA", texto: "No abre la quiniela", pantalla: "/mi-liga/quiniela", dispositivo: null };
    expect(reporteFallaSchema.safeParse(base).success).toBe(true);
    expect(reporteFallaSchema.safeParse({ ...base, texto: "x" }).success).toBe(false);
    expect(reporteFallaSchema.safeParse({ ...base, pantalla: "https://otro.com" }).success).toBe(false);
    expect(reporteFallaSchema.safeParse({ ...base, pantalla: null }).success).toBe(true);
  });
});

describe("quién puede reportar (PERMISOS)", () => {
  it("una cuenta reclamada sí; sin reclamar o sin sesión, no", async () => {
    registerRule("bug.report", reglaReportarFalla(async (u) => u === "lupe"));
    expect(await can("lupe", "bug.report")).toBe(true);
    expect(await can("sin-reclamar", "bug.report")).toBe(false);
    expect(await can(null, "bug.report")).toBe(false);
  });
});
