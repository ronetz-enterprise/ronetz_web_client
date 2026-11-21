import { z } from "zod";
import { organizationCapabilities } from "@/features/memberships";
import type { Membership } from "@/features/memberships";

export const memberSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  organizationId: z.uuid(),
  role: z.literal("OWNER"),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type OrgMember = z.infer<typeof memberSchema>;
export type MemberAction = "suspend" | "reactivate" | "revoke";

export const roleLabel = { OWNER: "Propriétaire" } as const;
export const statusLabel = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
} as const;
export const statusTone = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  REVOKED: "neutral",
} as const;

export const actionLabel: Record<MemberAction, string> = {
  suspend: "Suspendre",
  reactivate: "Réactiver",
  revoke: "Retirer l’accès",
};

/** Règles de l'ancien front : on ne retire jamais le dernier propriétaire actif. */
export function memberActions(
  active: Membership,
  target: OrgMember,
  members: OrgMember[],
) {
  const allowed =
    organizationCapabilities(active).canManageMembers &&
    target.organizationId === active.organizationId;
  const owners = members.filter(
    (m) =>
      m.organizationId === active.organizationId &&
      m.role === "OWNER" &&
      m.status === "ACTIVE",
  ).length;
  return {
    suspend: allowed && target.status === "ACTIVE" && owners > 1,
    reactivate: allowed && target.status === "SUSPENDED",
    revoke: allowed && target.status !== "REVOKED" && owners > 1,
  };
}

/** Vous d'abord, puis par date d'arrivée. */
export function sortMembers(members: OrgMember[], currentUserId?: string) {
  return [...members].sort(
    (a, b) =>
      Number(b.userId === currentUserId) - Number(a.userId === currentUserId) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export function actionPath(base: string, userId: string, action: MemberAction) {
  const suffix =
    action === "suspend"
      ? "/suspension"
      : action === "reactivate"
        ? "/reactivation"
        : "";
  return `${base}/${userId}${suffix}`;
}
