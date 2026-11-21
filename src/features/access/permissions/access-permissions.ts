import type { Membership } from "@/features/memberships";
import {
  isFailedProjection,
  isTerminalGrant,
  type AccessGrant,
} from "../model/access-grant";

/**
 * Capacités du module `access`.
 *
 * Le backend exige une membership active, le rôle OWNER, une organisation et un site actifs.
 * Ces capacités reflètent ce contrat ; l'autorisation réelle reste celle du serveur (403).
 * Aucune capacité ne permet de relire un mot de passe : le backend n'a aucun endpoint pour cela.
 */
export function accessPermissions(active: Membership, grant?: AccessGrant) {
  const readable =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = readable && active.role === "OWNER";
  const own = owner && grant?.organizationId === active.organizationId;
  const terminal = grant ? isTerminalGrant(grant) : false;
  // Une activation en échec doit être relancée avant de suspendre ou reprendre. L'annulation
  // reste possible : elle ne fait que restreindre.
  const blocked = grant ? isFailedProjection(grant.projectionStatus) : false;
  return {
    canViewAccessGrants: owner,
    canViewAccessDetails: owner,
    canCreateManualAccess: owner,
    canSuspendAccess: own && grant.status === "ACTIVE" && !blocked,
    canResumeAccess: own && grant.status === "SUSPENDED" && !blocked,
    canRevokeAccess: own && !terminal,
    canRetryProvisioning: own && blocked && !terminal,
  };
}

export type AccessPermissions = ReturnType<typeof accessPermissions>;
