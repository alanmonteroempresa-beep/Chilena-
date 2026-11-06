import { describe, expect, it } from "vitest";
import { cuandoTeToca, cuentaRegresiva, horarioCorto } from "../server/services/proximo";
import { chipsDelJugador, lineaDeGol, posicionesDelGoleo } from "../server/services/goleo";

// Domingo 8 de noviembre de 2026, 11:00 en CDMX (UTC-6) = 17:00 UTC
const J16 = new Date("2026-11-08T17:00:00Z");

describe("próximo partido (pantalla 03)", () => {
  it("cuenta días y horas que faltan", () => {
    // Martes 3, 16:00 CDMX → faltan 4 días y 19 horas
    expect(cuentaRegresiva(new Date("2026-11-03T22:00:00Z"), J16)).toEqual({ dias: 4, horas: 19 });
    expect(cuentaRegresiva(new Date("2026-11-08T16:30:00Z"), J16)).toEqual({ dias: 0, horas: 0 });
  });

  it("ya empezado no cuenta negativo", () => {
    expect(cuentaRegresiva(new Date("2026-11-08T18:00:00Z"), J16)).toEqual({ dias: 0, horas: 0 });
  });

  it("dice cuándo te toca con el día de CDMX, no el de UTC", () => {
    expect(cuandoTeToca(new Date("2026-11-05T18:00:00Z"), J16)).toBe("EL DOMINGO");
    expect(cuandoTeToca(new Date("2026-11-07T15:00:00Z"), J16)).toBe("MAÑANA");
    // Sábado 7 a las 23:30 en CDMX ya es domingo en UTC: sigue siendo "mañana"
    expect(cuandoTeToca(new Date("2026-11-08T05:30:00Z"), J16)).toBe("MAÑANA");
    expect(cuandoTeToca(new Date("2026-11-08T13:00:00Z"), J16)).toBe("HOY");
    expect(cuandoTeToca(new Date("2026-10-28T18:00:00Z"), J16)).toBe("EL 8 DE NOVIEMBRE");
  });

  it("horario corto como en el diseño", () => {
    expect(horarioCorto(J16, "Cancha 2")).toBe("Dom 8 · 11:00 · Cancha 2");
    expect(horarioCorto(J16)).toBe("Dom 8 · 11:00");
  });
});

describe("goleo (pantalla 03 · regla 9)", () => {
  it("empates comparten posición y sin goles no hay posición", () => {
    const p = posicionesDelGoleo([
      { userId: "tanque", goles: 16 },
      { userId: "chicharo", goles: 19 },
      { userId: "pelon", goles: 16 },
      { userId: "brujo", goles: 13 },
      { userId: "gato", goles: 0 },
    ]);
    expect(p.get("chicharo")).toBe(1);
    expect(p.get("tanque")).toBe(2);
    expect(p.get("pelon")).toBe(2);
    expect(p.get("brujo")).toBe(4);
    expect(p.has("gato")).toBe(false);
  });

  it("los chips solo salen con datos reales", () => {
    expect(chipsDelJugador({ goles: 19, rachaGoles: 4 }, 1)).toEqual(["🔥 4 partidos anotando", "#1 goleo · 19"]);
    expect(chipsDelJugador({ goles: 3, rachaGoles: 1 }, 7)).toEqual(["#7 goleo · 3"]);
    expect(chipsDelJugador({ goles: 0, rachaGoles: 0 })).toEqual([]);
  });

  it("la línea del gol usa el tipo de gol de la cédula", () => {
    expect(lineaDeGol({ minuto: 87, nombre: "El Brujo", tipoGol: "CHILENA" })).toBe("87' El Brujo, de chilena.");
    expect(lineaDeGol({ minuto: null, nombre: "El Chícharo", tipoGol: "JUGADA" })).toBe("El Chícharo.");
  });
});
