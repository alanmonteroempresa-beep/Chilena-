import { describe, expect, it } from "vitest";
import { armarLigaDemo, domingoJ15 } from "../../prisma/demo/plan";

// Lunes 12 de octubre de 2026: la fecha del deck (J15 = domingo 11, J16 = domingo 18)
const HOY = new Date("2026-10-12T12:00:00-06:00");
const plan = armarLigaDemo({ hoy: HOY });

const usuario = (username: string) => {
  const u = plan.users.find((x) => x.username === username);
  if (!u) throw new Error(`No existe ${username}`);
  return u;
};
const stat = (username: string) => plan.playerTournamentStats.find((s) => s.userId === usuario(username).id)!;
const equipo = (slug: string) => plan.teams.find((t) => t.slug === slug)!;
const jornada = (n: number) => plan.rounds.find((r) => r.numero === n)!;
const partidosDe = (n: number) => plan.matches.filter((m) => m.roundId === jornada(n).id);
// En CreateManyInput el id es opcional; en la demo siempre viene
const eventosDe = (matchId?: string) => plan.matchEvents.filter((e) => e.matchId === matchId);
const jugoEn = (matchId: string | undefined, userId: string) => {
  const lineupIds = plan.lineups.filter((l) => l.matchId === matchId).map((l) => l.id);
  return plan.lineupPlayers.some((lp) => lineupIds.includes(lp.lineupId) && lp.userId === userId && lp.jugo);
};

describe("fechas", () => {
  it("la J15 es el domingo anterior a hoy y la J16 el siguiente", () => {
    expect(domingoJ15(HOY)).toBe("2026-10-11");
    expect(domingoJ15(new Date("2026-10-17T20:00:00-06:00"))).toBe("2026-10-11"); // sábado
    expect(domingoJ15(new Date("2026-10-18T08:00:00-06:00"))).toBe("2026-10-11"); // domingo: hoy toca la J16
  });

  it("nada jugado queda en el futuro", () => {
    for (const m of plan.matches.filter((x) => x.status === "VALIDADO")) {
      expect(new Date(m.validatedAt!).getTime()).toBeLessThanOrEqual(HOY.getTime());
    }
  });
});

describe("reglas 1 y 2: solo lo validado cuenta", () => {
  it("J1–J15 validadas con cédula; J16–J18 programadas, sin marcador ni eventos", () => {
    for (let n = 1; n <= 18; n++) {
      for (const m of partidosDe(n)) {
        const cedula = plan.matchReports.find((r) => r.matchId === m.id);
        if (n <= 15) {
          expect(m.status).toBe("VALIDADO");
          expect(cedula?.status).toBe("VALIDADA");
          expect(cedula?.homeScore).toBe(m.homeScore);
          expect(cedula?.awayScore).toBe(m.awayScore);
        } else {
          expect(m.status).toBe("PROGRAMADO");
          expect(m.homeScore ?? null).toBeNull();
          expect(cedula).toBeUndefined();
          expect(eventosDe(m.id)).toHaveLength(0);
        }
      }
    }
  });

  it("el marcador oficial es la suma de los goles de la cédula", () => {
    for (const m of plan.matches.filter((x) => x.status === "VALIDADO")) {
      const goles = eventosDe(m.id).filter((e) => e.type === "GOL");
      expect(goles.filter((e) => e.teamId === m.homeTeamId)).toHaveLength(m.homeScore!);
      expect(goles.filter((e) => e.teamId === m.awayTeamId)).toHaveLength(m.awayScore!);
    }
  });

  it("la tabla sale de los partidos validados", () => {
    const pts = new Map<string, number>();
    for (const m of plan.matches.filter((x) => x.status === "VALIDADO")) {
      const [l, v] = [m.homeScore!, m.awayScore!];
      pts.set(m.homeTeamId, (pts.get(m.homeTeamId) ?? 0) + (l > v ? 3 : l === v ? 1 : 0));
      pts.set(m.awayTeamId, (pts.get(m.awayTeamId) ?? 0) + (v > l ? 3 : l === v ? 1 : 0));
    }
    for (const fila of plan.standings) {
      const teamId = plan.tournamentTeams.find((t) => t.id === fila.tournamentTeamId)!.teamId;
      expect(fila.pts).toBe(pts.get(teamId));
      expect(fila.pj).toBe(15);
    }
    expect(plan.standings.reduce((s, f) => s + f.dg!, 0)).toBe(0);
  });
});

