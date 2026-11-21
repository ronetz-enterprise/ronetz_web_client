import { z } from "zod";
import type { Membership } from "../queries/current-memberships";

export const memberSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  organizationId: z.uuid(),
  role: z.literal("OWNER"),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type Member = z.infer<typeof memberSchema>;
export type MemberAction = "suspend" | "reactivate" | "revoke";

export const addMemberSchema = z.object({
  userId: z.uuid("Saisissez un UUID utilisateur valide."),
});

export function organizationCapabilities(active: Membership) {
  const ready =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  return {
    canViewOrganization:
      ready && active.permissions.includes("ORGANIZATION_READ"),
    canViewMembers: ready && active.permissions.includes("MEMBERSHIP_READ"),
    canManageMembers: ready && active.permissions.includes("MEMBERSHIP_MANAGE"),
    canInviteMembers: false,
    canChangeRoles: false,
    canEditOrganization: false,
  };
}

export const memberStatusLabel = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
};
