import { z } from "zod";

/** Projection HTTP de `AccessGrantView`. Aucune valeur de cette vue n'est un secret. */
const statusText = z.string().min(1);

export const accessPolicySchema = z.object({
  validitySeconds: z.number().int().min(0),
  dataAllowanceBytes: z.number().int().min(0).nullable(),
  downloadLimitBps: z.number().int().min(0).nullable(),
  uploadLimitBps: z.number().int().min(0).nullable(),
  maxConcurrentSessions: z.number().int().min(0),
});
export type AccessPolicy = z.infer<typeof accessPolicySchema>;

export const accessGrantSchema = z.object({
  accessGrantId: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  subjectType: statusText,
  subjectId: z.uuid().nullable(),
  sourceType: statusText,
  sourceId: z.uuid().nullable(),
  policy: accessPolicySchema,
  activationMode: statusText,
  status: statusText,
  projectionStatus: statusText,
  issuedByIdentityId: z.uuid().nullable(),
  issuedAt: z.iso.datetime({ offset: true }),
  activatedAt: z.iso.datetime({ offset: true }).nullable(),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  revokedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
  username: z.string().min(1).nullable(),
});
export type AccessGrant = z.infer<typeof accessGrantSchema>;

export const accessGrantPageSchema = z.object({
  content: z.array(accessGrantSchema),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  totalElements: z.number().int().min(0),
});
export type AccessGrantPage = z.infer<typeof accessGrantPageSchema>;

export const accessGrantStatusLabels: Record<string, string> = {
  PENDING_PROVISIONING: "En préparation",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  EXPIRED: "Expiré",
  QUOTA_EXHAUSTED: "Forfait épuisé",
  REVOKED: "Annulé",
  PROVISIONING_FAILED: "Échec de préparation",
};

export const projectionStatusLabels: Record<string, string> = {
  NOT_REQUESTED: "Pas encore envoyé",
  PENDING: "Activation en cours",
  APPLIED: "Prêt sur le réseau",
  REMOVAL_PENDING: "Retrait en cours",
  REMOVED: "Retiré du réseau",
  FAILED: "Problème d’activation",
};

export const accessSourceLabels: Record<string, string> = {
  PAID_ORDER: "Achat d’un client",
  VOUCHER: "Ticket",
  MANUAL_GRANT: "Créé par vous",
  ORGANIZATION_USER: "Membre de l’équipe",
  PROMOTIONAL_CAMPAIGN: "Promotion",
};

export const accessSubjectLabels: Record<string, string> = {
  ANONYMOUS: "Client sans compte",
  IDENTITY: "Utilisateur Ronetz",
  SUBSCRIBER: "Abonné",
  DEVICE: "Appareil",
};

const terminalStatuses = new Set(["EXPIRED", "QUOTA_EXHAUSTED", "REVOKED"]);

export function accessGrantLabel(
  dictionary: Record<string, string>,
  value: string,
) {
  // Jamais un code du serveur à l'écran : un mot neutre si le libellé manque.
  return dictionary[value] ?? "Autre";
}

export type AccessTone =
  "success" | "warning" | "pending" | "danger" | "neutral";

export type AccessDisplayState = {
  label: string;
  tone: AccessTone;
  /** L'accès permet au client de se connecter en ce moment. */
  usable: boolean;
};

export const accessStatusTones: Record<string, AccessTone> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  PENDING_PROVISIONING: "pending",
  EXPIRED: "neutral",
  QUOTA_EXHAUSTED: "neutral",
  REVOKED: "danger",
  PROVISIONING_FAILED: "danger",
};

export function isTerminalGrant(grant: AccessGrant) {
  return terminalStatuses.has(grant.status);
}
export const isAppliedProjection = (status: string) => status === "APPLIED";
export const isFailedProjection = (status: string) => status === "FAILED";

/**
 * État unique montré au gérant : l'état de l'accès et son état sur le réseau sont réunis
 * (un accès « actif » pas encore prêt sur le réseau est « en activation »).
 */
