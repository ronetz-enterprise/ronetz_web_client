import { describe, expect, it } from "vitest";
import { membershipSchema } from "@/features/memberships";
import {
  actionPath,
  memberActions,
  memberSchema,
  sortMembers,
} from "./members";

const orgA = "00000000-0000-4000-8000-00000000000a";
const orgB = "00000000-0000-4000-8000-00000000000b";
const active = membershipSchema.parse({
  membershipId: "00000000-0000-4000-8000-0000000000c1",
  organizationId: orgA,
  organizationName: "Cyber Akwa",
  organizationStatus: "ACTIVE",
  role: "OWNER",
  membershipStatus: "ACTIVE",
  permissions: ["ORGANIZATION_READ", "MEMBERSHIP_READ", "MEMBERSHIP_MANAGE"],
});
const first = memberSchema.parse({
  id: orgA,
  userId: "00000000-0000-4000-8000-000000000099",
  organizationId: orgA,
  role: "OWNER",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const second = {
  ...first,
  id: orgB,
  userId: "00000000-0000-4000-8000-000000000077",
  createdAt: "2026-02-01T00:00:00Z",
};

describe("memberActions", () => {
  it("protège le dernier propriétaire actif", () => {
    expect(memberActions(active, first, [first])).toEqual({
      suspend: false,
      reactivate: false,
      revoke: false,
    });
    expect(memberActions(active, first, [first, second])).toEqual({
      suspend: true,
      reactivate: false,
      revoke: true,
    });
  });
  it("suit le cycle de vie et refuse une cible d’une autre organisation", () => {
    expect(
      memberActions(active, { ...first, status: "SUSPENDED" }, [first, second]),
    ).toEqual({ suspend: false, reactivate: true, revoke: true });
    expect(
      memberActions(active, { ...first, status: "REVOKED" }, [first, second]),
    ).toEqual({ suspend: false, reactivate: false, revoke: false });
    expect(
      memberActions(active, { ...first, organizationId: orgB }, [
        first,
        second,
      ]),
    ).toEqual({ suspend: false, reactivate: false, revoke: false });
  });
  it("n’offre aucune action sans la permission de gérer les membres", () => {
    const readOnly = { ...active, permissions: ["MEMBERSHIP_READ"] };
    expect(memberActions(readOnly, first, [first, second]).suspend).toBe(false);
  });
});

describe("sortMembers", () => {
  it("place le membre courant d’abord, puis par date d’arrivée", () => {
    const third = {
      ...second,
      id: "00000000-0000-4000-8000-00000000000c",
      userId: "00000000-0000-4000-8000-000000000055",
      createdAt: "2026-01-15T00:00:00Z",
    };
    expect(
      sortMembers([second, third, first], second.userId).map((m) => m.id),
    ).toEqual([second.id, first.id, third.id]);
  });
});

describe("actionPath", () => {
  it("compose les routes du backend", () => {
    const base = "/api/organizations/o/memberships";
    expect(actionPath(base, "u", "suspend")).toBe(`${base}/u/suspension`);
    expect(actionPath(base, "u", "reactivate")).toBe(`${base}/u/reactivation`);
    expect(actionPath(base, "u", "revoke")).toBe(`${base}/u`);
  });
});
