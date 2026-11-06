import { describe, expect, it } from "vitest";
import { can, registerRule } from "@/modules/core";
import { ACCIONES_DE_CUALQUIER_CUENTA, reglaCualquierCuenta } from "../server/reglas";
import { comentarioSchema, publicacionSchema, reaccionSchema, seguirSchema } from "../schemas";

// PERMISOS.md §1 Social
const activas = new Set(["lupe", "chicharo"]);
for (const a of ACCIONES_DE_CUALQUIER_CUENTA) registerRule(a, reglaCualquierCuenta(async (u) => activas.has(u)));

describe("permisos sociales (PERMISOS §1)", () => {
  it("echar 🔥, comentar, publicar, seguir y reportar: cualquier cuenta activa", async () => {
    for (const a of ACCIONES_DE_CUALQUIER_CUENTA) {
      expect(await can("lupe", a)).toBe(true);
      expect(await can("borrada", a)).toBe(false);
    }
  });

  it("el visitante (sin sesión) no puede", async () => {
    for (const a of ACCIONES_DE_CUALQUIER_CUENTA) expect(await can(null, a)).toBe(false);
  });

  it("nadie se sigue a sí mismo", async () => {
    expect(await can("lupe", "user.follow", { targetUserId: "lupe" })).toBe(false);
    expect(await can("lupe", "user.follow", { targetUserId: "chicharo" })).toBe(true);
  });
});

describe("esquemas", () => {
  const uuid = "00000000-0000-4000-8000-000000000000";
  it("la porra: texto con algo y en un solo lugar", () => {
    expect(comentarioSchema.safeParse({ postId: uuid, texto: "  ¡Grande compadre!  " }).data?.texto).toBe("¡Grande compadre!");
    expect(comentarioSchema.safeParse({ postId: uuid, texto: "   " }).success).toBe(false);
    expect(comentarioSchema.safeParse({ postId: uuid, muroDe: uuid, texto: "x" }).success).toBe(false);
    expect(comentarioSchema.safeParse({ postId: uuid, texto: "x".repeat(501) }).success).toBe(false);
  });

  it("publicar, reaccionar y seguir", () => {
    expect(publicacionSchema.safeParse({ texto: "¿Vas el domingo?" }).success).toBe(true);
    expect(reaccionSchema.safeParse({ postId: uuid, tipo: "FUEGO" }).success).toBe(true);
    expect(reaccionSchema.safeParse({ postId: uuid, tipo: "LIKE" }).success).toBe(false);
    expect(seguirSchema.safeParse({ equipo: uuid, seguir: true }).success).toBe(true);
    expect(seguirSchema.safeParse({ seguir: true }).success).toBe(false);
  });
});
