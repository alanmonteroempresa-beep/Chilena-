import { describe, expect, it } from "vitest";
import { alineacionConMarcas, esGolazo, marcadorDeEventos, resumenDelPartido, type EventoCedula } from "../server/services/resumen-partido";

// Pantalla 32a: Portales 3–2 Condesa (J15), la cédula de la semilla
const e = (minuto: number, tipo: string, equipoId: string, jugadorId: string, extra: Partial<EventoCedula> = {}): EventoCedula => ({
  minuto,
  tipo,
  equipoId,
  jugador: jugadorId,
  jugadorId,
  ...extra,
});
const CEDULA = [
  e(87, "GOL", "DP", "brujo", { tipoGol: "CHILENA" }),
  e(12, "GOL", "DP", "chicharo", { tipoGol: "JUGADA" }),
  e(31, "GOL", "RC", "pelon"),
  e(58, "AMARILLA", "RC", "guero", { nota: "falta por detrás" }),
  e(63, "GOL", "DP", "chicharo", { tipoGol: "PANENKA" }),
  e(70, "GOL", "RC", "pelon", { tipoGol: "CABEZA" }),
  e(75, "CAMBIO", "DP", "kike", { sale: "Beto", saleId: "beto" }),
];

describe("resumen del partido (32a)", () => {
  it("goles de cada lado en orden, tarjetas, cambios y el total de la cédula", () => {
    const r = resumenDelPartido(CEDULA, "DP", "RC");
    expect(r.golesLocal.map((g) => g.minuto)).toEqual([12, 63, 87]);
    expect(r.golesVisita.map((g) => g.minuto)).toEqual([31, 70]);
    expect(r.tarjetas).toHaveLength(1);
    expect(r.cambios[0]).toMatchObject({ jugadorId: "kike", saleId: "beto" });
    expect(r.total).toBe(7);
  });

  it("Panenka y chilena son golazo", () => {
    expect(esGolazo("PANENKA")).toBe(true);
    expect(esGolazo("CHILENA")).toBe(true);
    expect(esGolazo("CABEZA")).toBe(false);
  });
});

describe("alineaciones con marcas (32a)", () => {
  const j = (userId: string, numero: number, posicion: string, titular = true) => ({
    userId,
    username: userId,
    nombre: userId,
    numero,
    titular,
    posicion,
    capitan: false,
  });

  it("titulares de portero a delantero, luego la banca; goles, tarjetas y cambios", () => {
    const filas = alineacionConMarcas(
      [j("chicharo", 9, "DC"), j("gato", 1, "POR"), j("kike", 14, "DC", false), j("beto", 11, "EXT"), j("memo", 3, "DFC")],
      CEDULA,
    );
    expect(filas.map((f) => f.userId)).toEqual(["gato", "memo", "beto", "chicharo", "kike"]);
    expect(filas.find((f) => f.userId === "chicharo")).toMatchObject({ goles: 2 });
    expect(filas.find((f) => f.userId === "beto")).toMatchObject({ salio: true });
    expect(filas.find((f) => f.userId === "kike")).toMatchObject({ entro: true, titular: false });
  });
});

describe("autogol (PRD §7.7)", () => {
  it("se anota con el equipo del jugador y suma al contrario", () => {
    const eventos = [e(10, "GOL", "DP", "chicharo"), e(20, "AUTOGOL", "DP", "memo"), e(30, "AUTOGOL", "RC", "guero")];
    expect(marcadorDeEventos(eventos, "DP", "RC")).toEqual({ local: 2, visita: 1 });
    const r = resumenDelPartido(eventos, "DP", "RC");
    expect(r.golesLocal.map((g) => [g.tipo, g.jugadorId])).toEqual([["GOL", "chicharo"], ["AUTOGOL", "guero"]]);
    expect(r.golesVisita.map((g) => [g.tipo, g.jugadorId])).toEqual([["AUTOGOL", "memo"]]);
  });

  it("no cuenta como gol del jugador en la alineación", () => {
    const [memo] = alineacionConMarcas(
      [{ userId: "memo", username: "memo", nombre: "Memo", numero: 3, titular: true, posicion: "DFC", capitan: true }],
      [e(20, "AUTOGOL", "DP", "memo")],
    );
    expect(memo.goles).toBe(0);
  });
});
