import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./api-client";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("apiFetch", () => {
  it("builds the URL from NEXT_PUBLIC_BACKEND_API_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/api/users");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/users",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends Authorization: Bearer <token> when a token is informed", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/api/users", { token: "jwt-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/users",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt-token" }),
      }),
    );
  });

  it("does not send an Authorization header when no token is informed", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/api/products");

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("sends the body as JSON on POST/PUT", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/api/users", { method: "POST", body: { name: "Ana" } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/users",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Ana" }) }),
    );
  });

  it("throws ApiError with status and message from a non-ok response", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ message: "Já existe um usuário com esse e-mail" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/users", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 409,
      message: "Já existe um usuário com esse e-mail",
    });
    await expect(apiFetch("/api/users", { method: "POST", body: {} })).rejects.toBeInstanceOf(ApiError);
  });

  it("falls back to statusText when the error response has no JSON body", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("no body");
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch("/api/users")).rejects.toMatchObject({
      status: 500,
      message: "Internal Server Error",
    });
  });
});
