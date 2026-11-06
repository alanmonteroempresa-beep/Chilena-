import { describe, expect, it } from "vitest";
import {
  autoPostsDeLaJornada,
  cronicaDelPartido,
  golazos,
  paraTi,
  siguiendo,
  situacionDelPartido,
  type EquipoJornada,
  type GolJornada,
  type PartidoJornada,
} from "../server/services/auto-posts";
import { elegirTitular, TITULARES } from "../server/templates/titulares";

// PRD §6.1 · CARTA_E_INSIGNIAS §5 · pantalla 10 — la J15 de la liga demo
const equipo = (id: string, nombre: string, corto: string): EquipoJornada => ({
  id,
  nombre,
  corto,
  slug: id,
  siglas: id,
  colorPrimario: null,
  colorSecundario: null,
});
const DP = equipo("DP", "Dep. Portales", "Portales");
const RC = equipo("RC", "Real Condesa", "Condesa");
const JT = equipo("JT", "Juventud Tepito", "Tepito");
const AP = equipo("AP", "Atlético Pensil", "Pensil");
const TL = equipo("TL", "Tigres del Llano", "Tigres");
const SN = equipo("SN", "Sporting Narvarte", "Narvarte");
const gol = (minuto: number, e: EquipoJornada, jugador: string, tipoGol: string | null = "JUGADA"): GolJornada => ({
  minuto,
  equipoId: e.id,
  jugadorId: jugador,
  jugador,
  username: jugador,
  tipoGol,
});
const partido = (id: string, local: EquipoJornada, visita: EquipoJornada, goles: GolJornada[], cancha = "Cancha 3"): PartidoJornada => ({
  id,
  jornada: 15,
  cancha,
  inicio: new Date("2026-11-01T17:00:00Z"),
  validadoEn: new Date("2026-11-02T22:00:00Z"),
  local,
  visita,
  golesLocal: goles.filter((g) => g.equipoId === local.id).length,
  golesVisita: goles.filter((g) => g.equipoId === visita.id).length,
  goles,
  arbitro: "J. Mendoza",
});

const PORTALES_CONDESA = partido("dp-rc", DP, RC, [
  gol(12, DP, "El Chícharo"),
  gol(31, RC, "El Pelón"),
  gol(63, DP, "El Chícharo", "PANENKA"),
  gol(70, RC, "El Pelón", "CABEZA"),
  gol(87, DP, "El Brujo", "CHILENA"),
]);
const TEPITO_PENSIL = partido("jt-ap", JT, AP, [gol(13, AP, "Polo", "TIRO_LIBRE"), gol(87, JT, "El Tlacuache"), gol(88, JT, "Rafa")]);
const TIGRES_NARVARTE = partido("tl-sn", TL, SN, [gol(34, TL, "El Tanque", "TIRO_LIBRE"), gol(62, TL, "El Tanque", "PENAL"), gol(76, TL, "Toro", "PENAL")], "Cancha 2");

describe("situación del partido", () => {
  it("la J15: agónico, remontada, goleada y victoria", () => {
    expect(situacionDelPartido(PORTALES_CONDESA)).toMatchObject({ situacion: "AGONICO", clave: { minuto: 87, jugador: "El Brujo" } });
    expect(situacionDelPartido(TEPITO_PENSIL).situacion).toBe("REMONTADA");
    expect(situacionDelPartido(TIGRES_NARVARTE).situacion).toBe("GOLEADA");
    expect(situacionDelPartido(partido("ud-hi", DP, RC, [gol(18, DP, "A"), gol(82, DP, "B")])).situacion).toBe("VICTORIA");
  });

  it("empate, hat-trick, líder que pierde y chilena", () => {
    expect(situacionDelPartido(partido("e", DP, RC, [gol(10, DP, "A"), gol(20, RC, "B")])).situacion).toBe("EMPATE");
    expect(situacionDelPartido(partido("h", DP, RC, [gol(10, DP, "A"), gol(20, DP, "A"), gol(30, DP, "A")])).situacion).toBe("HAT_TRICK");
    expect(situacionDelPartido(partido("l", DP, RC, [gol(10, RC, "B")]), "DP").situacion).toBe("LIDER_PIERDE");
    expect(situacionDelPartido(partido("c", DP, RC, [gol(10, DP, "A", "CHILENA")])).situacion).toBe("CHILENA");
  });

  it("un gol al 86' que solo amplía no es agónico", () => {
    expect(situacionDelPartido(partido("x", DP, RC, [gol(10, DP, "A"), gol(86, DP, "B")])).situacion).toBe("VICTORIA");
  });
});

