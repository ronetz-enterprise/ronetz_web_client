import { describe, expect, it } from "vitest";
import {
  routerState,
  setupStage,
  routerInstruction,
  type Router,
} from "./router";

const base: Router = {
  id: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10",
  organizationId: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c11",
  siteId: null,
  name: "Routeur",
  vendor: "MikroTik",
  model: "hAP ax²",
  lifecycleStatus: "ACTIVE",
  provisioningStatus: "REGISTERED",
  connectivityStatus: "ONLINE",
  provisioningOperationId: "op-1",
  configurationArtifactId: "a-1",
  failureCode: null,
  pendingAction: null,
  lastSeenAt: null,
  createdAt: "2026-09-01T10:00:00+00:00",
  updatedAt: "2026-09-01T10:00:00+00:00",
};

describe("setupStage", () => {
  it("suit le parcours jusqu'au premier signal", () => {
    const fresh = {
      ...base,
      provisioningStatus: "NOT_REQUESTED",
      connectivityStatus: "UNKNOWN",
    } as const;
    expect(setupStage(fresh)).toEqual({ step: 1, state: "todo" });
    expect(
      setupStage({ ...fresh, provisioningStatus: "PENDING_ENROLLMENT" }),
    ).toEqual({ step: 2 });
    expect(setupStage({ ...fresh, provisioningStatus: "REGISTERED" })).toEqual({
      step: 3,
    });
    expect(setupStage(base)).toBeNull();
  });
});

describe("routerState", () => {
  it("décrit l'état sans jargon", () => {
    expect(routerState(base).label).toBe("En ligne");
    const waiting = { ...base, connectivityStatus: "UNKNOWN" } as const;
    expect(routerState(waiting).label).toBe("En attente du premier signal");
    expect(routerState({ ...base, lifecycleStatus: "SUSPENDED" }).label).toBe(
      "Suspendu",
    );
    const off = routerState(
      {
        ...base,
        connectivityStatus: "OFFLINE",
        lastSeenAt: "2026-09-01T14:05:00+00:00",
      },
      new Date("2026-09-01T18:00:00+00:00"),
      "UTC",
    );
    expect(off.label).toBe("Hors ligne depuis 14 h 05");
  });
  it("termine un état en cours par une consigne", () => {
    expect(
      routerInstruction({
        ...base,
        provisioningStatus: "NOT_REQUESTED",
        connectivityStatus: "UNKNOWN",
      }),
    ).toMatch(/Préparer mon script/);
    expect(routerInstruction({ ...base, pendingAction: "SUSPEND" })).toMatch(
      /Rien à faire/,
    );
  });
});

describe("nom du script du routeur", () => {
  it("est lisible, sans accent ni espace, et garde la commande d'import alignée", async () => {
    const { artifactFileName, importCommand } = await import("./router");
    const r = {
      id: "14eb1d1d-9823-42cc-9029-25a7dd5d00cd",
      name: "Entrée Makepe",
    };
    expect(artifactFileName(r)).toBe("ronetz-entree-makepe-00cd.rsc");
    expect(importCommand(r)).toBe(
      "/import file-name=ronetz-entree-makepe-00cd.rsc",
    );
    expect(artifactFileName({ ...r, name: "!!!" })).toBe("ronetz-00cd.rsc");
  });
});
