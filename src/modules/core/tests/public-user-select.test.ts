import { describe, expect, it } from "vitest";
import { PRIVATE_USER_FIELDS, publicUserSelect } from "../server/queries";

describe("publicUserSelect (regla 8: datos privados nunca a lo público)", () => {
  it.each(PRIVATE_USER_FIELDS)("no incluye %s", (field) => {
    expect(Object.keys(publicUserSelect)).not.toContain(field);
  });
});