describe("crónica (regla 9: solo datos reales)", () => {
  it("Portales–Condesa: el titular sale del banco de agónico y el cuerpo cuenta lo que pasó", () => {
    const c = cronicaDelPartido(PORTALES_CONDESA);
    expect(["¡SUFRIÓ, PERO CUMPLIÓ!", "¡AL 87', CUANDO NADIE CREÍA!"]).toContain(c.titular);
    expect(c.cuerpo[0]).toBe("Portales le ganó 3–2 a Condesa en la Cancha 3.");
    expect(c.cuerpo[1]).toBe("Por Portales: El Chícharo (2) y El Brujo. Por Condesa: El Pelón (2).");
    expect(c.cuerpo[2]).toBe("El 87' de El Brujo llegó cuando ya se olía el empate.");
  });

  it("remontada y goleada", () => {
    expect(cronicaDelPartido(TEPITO_PENSIL).cuerpo[2]).toBe("Pensil se fue arriba al 13' y Tepito le dio la vuelta.");
    expect(cronicaDelPartido(TIGRES_NARVARTE).cuerpo[2]).toBe("Tigres no dejó dudas: 3 goles de diferencia.");
  });

  it("el titular es estable por partido y lleva los datos en mayúsculas", () => {
    expect(elegirTitular("GOLEADA", "tl-sn", { GANADOR: "Tigres", CANCHA: "Cancha 2" })).toBe(
      elegirTitular("GOLEADA", "tl-sn", { GANADOR: "Tigres", CANCHA: "Cancha 2" }),
    );
    const t = elegirTitular("CHILENA", "z", { JUGADOR: "El Brujo" });
    expect(t).toBe("¡EL BRUJO SE AVENTÓ DE CHILENA!");
    for (const banco of Object.values(TITULARES)) for (const x of banco) expect(x).toMatch(/^¡.*!$/);
  });
});

describe("los posts de la jornada y las pestañas", () => {
  const posts = autoPostsDeLaJornada({
    partidos: [PORTALES_CONDESA, TEPITO_PENSIL, TIGRES_NARVARTE],
    tabla: [{ equipo: DP, pts: 35, posicion: 1 }],
    goleo: [{ nombre: "El Chícharo", username: "el-chicharo", goles: 19 }],
    rachas: [
      { jugadorId: "El Chícharo", nombre: "El Chícharo", username: "el-chicharo", racha: 4 },
      { jugadorId: "El Pelón", nombre: "El Pelón", username: "el-pelon", racha: 2 },
    ],
  });

  it("crónica y resultado por partido, un post por gol, la tabla y las rachas de 3 o más", () => {
    expect(posts.filter((p) => p.tipo === "AUTO_CRONICA")).toHaveLength(3);
    expect(posts.filter((p) => p.tipo === "AUTO_RESULTADO")).toHaveLength(3);
    expect(posts.filter((p) => p.tipo === "AUTO_GOL")).toHaveLength(11);
    expect(posts.filter((p) => p.tipo === "AUTO_TABLA")).toHaveLength(1);
    expect(posts.filter((p) => p.tipo === "AUTO_RACHA").map((p) => p.jugadores[0])).toEqual(["El Chícharo"]);
    const brujo = posts.find((p) => p.tipo === "AUTO_GOL" && p.minuto === 87 && p.jugadores[0] === "El Brujo");
    expect(brujo).toMatchObject({ titular: "El Brujo anotó de chilena al 87'", grande: "de chilena", golazo: true });
  });

  it("Para ti: lo de tu equipo arriba y sin los goles de otros partidos que no son golazo", () => {
    const lista = paraTi(posts, "DP");
    expect(lista[0]).toMatchObject({ tipo: "AUTO_CRONICA", matchId: "dp-rc" });
    expect(lista.some((p) => p.tipo === "AUTO_GOL" && p.matchId === "tl-sn")).toBe(false);
  });

  it("Golazos solo trae goles, con los de chiste primero; Siguiendo filtra por lo que sigue", () => {
    const g = golazos(posts);
    expect(g.every((p) => p.tipo === "AUTO_GOL")).toBe(true);
    expect(g[0].golazo).toBe(true);
    const s = siguiendo(posts, { equipos: new Set(["TL"]), jugadores: new Set() });
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((p) => p.equipos.includes("TL"))).toBe(true);
  });
});

describe("Siguiendo es cronológico por hora del partido", () => {
  it("el partido de las 16:00 va arriba del de las 09:00 aunque los validaran juntos", () => {
    const temprano = { ...TEPITO_PENSIL, inicio: new Date("2026-11-01T15:00:00Z") };
    const tarde = { ...TIGRES_NARVARTE, inicio: new Date("2026-11-01T22:00:00Z") };
    const posts = autoPostsDeLaJornada({ partidos: [temprano, tarde], tabla: [], goleo: [], rachas: [] });
    const s = siguiendo(posts, { equipos: new Set(["JT", "TL"]), jugadores: new Set() });
    expect(s[0]).toMatchObject({ tipo: "AUTO_CRONICA", matchId: "tl-sn" });
    // El 13' es de Pensil (no lo sigue): lo último es el 87' de Tepito
    expect(s.at(-1)).toMatchObject({ tipo: "AUTO_GOL", matchId: "jt-ap", minuto: 87 });
  });
});

describe("autogol en el feed (PRD §7.7)", () => {
  it("suma al contrario, no es post de gol ni cuenta para hat-trick y la crónica dice 'autogol de X'", () => {
    const p = partido("ag", DP, RC, [
      gol(10, DP, "El Chícharo"),
      gol(20, DP, "El Chícharo"),
      { ...gol(30, DP, "El Güero"), autogol: true },
      gol(40, RC, "El Pelón"),
    ]);
    // 3–1: dos del Chícharo y el autogol del Güero suman a Portales
    expect(situacionDelPartido(p).situacion).toBe("VICTORIA");
    expect(cronicaDelPartido(p).cuerpo[1]).toBe("Por Portales: El Chícharo (2) y autogol de El Güero. Por Condesa: El Pelón.");
    const posts = autoPostsDeLaJornada({ partidos: [p], tabla: [], goleo: [], rachas: [] });
    const deGol = posts.filter((x) => x.tipo === "AUTO_GOL");
    expect(deGol).toHaveLength(3);
    expect(deGol.some((x) => x.jugadores.includes("El Güero"))).toBe(false);
  });
});
