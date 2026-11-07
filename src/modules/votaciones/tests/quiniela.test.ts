import { describe, expect, it } from "vitest";
import {
  loQueDiceLaPorra,
  porcentajes,
  puntosDelPronostico,
  quinielaCerrada,
  rankingDeQuiniela,
} from "../server/services/quiniela";

// PRD §6.8 · pantalla 13
describe("quiniela: puntos", () => {
  it("3 por el marcador exacto", () => {
    expect(puntosDelPronostico({ local: 2, visita: 1 }, { local: 2, visita: 1 })).toBe(3);
    expect(puntosDelPronostico({ local: 0, visita: 0 }, { local: 0, visita: 0 })).toBe(3);
  });
  it("1 por el ganador o el empate", () => {
    expect(puntosDelPronostico({ local: 1, visita: 0 }, { local: 3, visita: 1 })).toBe(1);
    expect(puntosDelPronostico({ local: 1, visita: 1 }, { local: 2, visita: 2 })).toBe(1);
    expect(puntosDelPronostico({ local: 0, visita: 2 }, { local: 1, visita: 4 })).toBe(1);
  });
  it("0 si no le atinas", () => {
    expect(puntosDelPronostico({ local: 2, visita: 1 }, { local: 1, visita: 1 })).toBe(0);
    expect(puntosDelPronostico({ local: 1, visita: 1 }, { local: 0, visita: 1 })).toBe(0);
  });
});

describe("quiniela: cierra 1 minuto antes", () => {
  const scheduledAt = new Date("2026-11-08T17:00:00Z");
  it("abierta hasta un minuto antes", () => {
    expect(quinielaCerrada({ scheduledAt, status: "PROGRAMADO" }, new Date("2026-11-08T16:58:59Z"))).toBe(false);
    expect(quinielaCerrada({ scheduledAt, status: "PROGRAMADO" }, new Date("2026-11-08T16:59:00Z"))).toBe(true);
  });
  it("si el partido ya empezó, cerrada aunque la hora no haya llegado", () => {
    expect(quinielaCerrada({ scheduledAt, status: "EN_JUEGO" }, new Date("2026-11-08T10:00:00Z"))).toBe(true);
  });
});

describe("lo que dice la porra", () => {
  it("porcentajes que suman 100", () => {
    expect(porcentajes([1, 1, 1])).toEqual([34, 33, 33]);
    expect(porcentajes([0, 0, 0])).toEqual([0, 0, 0]);
    const r = loQueDiceLaPorra([
      { local: 2, visita: 1 },
      { local: 1, visita: 0 },
      { local: 1, visita: 1 },
      { local: 0, visita: 2 },
    ]);
    expect(r).toEqual({ total: 4, local: 50, empate: 25, visita: 25 });
  });
});

describe("los que más le atinan", () => {
  it("por puntos, luego exactos; los empatados comparten lugar", () => {
    const r = rankingDeQuiniela([
      { userId: "karla", puntos: 28, exactos: 4 },
      { userId: "tono", puntos: 34, exactos: 6 },
      { userId: "lupe", puntos: 31, exactos: 5 },
      { userId: "beto", puntos: 28, exactos: 4 },
      { userId: "guera", puntos: 28, exactos: 5 },
    ]);
    expect(r.map((f) => [f.userId, f.posicion])).toEqual([
      ["tono", 1],
      ["lupe", 2],
      ["guera", 3],
      ["beto", 4],
      ["karla", 4],
    ]);
  });
});