export function accessDisplayState(
  grant: AccessGrant,
  now?: number,
): AccessDisplayState {
  if (isFailedProjection(grant.projectionStatus)) {
    if (grant.status === "ACTIVE" || grant.status === "PENDING_PROVISIONING")
      return { label: "Problème d’activation", tone: "danger", usable: false };
    if (grant.status === "EXPIRED")
      return { label: "Expiré", tone: "neutral", usable: false };
    return {
      label: `${accessGrantLabel(accessGrantStatusLabels, grant.status)} · réseau pas à jour`,
      tone: "warning",
      usable: false,
    };
  }
  // Temps écoulé mais pas encore clos par le serveur : on le montre déjà expiré, comme le filtre.
  if (
    grant.status === "ACTIVE" &&
    now !== undefined &&
    grant.expiresAt &&
    new Date(grant.expiresAt).getTime() <= now
  )
    return { label: "Expiré", tone: "neutral", usable: false };
  if (grant.status === "ACTIVE")
    return isAppliedProjection(grant.projectionStatus)
      ? { label: "Actif", tone: "success", usable: true }
      : { label: "Activation en cours", tone: "pending", usable: false };
  if (grant.status === "PENDING_PROVISIONING")
    return { label: "En préparation", tone: "pending", usable: false };
  return {
    label: accessGrantLabel(accessGrantStatusLabels, grant.status),
    tone: accessStatusTones[grant.status] ?? "neutral",
    usable: false,
  };
}

/** Part écoulée de la validité entre activation et expiration réelles (le volume n'est pas exposé). */
export function validityUsage(grant: AccessGrant, now = Date.now()) {
  if (!grant.activatedAt || !grant.expiresAt) return null;
  const start = new Date(grant.activatedAt).getTime();
  const total = new Date(grant.expiresAt).getTime() - start;
  if (total <= 0) return null;
  return { elapsed: Math.min(total, Math.max(0, now - start)), total };
}

/** « Expire bientôt » : actif et fin dans l'heure. */
export const EXPIRING_SOON_MS = 60 * 60 * 1000;
export type AccessFilter =
  "all" | "active" | "expiring" | "expired" | "suspended";

export function matchesFilter(
  grant: AccessGrant,
  filter: AccessFilter,
  now = Date.now(),
) {
  const expiresAt = grant.expiresAt
    ? new Date(grant.expiresAt).getTime()
    : null;
  const live =
    grant.status === "ACTIVE" && (expiresAt === null || expiresAt > now);
  switch (filter) {
    case "all":
      return true;
    case "active":
      return live;
    case "expiring":
      return live && expiresAt !== null && expiresAt - now <= EXPIRING_SOON_MS;
    case "expired":
      return (
        grant.status === "EXPIRED" ||
        grant.status === "QUOTA_EXHAUSTED" ||
        (grant.status === "ACTIVE" && expiresAt !== null && expiresAt <= now)
      );
    case "suspended":
      return grant.status === "SUSPENDED";
  }
}

export type ActivationGuidance = {
  tone: "info" | "success" | "danger";
  title: string;
  body: string;
};

/**
 * Chaque état d'activation sur le réseau se termine par une consigne claire au gérant.
 * Aucune consigne pour un accès terminé ou suspendu : l'état suffit.
 */
export function activationGuidance(
  grant: AccessGrant,
): ActivationGuidance | null {
  if (isTerminalGrant(grant) || grant.status === "SUSPENDED") return null;
  if (isFailedProjection(grant.projectionStatus))
    return {
      tone: "danger",
      title: "L’activation a échoué",
      body: "Le client ne peut pas encore se connecter. Appuyez sur « Relancer l’activation ». Si cela échoue encore, vérifiez que le routeur du site est allumé et connecté, puis réessayez.",
    };
  if (grant.status === "ACTIVE" && isAppliedProjection(grant.projectionStatus))
    return {
      tone: "success",
      title: "Activé sur le réseau",
      body: "Le client peut se connecter. Remettez-lui l’identifiant et le mot de passe que vous avez notés à la création.",
    };
  return {
    tone: "info",
    title: "Activation en cours",
    body: "Patientez quelques secondes : cette page se met à jour toute seule. Ne remettez pas encore l’accès au client.",
  };
}
