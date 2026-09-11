import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./navigation";

describe("NAV_ITEMS", () => {
  it("includes the main app sections", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/",
        "/leads",
        "/inbox",
        "/prospecting",
        "/products",
        "/users",
        "/metrics",
        "/profile",
      ]),
    );
  });

  it("has a non-empty label and icon for every item", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
    }
  });

  it("has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every href is an absolute app path", () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });
});