describe("lo que muestran las pantallas", () => {
  it("tabla: Portales 35 · Tigres 33 · Condesa 27 · … · Halcones 6", () => {
    expect(plan.resumen.tabla.map((f) => [f.clave, f.pts])).toEqual([
      ["DP", 35],
      ["TL", 33],
      ["RC", 27],
      ["JT", 22],
      ["AP", 19],
      ["UD", 15],
      ["SN", 10],
      ["HI", 6],
    ]);
  });

  it("goleo: El Chícharo 19 · El Tanque 16 · El Pelón 13", () => {
    expect(plan.resumen.goleo.slice(0, 3).map((g) => [g.nombre, g.goles])).toEqual([
      ["El Chícharo", 19],
      ["El Tanque", 16],
      ["El Pelón", 13],
    ]);
  });

  it("carta del Chícharo: 19 goles, 14 partidos, 7 asistencias, 4 partidos anotando, 4 amarillas", () => {
    expect(stat("el-chicharo")).toMatchObject({
      goles: 19,
      partidos: 14,
      asistencias: 7,
      rachaGoles: 4,
      amarillas: 4,
    });
  });

  it("El Brujo 11·15·9, La Pulga 4·14·6, Toñito 2·13·3", () => {
    expect(stat("el-brujo")).toMatchObject({ goles: 11, partidos: 15, asistencias: 9 });
    expect(stat("la-pulga")).toMatchObject({ goles: 4, partidos: 14, asistencias: 6 });
    expect(stat("tonito-juarez")).toMatchObject({ goles: 2, partidos: 13, asistencias: 3 });
  });

  it("El Gato: 4 vallas invictas y 0 tarjetas · El Pulpo: 2 penales atajados", () => {
    expect(stat("el-gato")).toMatchObject({ vallasInvictas: 4, amarillas: 0, rojas: 0, partidos: 15 });
    expect(stat("el-pulpo").penalesAtajados).toBe(2);
  });

  it("cédula de la J15: Portales 3–2 Condesa con los 7 eventos del deck", () => {
    const m = partidosDe(15).find((x) => x.homeTeamId === equipo("dep-portales").id)!;
    expect([m.homeScore, m.awayScore]).toEqual([3, 2]);
    const nombre = (id?: string | null) => plan.users.find((u) => u.id === id)?.sobrenombre;
    expect(eventosDe(m.id).map((e) => [e.minute, e.type, nombre(e.playerId), e.tipoGol ?? null])).toEqual([
      [12, "GOL", "El Chícharo", "JUGADA"],
      [31, "GOL", "El Pelón", "JUGADA"],
      [58, "AMARILLA", "El Güero", null],
      [63, "GOL", "El Chícharo", "PANENKA"],
      [70, "GOL", "El Pelón", "CABEZA"],
      [75, "CAMBIO", "Kike", null],
      [87, "GOL", "El Brujo", "CHILENA"],
    ]);
    expect(m.refereeId).toBe(usuario("jorge-mendoza").id);
  });

  it("J14: Halcones 1–2 Portales con la roja de La Roca al 71'", () => {
    const m = partidosDe(14).find((x) => x.awayTeamId === equipo("dep-portales").id)!;
    expect(m.homeTeamId).toBe(equipo("halcones-iztapalapa").id);
    expect([m.homeScore, m.awayScore]).toEqual([1, 2]);
    const roja = eventosDe(m.id).find((e) => e.type === "ROJA")!;
    expect([roja.playerId, roja.minute]).toEqual([usuario("la-roca").id, 71]);
  });

  it("rol de la J16 del panel de la liga, con Narvarte–Pensil sin árbitro", () => {
    const slugDe = (id: string) => plan.teams.find((t) => t.id === id)!.slug;
    const arbitro = (id?: string | null) => plan.users.find((u) => u.id === id)?.apellidos ?? null;
    expect(
      partidosDe(16)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
        .map((m) => [slugDe(m.homeTeamId), slugDe(m.awayTeamId), arbitro(m.refereeId)]),
    ).toEqual([
      ["juventud-tepito", "union-doctores", "Pacheco"],
      ["dep-portales", "tigres-del-llano", "Mendoza"],
      ["real-condesa", "halcones-iztapalapa", "Ortega"],
      ["sporting-narvarte", "atletico-pensil", null],
    ]);
  });

  it("pase de lista de la J16: 11 de 16 van, Rambo no va, 3 sin contestar, La Roca suspendido en la lista", () => {
    const va = plan.matchAttendances.filter((a) => a.status === "VA");
    expect(va).toHaveLength(11);
    expect(plan.matchAttendances.find((a) => a.userId === usuario("rambo-bautista").id)).toMatchObject({
      status: "NO_VA",
      nota: "Le toca trabajar",
    });
    expect(plan.matchAttendances.filter((a) => a.status === "CONVOCADO")).toHaveLength(3);
    // Las alertas no bloquean (PRD §7.6): el suspendido sale en la lista con su nota
    expect(plan.matchAttendances).toHaveLength(16);
    expect(plan.matchAttendances.find((a) => a.userId === usuario("la-roca").id)).toMatchObject({
      status: "NO_VA",
      nota: "Suspendido · roja en la J14",
    });
  });

  it("bitácora: la liga validó cada partido y aplicó la sanción manual", () => {
    const validados = plan.matches.filter((m) => m.status === "VALIDADO");
    const validaciones = plan.auditLogs.filter((a) => a.action === "VALIDATE");
    expect(validaciones.map((a) => a.entityId).sort()).toEqual(validados.map((m) => m.id).sort());
    const roca = plan.sanctions.find((s) => s.userId === usuario("la-roca").id)!;
    expect(plan.auditLogs.find((a) => a.entityId === roca.id)).toMatchObject({
      action: "CREATE",
      entityType: "Sanction",
    });
  });

  it("los puntos salen de la configuración del torneo", () => {
    expect([plan.tournament.puntosVictoria, plan.tournament.puntosEmpate]).toEqual([3, 1]);
  });
});

