import { describe, expect, it } from "vitest";
import { can, registerRule } from "@/modules/core";
import { reglaAdminDeLiga, type RolDeLiga } from "../server/reglas";

// PERMISOS.md §4 · Liga: "Validar resultado" es de Admin y Dueño
const roles: Record<string, RolDeLiga> = { "tono:ldi": "DUENO", "lara:ldi": "ADMINISTRADOR", "gestor:ldi": "GESTOR" };
registerRule("match.validate", reglaAdminDeLiga(async (u, l) => roles[`${u}:${l}`] ?? null));

describe("permisos de la liga (PERMISOS §4)", () => {
  it("valida el dueño o un administrador de ESA liga; el gestor no", async () => {
    expect(await can("tono", "match.validate", { leagueId: "ldi" })).toBe(true);
    expect(await can("lara", "match.validate", { leagueId: "ldi" })).toBe(true);
    expect(await can("gestor", "match.validate", { leagueId: "ldi" })).toBe(false);
    expect(await can("tono", "match.validate", { leagueId: "otra" })).toBe(false);
    expect(await can("tono", "match.validate")).toBe(false);
  });
});
