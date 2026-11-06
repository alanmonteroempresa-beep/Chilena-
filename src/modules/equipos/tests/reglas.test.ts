import { describe, expect, it } from "vitest";
import { can, registerRule } from "@/modules/core";
import { reglaContestarPorMi, reglaDelegadoDelEquipo } from "../server/reglas";
import { alineacionSchema, contestarPorLinkSchema } from "../schemas";

// PERMISOS.md §3 · Equipo
const delegados = new Set(["memo:portales", "poncho:tigres"]);
const miembros = new Set(["memo:portales", "chicharo:portales", "poncho:tigres"]);
registerRule("attendance.sendLink", reglaDelegadoDelEquipo(async (u, t) => delegados.has(`${u}:${t}`)));
registerRule("lineup.submit", reglaDelegadoDelEquipo(async (u, t) => delegados.has(`${u}:${t}`)));
registerRule("attendance.respond", reglaContestarPorMi(async (u, t) => miembros.has(`${u}:${t}`)));

describe("permisos del equipo (PERMISOS §3)", () => {
  it("el pase de lista y la alineación solo los manda el delegado de ESE equipo", async () => {
    expect(await can("memo", "attendance.sendLink", { teamId: "portales" })).toBe(true);
    expect(await can("memo", "lineup.submit", { teamId: "tigres" })).toBe(false);
    expect(await can("chicharo", "lineup.submit", { teamId: "portales" })).toBe(false);
    expect(await can("memo", "lineup.submit")).toBe(false);
  });

  it("en la app cada quien contesta por sí mismo y solo en su equipo", async () => {
    expect(await can("chicharo", "attendance.respond", { teamId: "portales", targetUserId: "chicharo" })).toBe(true);
    expect(await can("chicharo", "attendance.respond", { teamId: "portales", targetUserId: "memo" })).toBe(false);
    expect(await can("chicharo", "attendance.respond", { teamId: "tigres" })).toBe(false);
  });
});

describe("esquemas", () => {
  const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  it("alineación: al menos uno, un capitán, sin repetidos", () => {
    const j = (n: number, capitan = false) => ({ userId: uuid(n), titular: true, numero: n, capitan });
    expect(alineacionSchema.safeParse({ matchId: uuid(0), teamId: uuid(0), jugadores: [j(1, true), j(2)] }).success).toBe(true);
    expect(alineacionSchema.safeParse({ matchId: uuid(0), teamId: uuid(0), jugadores: [] }).success).toBe(false);
    expect(alineacionSchema.safeParse({ matchId: uuid(0), teamId: uuid(0), jugadores: [j(1, true), j(2, true)] }).success).toBe(false);
    expect(alineacionSchema.safeParse({ matchId: uuid(0), teamId: uuid(0), jugadores: [j(1), j(1)] }).success).toBe(false);
  });

  it("el token del link de WhatsApp", () => {
    expect(contestarPorLinkSchema.safeParse({ token: "abcDEF123_-", userId: uuid(1), respuesta: "VA" }).success).toBe(true);
    expect(contestarPorLinkSchema.safeParse({ token: "../x", userId: uuid(1), respuesta: "VA" }).success).toBe(false);
  });
});