describe("regla 4: un jugador, un equipo por torneo", () => {
  it("nadie está en dos plantillas del torneo", () => {
    const ids = plan.tournamentRosters.map((r) => r.userId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(8 * 16);
  });

  it("cada equipo juega solo con su plantilla", () => {
    for (const l of plan.lineups) {
      const tt = plan.tournamentTeams.find((t) => t.teamId === l.teamId)!;
      const plantilla = new Set(
        plan.tournamentRosters.filter((r) => r.tournamentTeamId === tt.id).map((r) => r.userId),
      );
      for (const lp of plan.lineupPlayers.filter((x) => x.lineupId === l.id))
        expect(plantilla.has(lp.userId)).toBe(true);
    }
  });
});

describe("sanciones", () => {
  it("el expulsado no juega mientras está suspendido", () => {
    for (const s of plan.sanctions) {
      const roja = plan.matches.find((m) => m.id === s.matchId)!;
      const numero = plan.rounds.find((r) => r.id === roja.roundId)!.numero;
      for (let n = numero + 1; n <= Math.min(15, numero + s.partidos!); n++) {
        for (const m of partidosDe(n)) expect(jugoEn(m.id, s.userId!)).toBe(false);
      }
    }
  });

  it("La Roca: 2 partidos, cumplió 1, sigue activa; las automáticas ya se cumplieron", () => {
    const roca = plan.sanctions.find((s) => s.userId === usuario("la-roca").id)!;
    expect(roca).toMatchObject({ partidos: 2, partidosCumplidos: 1, status: "ACTIVA", automatica: false });
    for (const s of plan.sanctions.filter((x) => x.automatica))
      expect(s).toMatchObject({ partidos: 1, status: "CUMPLIDA" });
  });

  it("nadie llega a 5 amarillas ni tiene dos en un partido", () => {
    for (const s of plan.playerTournamentStats) expect(s.amarillas).toBeLessThan(5);
    for (const m of plan.matches) {
      const amarillas = eventosDe(m.id)
        .filter((e) => e.type === "AMARILLA")
        .map((e) => e.playerId);
      expect(new Set(amarillas).size).toBe(amarillas.length);
    }
  });
});

describe("cédulas coherentes", () => {
  it("solo anota, asiste o es amonestado quien jugó, y nadie se asiste solo", () => {
    for (const e of plan.matchEvents) {
      expect(jugoEn(e.matchId, e.playerId!)).toBe(true);
      if (e.assistPlayerId) {
        expect(e.assistPlayerId).not.toBe(e.playerId);
        expect(jugoEn(e.matchId, e.assistPlayerId)).toBe(true);
      }
    }
  });

  it("cada alineación tiene portero y a lo más 11 titulares", () => {
    for (const l of plan.lineups) {
      const titulares = plan.lineupPlayers.filter((x) => x.lineupId === l.id && x.titular);
      expect(titulares.length).toBeLessThanOrEqual(11);
      expect(titulares.length).toBeGreaterThanOrEqual(7);
      expect(titulares.some((t) => t.posicion === "POR")).toBe(true);
    }
  });

  it("las estadísticas cuadran con los eventos", () => {
    for (const s of plan.playerTournamentStats) {
      const goles = plan.matchEvents.filter((e) => e.type === "GOL" && e.playerId === s.userId).length;
      const asist = plan.matchEvents.filter((e) => e.assistPlayerId === s.userId).length;
      expect([s.goles, s.asistencias]).toEqual([goles, asist]);
    }
  });
});

describe("base de datos", () => {
  it("es determinista: misma fecha, mismos datos e IDs", () => {
    expect(JSON.stringify(armarLigaDemo({ hoy: HOY }))).toBe(JSON.stringify(plan));
  });

  it("regla 8: sin datos privados", () => {
    for (const u of plan.users) {
      expect(u.celular ?? null).toBeNull();
      expect(u.email ?? null).toBeNull();
      expect(u.fechaNacimiento ?? null).toBeNull();
      expect(u.contactoEmergenciaTel ?? null).toBeNull();
      expect(u.contactoEmergenciaNom ?? null).toBeNull();
    }
    for (const p of plan.playerProfiles) {
      expect([p.tallaCalzado, p.tallaPantalon, p.tallaPlayera].map((x) => x ?? null)).toEqual([
        null,
        null,
        null,
      ]);
    }
    for (const r of plan.refereeProfiles) {
      expect([r.tallaPlayera, r.tallaPantalon].map((x) => x ?? null)).toEqual([null, null]);
    }
    for (const t of plan.teams) expect(t.datosPago ?? null).toBeNull();
    expect(plan.league.datosPago ?? null).toBeNull();
    expect(plan.league.whatsappContacto ?? null).toBeNull();
  });

  it("regla 7 y CHECKs: dinero en centavos enteros y positivos", () => {
    for (const c of [...plan.leagueCharges, ...plan.refereePayments, ...plan.teamDues]) {
      expect(Number.isInteger(c.amountCents)).toBe(true);
      expect(c.amountCents).toBeGreaterThan(0);
    }
  });

  it("IDs y usernames únicos; local ≠ visita; nadie se sigue a sí mismo", () => {
    const ids = [...plan.users, ...plan.matches, ...plan.matchEvents, ...plan.teams].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(plan.users.map((u) => u.username)).size).toBe(plan.users.length);
    for (const m of plan.matches) expect(m.homeTeamId).not.toBe(m.awayTeamId);
    for (const f of plan.userFollows) expect(f.followerId).not.toBe(f.followedId);
  });
});
