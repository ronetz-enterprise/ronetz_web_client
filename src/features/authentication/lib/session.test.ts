import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";
import { createSession } from "./session";

function sessionWith(refresh: () => Promise<never>) {
  const api = {
    login: vi.fn(),
    refresh: vi.fn(refresh),
    logout: vi.fn(),
    register: vi.fn(),
  };
  return createSession({
    api: api as never,
    request: vi.fn() as never,
    clearCache: () => {},
  });
}

describe("restauration de la session au chargement", () => {
  it.each([401, 403])(
    "un rafraîchissement refusé (%i) renvoie vers la connexion",
    async (status) => {
      const session = sessionWith(() =>
        Promise.reject(new ApiError("http", status)),
      );
      await session.restore();
      expect(session.getSnapshot().status).toBe("anonymous");
    },
  );

  it("une panne réseau reste une indisponibilité passagère", async () => {
    const session = sessionWith(() => Promise.reject(new ApiError("network")));
    await session.restore();
    expect(session.getSnapshot().status).toBe("unavailable");
  });

  it("une erreur serveur (503) reste une indisponibilité passagère", async () => {
    const session = sessionWith(() =>
      Promise.reject(new ApiError("http", 503)),
    );
    await session.restore();
    expect(session.getSnapshot().status).toBe("unavailable");
  });
});
