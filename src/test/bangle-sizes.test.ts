import { describe, expect, it } from "vitest";

import { BANGLE_SIZES } from "@/lib/bangle-sizes";

describe("bangle size options", () => {
  it("includes the five sizes requested for the store", () => {
    expect(BANGLE_SIZES).toEqual(["2.2", "2.4", "2.6", "2.8", "2.10"]);
  });
});