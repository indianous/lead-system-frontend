import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "./providers";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("Providers", () => {
  it("renders children without throwing", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(
      <Providers>
        <p>conteúdo protegido</p>
      </Providers>,
    );

    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });
});
