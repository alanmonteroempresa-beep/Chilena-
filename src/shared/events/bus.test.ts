import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBus, emit, on } from "./bus";

describe("bus de eventos", () => {
  beforeEach(() => __resetBus());

  it("entrega el payload a los listeners", async () => {
    const handler = vi.fn();
    on("match.validated", handler);
    await emit("match.validated", { matchId: "m1", tournamentId: "t1", roundId: "r1" });
    expect(handler).toHaveBeenCalledWith({ matchId: "m1", tournamentId: "t1", roundId: "r1" });
  });

  it("un listener que falla no tumba a los demás", async () => {
    const ok = vi.fn();
    on("post.created", () => {
      throw new Error("boom");
    });
    on("post.created", ok);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await emit("post.created", { postId: "p1" });
    expect(ok).toHaveBeenCalled();
  });
});
