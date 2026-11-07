import { describe, expect, it } from "vitest";
import { estadisticasDelTorneo, type EventoParaEstadisticas, type PartidoParaEstadisticas } from "../server/services/estadisticas";

// Portales (DP) en tres jornadas validadas y una sin validar (regla 2: no cuenta)
const p = (id: string, orden: number, home: string, away: string, hs: number, as: number, status = "VALIDADO"): PartidoParaEstadisticas => ({
  id,
  orden,
  status,
  homeTeamId: home,
  awayTeamId: away,
  homeScore: hs,
  awayScore: as,
});
const partidos = [p("j1", 1, "DP", "TL", 2, 0), p("j2", 2, "RC", "DP", 1, 1), p("j3", 3, "DP", "HI", 3, 2), p("j4", 4, "DP", "PE", 5, 0, "POR_FIRMAR")];
const ev = (matchId: string, type: string, playerId: string, extra: Partial<EventoParaEstadisticas> = {}): EventoParaEstadisticas => ({
  matchId,
  type,
  minute: null,
  teamId: "DP",
  playerId,
  assistPlayerId: null,
  ...extra,
});
const eventos = [
  ev("j1", "GOL", "chicharo", { assistPlayerId: "brujo" }),
  ev("j1", "GOL", "brujo"),
  ev("j2", "GOL", "chicharo"),
  ev("j3", "GOL", "chicharo"),
  ev("j3", "AUTOGOL", "roca"),
  ev("j3", "AMARILLA", "roca"),
  ev("j3", "AMARILLA", "roca"),
  ev("j3", "ROJA", "roca"),
  ev("j4", "GOL", "chicharo"),
];
const jugaron = (matchId: string, ...ids: string[]) => ids.map((userId) => ({ matchId, userId, jugo: true, titular: true }));
const alineaciones = [
  ...jugaron("j1", "gato", "chicharo", "brujo", "roca"),
  ...jugaron("j2", "gato", "chicharo"),
  { matchId: "j2", userId: "brujo", jugo: false, titular: false },
  ...jugaron("j3", "gato", "chicharo", "brujo", "roca"),
];
const jugadores = ["gato", "chicharo", "brujo", "roca"].map((userId) => ({ userId, teamId: "DP", esPortero: userId === "gato" }));

describe("estadísticas del torneo (desde lo validado)", () => {
  const stats = estadisticasDelTorneo({ jugadores, partidos, alineaciones, eventos, suspensiones: [] });

  it("partidos jugados, goles y asistencias solo de lo VALIDADO; el autogol no es gol de nadie", () => {
    expect(stats.get("chicharo")).toMatchObject({ partidos: 3, goles: 3, rachaGoles: 3 });
    expect(stats.get("brujo")).toMatchObject({ partidos: 2, goles: 1, asistencias: 1, rachaGoles: 0 });
    expect(stats.get("roca")).toMatchObject({ goles: 0 });
  });

  it("la doble amarilla cuenta como 1 roja y 0 amarillas (PRD §7.8)", () => {
    expect(stats.get("roca")).toMatchObject({ amarillas: 0, rojas: 1 });
  });

  it("el portero: goles recibidos y vallas invictas en lo que jugó", () => {
    expect(stats.get("gato")).toMatchObject({ golesRecibidos: 3, vallasInvictas: 1 });
    expect(stats.get("chicharo")).toMatchObject({ golesRecibidos: 0, vallasInvictas: 0 });
  });

  it("domingos sin faltar: la banca cuenta; faltar corta; cumplir una sanción pausa", () => {
    expect(stats.get("brujo")!.rachaAsistencia).toBe(3);
    const conFalta = estadisticasDelTorneo({
      jugadores,
      partidos,
      alineaciones: alineaciones.filter((a) => !(a.matchId === "j2" && a.userId === "roca")),
      eventos,
      suspensiones: [],
    });
    expect(conFalta.get("roca")!.rachaAsistencia).toBe(1);
    const suspendido = estadisticasDelTorneo({ jugadores, partidos, alineaciones, eventos, suspensiones: [{ userId: "roca", matchId: "j1", partidos: 1 }] });
    expect(suspendido.get("roca")!.rachaAsistencia).toBe(2);
  });

  it("recalcular da lo mismo (idempotente)", () => {
    const otra = estadisticasDelTorneo({ jugadores, partidos, alineaciones, eventos, suspensiones: [] });
    expect([...otra]).toEqual([...stats]);
  });
});
