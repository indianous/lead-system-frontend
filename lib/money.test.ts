import { describe, expect, it } from "vitest";
import { centsToReaisInput, reaisInputToCents } from "./money";

describe("centsToReaisInput", () => {
  it("converts cents to a decimal reais string", () => {
    expect(centsToReaisInput(150000)).toBe("1500.00");
    expect(centsToReaisInput(50)).toBe("0.50");
    expect(centsToReaisInput(0)).toBe("0.00");
  });

  it("returns an empty string for null/undefined", () => {
    expect(centsToReaisInput(null)).toBe("");
    expect(centsToReaisInput(undefined)).toBe("");
  });
});

describe("reaisInputToCents", () => {
  it("converts a dot-decimal reais string to cents", () => {
    expect(reaisInputToCents("1500.00")).toBe(150000);
    expect(reaisInputToCents("0.5")).toBe(50);
  });

  it("converts a comma-decimal reais string to cents", () => {
    expect(reaisInputToCents("1500,00")).toBe(150000);
  });

  it("rounds fractional cents", () => {
    expect(reaisInputToCents("10.999")).toBe(1100);
  });

  it("returns null for empty input", () => {
    expect(reaisInputToCents("")).toBeNull();
    expect(reaisInputToCents(undefined)).toBeNull();
  });
});
