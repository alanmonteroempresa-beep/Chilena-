import { describe, expect, it } from "vitest";
import { armarHistoriales, posicionMasJugada, ventanaDe } from "../server/services/historial";

// La ventana de la carta y el historial de las insignias (docs/CARTA_E_INSIGNIAS.md §1 y §4)
const dia = (d: number) => new Date(Date.UTC(2026, 7, d));
const partido = (id: string, d: number, local = "DP", visita = "TL", gl = 1, gv = 0) => ({
  id,
  tournamentId: "apertura",
  scheduledAt: dia(d),
  homeTeamId: local,
  awayTeamId: visita,
  homeScore: gl,
  awayScore: gv,
});
const alineacion = (matchId: string, userId: string, jugo: boolean | null, titular = true, posicion = "DC") => ({
  userId,
  jugo,
  titular,
  posicion,
  lineup: { matchId, teamId: "DP" },
});
const evento = (matchId: string, type: string, playerId: string, extra: Record<string, unknown> = {}) => ({
  matchId,
  type,
  minute: null,
  tipoGol: null,
  teamId: "DP",
  playerId,
  assistPlayerId: null,
  ...extra,
});

describe("historial de cada jugador", () => {
  const plantillas = [{ userId: "chicharo", tournamentId: "apertura", teamId: "DP" }];
  const filas = {
    partidos: [partido("m1", 1), partido("m2", 8, "TL", "DP", 2, 0), partido("m3", 15), partido("otro", 15, "RC", "JT")],
    alineaciones: [alineacion("m1", "chicharo", true), alineacion("m2", "chicharo", false, false), alineacion("m3", "chicharo", null)],
    eventos: [
      evento("m1", "GOL", "chicharo", { tipoGol: "PANENKA" }),
      evento("m1", "GOL", "brujo", { assistPlayerId: "chicharo" }),
      evento("m3", "AMARILLA", "chicharo"),
      evento("m3", "AMARILLA", "chicharo"),
    ],
    suspensiones: [],
  };

  it("solo los partidos de su equipo, con lo suyo en cada uno", () => {
    const h = armarHistoriales(plantillas, filas).get("chicharo")!;
    expect(h.map((p) => p.matchId)).toEqual(["m1", "m2", "m3"]);
    expect(h[0]).toMatchObject({ jugo: true, goles: ["PANENKA"], asistencias: 1, golesEnContra: 0 });
    // De visita en m2: recibió los 2 de Tigres; en la banca sin entrar no jugó
    expect(h[1]).toMatchObject({ jugo: false, enAlineacion: true, golesEnContra: 2 });
    // Sin la marca del árbitro, el titular jugó
    expect(h[2].jugo).toBe(true);
  });

  it("la ventana: doble amarilla = 1 roja, y por partido jugado", () => {
    const v = ventanaDe(armarHistoriales(plantillas, filas).get("chicharo")!);
    expect(v).toMatchObject({ convocados: 3, jugados: 2, goles: 1, asistencias: 1, amarillas: 0, rojas: 1, vallasInvictas: 2 });
  });

  it("la suspensión marca los partidos que se perdió después de la tarjeta", () => {
    const conSuspension = {
      ...filas,
      alineaciones: [alineacion("m1", "chicharo", true)],
      suspensiones: [{ userId: "chicharo", matchId: "m1", partidos: 1 }],
    };
    const h = armarHistoriales(plantillas, conSuspension).get("chicharo")!;
    expect(h.map((p) => p.suspendido)).toEqual([false, true, false]);
  });

  it("solo los últimos 20 partidos cuentan para la carta", () => {
    const muchos = {
      partidos: Array.from({ length: 25 }, (_, i) => partido(`m${i}`, i + 1)),
      alineaciones: Array.from({ length: 25 }, (_, i) => alineacion(`m${i}`, "chicharo", true)),
      eventos: Array.from({ length: 5 }, (_, i) => evento(`m${i}`, "GOL", "chicharo")),
      suspensiones: [],
    };
    const v = ventanaDe(armarHistoriales(plantillas, muchos).get("chicharo")!);
    expect(v.convocados).toBe(20);
    expect(v.goles).toBe(0);
  });

  it("la posición que más jugó", () => {
    const h = armarHistoriales(plantillas, filas).get("chicharo")!;
    expect(posicionMasJugada(h)).toBe("DC");
  });
});
