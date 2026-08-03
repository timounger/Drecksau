/**
 * Tests for mixing colours.
 *
 * @module
 * @remarks
 * Small, but the snow line rests on it: both views fade ground into snow with
 * this one function, and a fade that quietly did nothing would leave a hard
 * edge in two places at once.
 */
import { describe, expect, it } from "vitest";
import { blend } from "./palette";

describe("blending two colours", () => {
  it("gives back the ends untouched", () => {
    expect(blend("#123456", "#abcdef", 0)).toBe("#123456");
    expect(blend("#123456", "#abcdef", 1)).toBe("#abcdef");
  });

  it("meets in the middle", () => {
    expect(blend("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(blend("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });

  it("moves each channel on its own", () => {
    expect(blend("#00ff00", "#ff00ff", 0.5)).toBe("#808080");
  });

  it("holds a share that is out of range inside it", () => {
    expect(blend("#000000", "#ffffff", -1)).toBe("#000000");
    expect(blend("#000000", "#ffffff", 5)).toBe("#ffffff");
  });

  it("keeps two digits per channel", () => {
    // A channel that came out as one digit would shift every colour after it.
    expect(blend("#000000", "#0f0f0f", 1)).toBe("#0f0f0f");
    expect(blend("#000000", "#101010", 0.5)).toBe("#080808");
  });
});
