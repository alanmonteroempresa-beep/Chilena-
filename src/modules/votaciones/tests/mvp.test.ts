import { describe, expect, it } from "vitest";
import {
  cierreDelMvp,
  detalleDelCandidato,
  ganadorDelMvp,
  ordenarCandidatos,
  puedeVotar,
  votosParaLaCarta,
  type JugadorDelPartido,
} from "../server/services/mvp";
import { cuandoCierra, yaVotaron } from "../server/services/textos";

// PRD §6.7 · CARTA §3 · pantalla 12
const jugador = (userId: string, extra: Partial<JugadorDelPartido> = {}): JugadorDelPartido => ({
  userId,
  nombre: userId,
  equipo: "Portales",
  goles: [],
  asistencias: 0,
  esPortero: false,
  golesRecibidos: 0,
  penalesAtajados: 0,
  ...extra,
});

describe("cuándo cierra el MVP (POR APROBAR)", () => {
  it("validado el domingo a las 14:00 → cierra hoy a las 22:00 (CDMX)", () => {
    // 14:00 CDMX = 20:00 UTC (CDMX no tiene horario de verano)
    expect(cierreDelMvp(new Date("2026-11-08T20:00:00Z")).toISOString()).toBe("2026-11-09T04:00:00.000Z");
  });
  it("validado después de las 16:00 → cierra mañana a las 22:00", () => {
    expect(cierreDelMvp(new Date("2026-11-09T03:30:00Z")).toISOString()).toBe("2026-11-10T04:00:00.000Z");
  });
});

describe("candidatos con datos reales (regla 9)", () => {
  it("el renglón sale de la cédula", () => {
    expect(detalleDelCandidato(jugador("a", { goles: [{ minuto: 64, tipoGol: "JUGADA" }] }))).toBe("Gol al 64'");
    expect(detalleDelCandidato(jugador("b", { goles: [{ minuto: 87, tipoGol: "CHILENA" }] }))).toBe("Gol de chilena al 87'");
    expect(
      detalleDelCandidato(jugador("c", { goles: [{ minuto: 10, tipoGol: null }, { minuto: 50, tipoGol: "PANENKA" }], asistencias: 1 })),
    ).toBe("2 goles, uno a lo Panenka · 1 asistencia");
    expect(detalleDelCandidato(jugador("d", { esPortero: true, golesRecibidos: 0, penalesAtajados: 1 }))).toBe("Valla invicta · Atajó un penal");
    expect(detalleDelCandidato(jugador("e"))).toBe("Jugó");
  });
  it("los que más hicieron van primero", () => {
    const orden = ordenarCandidatos([
      jugador("zeta"),
      jugador("gato", { esPortero: true, golesRecibidos: 0 }),
      jugador("chicharo", { goles: [{ minuto: 1, tipoGol: null }, { minuto: 2, tipoGol: null }] }),
      jugador("brujo", { asistencias: 1 }),
    ]).map((j) => j.userId);
    expect(orden).toEqual(["chicharo", "gato", "brujo", "zeta"]);
  });
});

describe("votar", () => {
  const abierta = { status: "ABIERTA", closesAt: new Date("2026-11-09T04:00:00Z") };
  const antes = new Date("2026-11-09T03:00:00Z");
  it("nadie vota por sí mismo", () => {
    expect(puedeVotar(abierta, "chicharo", "chicharo", antes)).toMatch(/uno mismo/);
    expect(puedeVotar(abierta, "lupe", "chicharo", antes)).toBeNull();
  });
  it("cerrada no se vota", () => {
    expect(puedeVotar(abierta, "lupe", "chicharo", new Date("2026-11-09T04:00:00Z"))).toMatch(/cerró/);
    expect(puedeVotar({ ...abierta, status: "CERRADA" }, "lupe", "chicharo", antes)).toMatch(/cerró/);
  });
});

describe("ganador (POR APROBAR)", () => {
  const t = (h: number) => new Date(`2026-11-09T0${h}:00:00Z`);
  it("el de más votos; si empatan, el que llegó primero", () => {
    expect(ganadorDelMvp([{ id: "a", votos: 3, ultimoVotoEn: t(2) }, { id: "b", votos: 5, ultimoVotoEn: t(3) }])).toBe("b");
    expect(ganadorDelMvp([{ id: "a", votos: 4, ultimoVotoEn: t(3) }, { id: "b", votos: 4, ultimoVotoEn: t(1) }])).toBe("b");
  });
  it("sin votos no hay MVP", () => {
    expect(ganadorDelMvp([{ id: "a", votos: 0, ultimoVotoEn: null }])).toBeNull();
    expect(ganadorDelMvp([])).toBeNull();
  });
});

describe("lo que la carta toma de las votaciones (CRK)", () => {
  const v = (matchId: string, ganador: string | null, votos: Record<string, number>) => ({
    matchId,
    ganadorUserId: ganador,
    total: Object.values(votos).reduce((s, n) => s + n, 0),
    votosDe: new Map(Object.entries(votos)),
  });
  const votaciones = [v("m1", "chicharo", { chicharo: 6, brujo: 4 }), v("m2", "brujo", { chicharo: 2, brujo: 8 }), v("m3", "chicharo", { chicharo: 1 })];
  it("MVP ganados y % promedio, solo de su ventana", () => {
    expect(votosParaLaCarta(votaciones, "chicharo", new Set(["m1", "m2"]))).toEqual({ mvps: 1, porcentajeVotos: 40 });
    expect(votosParaLaCarta(votaciones, "chicharo", new Set(["m1", "m2", "m3"]))).toEqual({ mvps: 2, porcentajeVotos: 60 });
    expect(votosParaLaCarta(votaciones, "nadie", new Set(["m1"]))).toEqual({ mvps: 0, porcentajeVotos: 0 });
  });
});

describe("textos", () => {
  const ahora = new Date("2026-11-08T18:00:00Z"); // domingo 12:00 CDMX
  it("cuándo cierra, en CDMX", () => {
    expect(cuandoCierra(new Date("2026-11-09T04:00:00Z"), ahora)).toBe("hoy a las 22:00");
    expect(cuandoCierra(new Date("2026-11-10T04:00:00Z"), ahora)).toBe("mañana a las 22:00");
    expect(cuandoCierra(new Date("2026-11-11T04:00:00Z"), ahora)).toBe("el martes a las 22:00");
  });
  it("cuántos ya votaron", () => {
    expect(yaVotaron(0)).toBe("Nadie ha votado");
    expect(yaVotaron(1)).toBe("1 ya votó");
    expect(yaVotaron(418)).toBe("418 ya votaron");
  });
});
