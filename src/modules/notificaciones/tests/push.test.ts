import { describe, expect, it } from "vitest";
import { debeMandarPush, enHorarioSilencioso, hrefSeguro } from "../server/services/push";

// docs/NOTIFICACIONES.md §1 y §2 · CDMX = UTC−6
const cdmx = (hora: string) => new Date(`2026-11-08T${hora}:00-06:00`);

describe("push: pocas y útiles", () => {
  it("Te toca jugar, Ya es oficial y Vota el MVP sí llegan al celular", () => {
    for (const t of ["RECORDATORIO_PARTIDO", "RESULTADO_OFICIAL", "VOTACION_ABIERTA"]) expect(debeMandarPush(t, cdmx("12:00"))).toBe(true);
  });
  it("lo social, las insignias y la carta solo van a la campana", () => {
    for (const t of ["REACCION", "COMENTARIO", "NUEVO_SEGUIDOR", "INSIGNIA", "CARTA_ACTUALIZADA", "SANCION"])
      expect(debeMandarPush(t, cdmx("12:00"))).toBe(false);
  });
});

describe("horario silencioso 23:00–07:00", () => {
  it("de noche no hay push, salvo el recordatorio del partido", () => {
    expect(enHorarioSilencioso(cdmx("22:59"))).toBe(false);
    expect(enHorarioSilencioso(cdmx("23:00"))).toBe(true);
    expect(enHorarioSilencioso(cdmx("06:59"))).toBe(true);
    expect(enHorarioSilencioso(cdmx("07:00"))).toBe(false);
    expect(debeMandarPush("RESULTADO_OFICIAL", cdmx("23:30"))).toBe(false);
    expect(debeMandarPush("RECORDATORIO_PARTIDO", cdmx("06:00"))).toBe(true);
  });
});

describe("a dónde lleva el aviso", () => {
  it("solo rutas de Chilena", () => {
    expect(hrefSeguro("/mi-liga/votaciones")).toBe("/mi-liga/votaciones");
    expect(hrefSeguro("https://otro.com")).toBe("/notificaciones");
    expect(hrefSeguro("//otro.com")).toBe("/notificaciones");
    expect(hrefSeguro(null)).toBe("/notificaciones");
  });
});

describe("permiso para activar avisos", () => {
  it("solo cuentas reclamadas", async () => {
    const { reglaCuentaReclamada } = await import("../server/reglas");
    const regla = reglaCuentaReclamada(async (u) => u === "lupe");
    expect(await regla("lupe")).toBe(true);
    expect(await regla("sin-reclamar")).toBe(false);
  });
});
