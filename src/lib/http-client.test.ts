import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { createHttpClient } from "./http-client";

const request = createHttpClient("http://localhost:8080");
afterEach(() => vi.unstubAllGlobals());

function stub(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

it("lit du JSON et gère 204", async () => {
  stub(
    new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    }),
  );
  await expect(request("/api/x")).resolves.toEqual({ ok: true });
  stub(new Response(null, { status: 204 }));
  await expect(request("/api/x")).resolves.toBeUndefined();
});

it("transforme un Problem Details en ApiError avec l'identifiant de corrélation", async () => {
  stub(
    new Response(JSON.stringify({ title: "Conflit", status: 409 }), {
      status: 409,
      headers: {
        "Content-Type": "application/problem+json",
        "X-Correlation-Id": "abc",
      },
    }),
  );
  await expect(request("/api/x")).rejects.toMatchObject({
    kind: "http",
    status: 409,
    correlationId: "abc",
  });
});

it("refuse un chemin absolu pour ne jamais envoyer de jeton ailleurs", async () => {
  await expect(request("//evil.test/x")).rejects.toThrow(
    "Chemin API relatif requis.",
  );
});

it("signale une panne réseau", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fail")));
  await expect(request("/api/x")).rejects.toBeInstanceOf(ApiError);
  await expect(request("/api/x")).rejects.toMatchObject({ kind: "network" });
});
