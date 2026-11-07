import { describe, expect, it } from "vitest";
import { reglaCuentaReclamada } from "../server/reglas";

// PERMISOS §2: cualquier cuenta reclamada; nadie vota por sí mismo
describe("permisos de votaciones y quiniela", () => {
  const reclamadas = new Set(["lupe", "chicharo"]);
  const regla = reglaCuentaReclamada(async (u) => reclamadas.has(u));

  it("vota una cuenta reclamada", async () => {
    expect(await regla("lupe", { targetUserId: "chicharo" })).toBe(true);
    expect(await regla("lupe", { matchId: "m1" })).toBe(true);
  });
  it("un perfil sin reclamar no vota ni pronostica", async () => {
    expect(await regla("sin-reclamar", { targetUserId: "chicharo" })).toBe(false);
  });
  it("nadie vota por sí mismo", async () => {
    expect(await regla("chicharo", { targetUserId: "chicharo" })).toBe(false);
  });
});
