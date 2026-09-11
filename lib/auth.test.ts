import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeCredentials } from "./auth";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("authorizeCredentials", () => {
  it("returns null when email or password is missing", async () => {
    await expect(authorizeCredentials(undefined)).resolves.toBeNull();
    await expect(authorizeCredentials({ email: "a@a.com" })).resolves.toBeNull();
    await expect(authorizeCredentials({ password: "123" })).resolves.toBeNull();
  });

  it("posts credentials to the backend login endpoint", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", name: "Ana", email: "ana@empresa.com", token: "jwt-token", role: "Salesperson" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await authorizeCredentials({ email: "ana@empresa.com", password: "senha123" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: "ana@empresa.com", password: "senha123" }),
      }),
    );
  });

  it("maps a successful response to a NextAuth user", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", name: "Ana", email: "ana@empresa.com", token: "jwt-token", role: "Salesperson" }),
    }) as unknown as typeof fetch;

    const user = await authorizeCredentials({ email: "ana@empresa.com", password: "senha123" });

    expect(user).toEqual({
      id: "1",
      name: "Ana",
      email: "ana@empresa.com",
      accessToken: "jwt-token",
      role: "Salesperson",
    });
  });

  it("returns null when the backend rejects the credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;

    const user = await authorizeCredentials({ email: "ana@empresa.com", password: "errada" });

    expect(user).toBeNull();
  });
});
