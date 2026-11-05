import { describe, expect, it } from "vitest";
import { assertCan, can, registerRule } from "../server/authz";

describe("authz", () => {
  it("niega todo lo que no tiene regla", async () => {
    expect(await can("u1", "match.validate")).toBe(false);
  });
  it("niega si no hay sesión", async () => {
    registerRule("post.create", async () => true);
    expect(await can(null, "post.create")).toBe(false);
  });
  it("aplica la regla registrada", async () => {
    registerRule("team.edit", async (_u, ctx) => ctx.teamId === "portales");
    expect(await can("u1", "team.edit", { teamId: "portales" })).toBe(true);
    await expect(assertCan("u1", "team.edit", { teamId: "tigres" })).rejects.toThrow("permiso");
  });
});
