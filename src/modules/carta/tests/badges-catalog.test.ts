import { describe, expect, it } from "vitest";
import { BADGES } from "../badges.catalog";

describe("catálogo de insignias", () => {
  it("no repite códigos", () => {
    const codes = BADGES.map((b) => b.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("incluye las insignias de la marca", () => {
    const codes = BADGES.map((b) => b.code);
    expect(codes).toContain("DE_CHILENA");
    expect(codes).toContain("PIONERO");
  });
});
