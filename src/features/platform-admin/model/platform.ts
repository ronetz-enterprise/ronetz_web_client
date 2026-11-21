import { z } from "zod";

/**
 * Modèle de l'administration plateforme : schémas des réponses du backend, permissions,
 * libellés en français courant. Un terme exact (celui du backend) reste disponible dans
 * `*Hints` pour l'infobulle ou le détail, jamais comme libellé principal.
 */

export const platformPermissions = {
  read: "platform:read",
  organizationRead: "platform:organization:read",
  organizationSuspend: "platform:organization:suspend",
  organizationReactivate: "platform:organization:reactivate",
  networkRead: "platform:network:read",
  auditRead: "platform:audit:read",
  withdrawalApprove: "platform:withdrawal:approve",
  paymentReconcile: "platform:payment:reconcile",
} as const;

const instant = z.iso.datetime({ offset: true });

export const platformSessionSchema = z.object({
  userId: z.uuid(),
  administrator: z.boolean(),
  permissions: z.array(z.string()),
});
export type PlatformSession = z.infer<typeof platformSessionSchema>;

export const liveTotalsSchema = z.object({
  organizations: z.number().int().min(0),
  activeOrganizations: z.number().int().min(0),
  suspendedOrganizations: z.number().int().min(0),
  closedOrganizations: z.number().int().min(0),
  sites: z.number().int().min(0),
  activeSites: z.number().int().min(0),
  routers: z.number().int().min(0),
  routersOnline: z.number().int().min(0),
  routersOffline: z.number().int().min(0),
  routersUnknownConnectivity: z.number().int().min(0),
});

/** Chiffres consolidés : sans devise unique, le backend ne renvoie ni montant ni devise. */
export const projectedTotalsSchema = z.object({
  organizations: z.number().int().min(0),
  activeOrganizations: z.number().int().min(0),
  suspendedOrganizations: z.number().int().min(0),
  sites: z.number().int().min(0),
  activeAccesses: z.number().int().min(0),
  purchases: z.number().int().min(0),
  confirmedPayments: z.number().int().min(0),
  currency: z.string().nullable(),
  grossRevenue: z.number().nullable(),
  mixedCurrencies: z.array(z.string()).nullable(),
  dataLastUpdatedAt: instant.nullable(),
});

export const administrativeActionSchema = z.object({
  id: z.uuid(),
  actionType: z.string(),
  targetType: z.string(),
  targetId: z.uuid(),
  organizationId: z.uuid().nullable(),
  requestedBy: z.uuid(),
  approvedBy: z.uuid().nullable(),
  reason: z.string().nullable(),
  status: z.string(),
  idempotencyKey: z.string(),
  requestedAt: instant,
  completedAt: instant.nullable(),
  failureCode: z.string().nullable(),
  failureReason: z.string().nullable(),
  correlationId: z.string().nullable(),
  version: z.number().int().min(0),
});
export type AdministrativeAction = z.infer<typeof administrativeActionSchema>;

export const dashboardSchema = z.object({
  live: liveTotalsSchema,
  projected: projectedTotalsSchema,
  recentActions: z.array(administrativeActionSchema),
  generatedAt: instant,
});
export type PlatformDashboard = z.infer<typeof dashboardSchema>;

export const organizationStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
]);
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;

export const organizationSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  currency: z.string(),
  status: organizationStatusSchema,
  suspensionReason: z.string().nullable(),
  suspendedAt: instant.nullable(),
  closedAt: instant.nullable(),
  createdAt: instant,
  updatedAt: instant,
});
export type PlatformOrganization = z.infer<typeof organizationSummarySchema>;

export const siteSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  city: z.string(),
  status: organizationStatusSchema,
  createdAt: instant,
  updatedAt: instant,
});
export type PlatformSite = z.infer<typeof siteSummarySchema>;

export const connectivityStatusSchema = z.enum([
  "ONLINE",
  "OFFLINE",
  "UNKNOWN",
]);
export const routerSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid().nullable(),
  name: z.string(),
  vendor: z.string().nullable(),
  model: z.string().nullable(),
  lifecycleStatus: organizationStatusSchema,
  provisioningStatus: z.string(),
  connectivityStatus: connectivityStatusSchema,
  failureCode: z.string().nullable(),
  lastSeenAt: instant.nullable(),
  createdAt: instant,
  updatedAt: instant,
});
export type PlatformRouter = z.infer<typeof routerSummarySchema>;

export const auditEntrySchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  organizationId: z.uuid().nullable(),
  actor: z.object({
    type: z.string(),
    id: z.uuid().nullable(),
    displayNameSnapshot: z.string().nullable(),
  }),
  action: z.string(),
  target: z.object({
    resourceType: z.string().nullable(),
    resourceId: z.string().nullable(),
    displayNameSnapshot: z.string().nullable(),
  }),
  result: z.string(),
  severity: z.string(),
  channel: z.string(),
  source: z.string(),
  reason: z.string().nullable(),
  correlationId: z.string().nullable(),
  requestId: z.string().nullable(),
  sessionId: z.uuid().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  occurredAt: instant,
  recordedAt: instant,
  metadata: z.record(z.string(), z.string()),
  schemaVersion: z.number().int().min(0),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const organizationDetailSchema = organizationSummarySchema.extend({
  sites: z.array(siteSummarySchema),
  routers: z.object({
    total: z.number().int().min(0),
    online: z.number().int().min(0),
    offline: z.number().int().min(0),
    unknownConnectivity: z.number().int().min(0),
  }),
  recentAuditEntries: z.array(auditEntrySchema),
});
export type PlatformOrganizationDetail = z.infer<
  typeof organizationDetailSchema
>;

function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    content: z.array(item),
    page: z.number().int().min(0),
    size: z.number().int().min(1),
    totalElements: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  });
}
export const organizationPageSchema = pageSchema(organizationSummarySchema);
export const sitePageSchema = pageSchema(siteSummarySchema);
export const routerPageSchema = pageSchema(routerSummarySchema);
export const auditPageSchema = pageSchema(auditEntrySchema);

export const withdrawalSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  network: z.string(),
  country: z.string(),
  maskedMsisdn: z.string(),
  recipientName: z.string(),
  status: z.string(),
  requestedBy: z.uuid().nullable(),
  requestedAt: instant,
  decidedBy: z.uuid().nullable(),
  decidedAt: instant.nullable(),
  decisionReason: z.string().nullable(),
  providerTransferId: z.string().nullable(),
  completedAt: instant.nullable(),
  failureReason: z.string().nullable(),
});
export type PlatformWithdrawal = z.infer<typeof withdrawalSchema>;
export const withdrawalPageSchema = pageSchema(withdrawalSchema);

export const paymentAnomalySchema = z.object({
  eventId: z.uuid(),
  paymentId: z.uuid().nullable(),
  purchaseId: z.uuid().nullable(),
  code: z.string(),
  occurredAt: instant,
  correlationId: z.string().nullable(),
  status: z.string(),
  reviewedBy: z.uuid().nullable(),
  reviewedAt: instant.nullable(),
  resolvedBy: z.uuid().nullable(),
  resolvedAt: instant.nullable(),
  resolution: z.string().nullable(),
});
export type PaymentAnomaly = z.infer<typeof paymentAnomalySchema>;

// ── Libellés ────────────────────────────────────────────────────────────────
export type Tone = "success" | "warning" | "danger" | "neutral";

/** Un libellé jamais inventé : une valeur inconnue est rendue lisible, pas traduite au hasard. */
export function humanize(value: string) {
  const text = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "—";
}

export function label(dictionary: Record<string, string>, value: string) {
  return dictionary[value] ?? humanize(value);
}

export const organizationStatusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Fermée",
};
export const organizationStatusTones: Record<OrganizationStatus, Tone> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  CLOSED: "neutral",
};
export const siteStatusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CLOSED: "Fermé",
};
export const routerStateLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "En service",
  SUSPENDED: "Suspendu",
  CLOSED: "Retiré",
};
export const connectivityLabels = {
  ONLINE: "En ligne",
  OFFLINE: "Hors ligne",
  UNKNOWN: "Pas de nouvelles",
} as const;
export const connectivityTones: Record<keyof typeof connectivityLabels, Tone> =
  {
    ONLINE: "success",
    OFFLINE: "danger",
    UNKNOWN: "neutral",
  };

/** « Provisionnement » côté backend : pour l'équipe, c'est la mise en service du routeur. */
export const setupLabels: Record<string, string> = {
  NOT_REQUESTED: "Pas demandée",
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  FAILED: "En échec",
};
export const setupTones: Record<string, Tone> = {
  COMPLETED: "success",
  FAILED: "danger",
  PENDING: "warning",
  IN_PROGRESS: "warning",
};
export const setupHint = "Provisionnement du routeur";
export const consolidatedHint =
  "Projection : chiffres reconstruits à partir des événements, avec leur propre date de mise à jour.";

export const actionTypeLabels: Record<string, string> = {
  ORGANIZATION_SUSPEND: "Suspension d'une organisation",
  ORGANIZATION_REACTIVATE: "Réactivation d'une organisation",
  ORGANIZATION_CLOSE: "Fermeture d'une organisation",
  USER_SUSPEND: "Suspension d'un utilisateur",
  ACCESS_REVOKE: "Retrait d'un accès",
  ROUTER_REBOOT: "Redémarrage d'un routeur",
  ROUTER_PROVISION: "Mise en service d'un routeur",
  PAYMENT_RECONCILE: "Vérification d'un paiement",
  WITHDRAWAL_APPROVE: "Approbation d'un retrait",
  WITHDRAWAL_REJECT: "Refus d'un retrait",
};
export const actionStatusLabels: Record<string, string> = {
  REQUESTED: "Demandée",
  EXECUTING: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échouée",
  REJECTED: "Rejetée",
};
export const actionStatusTones: Record<string, Tone> = {
  COMPLETED: "success",
  FAILED: "danger",
  REJECTED: "danger",
  REQUESTED: "warning",
  EXECUTING: "warning",
};

export const auditResultLabels: Record<string, string> = {
  SUCCESS: "Réussie",
  FAILURE: "Échouée",
  DENIED: "Refusée",
};
export const auditResultTones: Record<string, Tone> = {
  SUCCESS: "success",
  FAILURE: "danger",
  DENIED: "warning",
};
export const auditSeverityLabels: Record<string, string> = {
  INFO: "Information",
  NOTICE: "À noter",
  WARNING: "Avertissement",
  ERROR: "Erreur",
  CRITICAL: "Critique",
};
export const auditSeverityTones: Record<string, Tone> = {
  INFO: "neutral",
  NOTICE: "neutral",
  WARNING: "warning",
  ERROR: "danger",
  CRITICAL: "danger",
};
export const auditSourceLabels: Record<string, string> = {
  AUTHENTICATION: "Connexion",
  IDENTITY: "Comptes",
  ORGANIZATION: "Organisations",
  MEMBERSHIP: "Membres",
  SITE: "Sites",
  ROUTER: "Routeurs",
  OFFER: "Offres",
  PURCHASE: "Achats",
  PAYMENT: "Paiements",
  ACCESS: "Accès",
  ACCOUNTING: "Comptabilité",
  SUPPORT: "Assistance",
  PLATFORM: "Administration",
  AUDIT: "Journal",
};
export const auditActorLabels: Record<string, string> = {
  USER: "Un utilisateur",
  SYSTEM: "Le système",
  SUPER_ADMIN: "L'équipe Ronetz",
};
export const auditActorOptions = ["USER", "SYSTEM", "SUPER_ADMIN"] as const;
export const auditResultOptions = ["SUCCESS", "FAILURE", "DENIED"] as const;
export const auditSeverityOptions = [
  "INFO",
  "NOTICE",
  "WARNING",
  "ERROR",
  "CRITICAL",
] as const;
export const auditSourceOptions = Object.keys(auditSourceLabels);

/** Libellés des actions du journal ; le code exact reste affiché dans le détail. */
export const auditActionLabels: Record<string, string> = {
  LOGIN_SUCCEEDED: "Connexion réussie",
  LOGIN_FAILED: "Connexion échouée",
  LOGOUT_SUCCEEDED: "Déconnexion",
  SESSION_REVOKED: "Session fermée",
  PASSWORD_CHANGED: "Mot de passe modifié",
  PASSWORD_RESET_REQUESTED: "Réinitialisation du mot de passe demandée",
  PASSWORD_RESET_COMPLETED: "Mot de passe réinitialisé",
  ACCOUNT_LOCKED: "Compte verrouillé",
  ACCESS_DENIED: "Accès refusé",
  IDENTITY_CREATED: "Compte créé",
  IDENTITY_ACTIVATED: "Compte activé",
  IDENTITY_SUSPENDED: "Compte suspendu",
  MEMBER_INVITED: "Membre invité",
  MEMBER_JOINED: "Membre arrivé",
  MEMBER_ROLE_CHANGED: "Rôle d'un membre modifié",
  MEMBER_SUSPENDED: "Membre suspendu",
  MEMBER_REMOVED: "Membre retiré",
  ORGANIZATION_CREATED: "Organisation créée",
  ORGANIZATION_RENAMED: "Organisation renommée",
  ORGANIZATION_SUSPENDED: "Organisation suspendue",
  ORGANIZATION_REACTIVATED: "Organisation réactivée",
  ORGANIZATION_CLOSED: "Organisation fermée",
  SITE_CREATED: "Site créé",
  SITE_UPDATED: "Site modifié",
  SITE_SUSPENDED: "Site suspendu",
  SITE_REACTIVATED: "Site réactivé",
  SITE_CLOSED: "Site fermé",
  ROUTER_CREATED: "Routeur ajouté",
  ROUTER_UPDATED: "Routeur modifié",
  ROUTER_PROVISIONING_REQUESTED: "Mise en service du routeur demandée",
  ROUTER_PROVISIONED: "Routeur mis en service",
  ROUTER_PROVISIONING_FAILED: "Mise en service du routeur échouée",
  ROUTER_SUSPENDED: "Routeur suspendu",
  ROUTER_REACTIVATED: "Routeur réactivé",
  ROUTER_SECRET_ROTATED: "Clé du routeur renouvelée",
  ROUTER_RECOVERY_REQUESTED: "Récupération du routeur demandée",
  ROUTER_REMOVED: "Routeur retiré",
  OFFER_CREATED: "Offre créée",
  OFFER_UPDATED: "Offre modifiée",
  OFFER_PRICE_CHANGED: "Prix d'une offre modifié",
  OFFER_ACTIVATED: "Offre publiée",
  OFFER_SUSPENDED: "Offre suspendue",
  OFFER_ARCHIVED: "Offre archivée",
  PAYMENT_INITIATED: "Paiement lancé",
  PAYMENT_CONFIRMED: "Paiement confirmé",
  PAYMENT_FAILED: "Paiement échoué",
  PAYMENT_RECONCILED: "Paiement vérifié",
  PAYMENT_REFUND_REQUESTED: "Remboursement demandé",
  PAYMENT_REFUNDED: "Paiement remboursé",
  PAYMENT_WEBHOOK_REJECTED: "Notification de paiement rejetée",
  ACCESS_CREATED: "Accès créé",
  ACCESS_PROVISIONED: "Accès activé sur le routeur",
  ACCESS_PROVISIONING_FAILED: "Activation de l'accès échouée",
  ACCESS_SUSPENDED: "Accès suspendu",
  ACCESS_REACTIVATED: "Accès réactivé",
  ACCESS_REVOKED: "Accès retiré",
  ACCESS_EXPIRED: "Accès expiré",
  LEDGER_TRANSACTION_POSTED: "Écriture comptable enregistrée",
  ACCOUNTING_ADJUSTMENT_CREATED: "Correction comptable",
  WITHDRAWAL_REQUESTED: "Retrait demandé",
  WITHDRAWAL_APPROVED: "Retrait approuvé",
  WITHDRAWAL_REJECTED: "Retrait refusé",
  WITHDRAWAL_PROCESSING_STARTED: "Retrait lancé",
  WITHDRAWAL_COMPLETED: "Retrait effectué",
  WITHDRAWAL_FAILED: "Retrait échoué",
  REFUND_POSTED: "Remboursement enregistré",
  SUPER_ADMIN_ACTION_EXECUTED: "Action de l'équipe Ronetz",
  CONFIGURATION_CHANGED: "Configuration modifiée",
  DATA_EXPORT_REQUESTED: "Export de données demandé",
  AUDIT_EXPORT_REQUESTED: "Export du journal demandé",
};

export const withdrawalStatusOptions = [
  "PENDING_APPROVAL",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
] as const;
export const withdrawalStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: "À décider",
  PROCESSING: "Retrait en cours",
  COMPLETED: "Effectué",
  FAILED: "Échoué",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  REVERSED: "Annulé par l'opérateur",
};
export const withdrawalStatusTones: Record<string, Tone> = {
  PENDING_APPROVAL: "warning",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  REJECTED: "danger",
  CANCELLED: "neutral",
  REVERSED: "danger",
};
export const networkLabels: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ORANGEMONEY: "Orange Money",
};

export const anomalyStatusLabels: Record<string, string> = {
  OPEN: "À traiter",
  REVIEWED: "Prise en charge",
  RESOLVED: "Résolue",
};
export const anomalyStatusTones: Record<string, Tone> = {
  OPEN: "danger",
  REVIEWED: "warning",
  RESOLVED: "success",
};
export const anomalyCodeLabels: Record<string, string> = {
  AMOUNT_MISMATCH: "Montant différent de celui de l'opérateur",
};

/** Un montant se lit en FCFA ; une autre devise garde son code ISO. */
export function currencyLabel(code: string) {
  return code === "XAF" || code === "XOF" ? "FCFA" : code;
}

// ── Permissions ─────────────────────────────────────────────────────────────
export function platformCapabilities(session: PlatformSession | undefined) {
  const granted = session?.permissions ?? [];
  const has = (permission: string) => granted.includes(permission);
  return {
    canViewPlatform: has(platformPermissions.read),
    canReadOrganizations: has(platformPermissions.organizationRead),
    canSuspendOrganization: has(platformPermissions.organizationSuspend),
    canReactivateOrganization: has(platformPermissions.organizationReactivate),
    canReadNetwork: has(platformPermissions.networkRead),
    canReadAudit: has(platformPermissions.auditRead),
    canApproveWithdrawals: has(platformPermissions.withdrawalApprove),
    canReconcilePayments: has(platformPermissions.paymentReconcile),
  };
}
export type PlatformCapabilities = ReturnType<typeof platformCapabilities>;

// ── Actions sensibles ───────────────────────────────────────────────────────
export type OrganizationAction = "suspend" | "reactivate" | "close";

/** Le backend exige la phrase de confirmation propre à chaque action ; elle n'est jamais saisie. */
export const organizationConfirmation: Record<OrganizationAction, string> = {
  suspend: "SUSPEND_ORGANIZATION",
  reactivate: "REACTIVATE_ORGANIZATION",
  close: "CLOSE_ORGANIZATION",
};

export const organizationActionCopy: Record<
  OrganizationAction,
  {
    title: string;
    submit: string;
    consequences: string[];
    irreversible: boolean;
  }
> = {
  suspend: {
    title: "Suspendre l'organisation",
    submit: "Suspendre l'organisation",
    consequences: [
      "Ses données sont conservées.",
      "L'organisation perd l'accès à ses services tant qu'elle n'est pas réactivée.",
      "L'action et son motif sont inscrits au journal.",
    ],
    irreversible: false,
  },
  reactivate: {
    title: "Réactiver l'organisation",
    submit: "Réactiver l'organisation",
    consequences: [
      "L'organisation retrouve l'accès à ses services.",
      "L'action et son motif sont inscrits au journal.",
    ],
    irreversible: false,
  },
  close: {
    title: "Clore l'organisation",
    submit: "Clore l'organisation",
    consequences: [
      "L'organisation est fermée définitivement : elle ne pourra pas être réactivée depuis cet écran.",
      "Ses données sont conservées pour la comptabilité et le journal.",
      "L'action et son motif sont inscrits au journal.",
    ],
    irreversible: true,
  },
};

/** Ce que l'équipe peut décider sur cette organisation, permissions vérifiées. */
export function organizationActions(
  organization: Pick<PlatformOrganization, "status">,
  capabilities: PlatformCapabilities,
): OrganizationAction[] {
  if (organization.status === "CLOSED") return [];
  if (organization.status === "ACTIVE")
    return capabilities.canSuspendOrganization ? ["suspend", "close"] : [];
  const actions: OrganizationAction[] = [];
  if (capabilities.canReactivateOrganization) actions.push("reactivate");
  if (capabilities.canSuspendOrganization) actions.push("close");
  return actions;
}

/** Motif : mêmes règles que le serveur (10 à 1 000 caractères, sans balise ni secret). */
export const reasonSchema = z
  .string()
  .trim()
  .min(10, "Le motif doit comporter au moins 10 caractères.")
  .max(1000, "Le motif ne peut pas dépasser 1 000 caractères.")
  .refine((v) => !/[<>]/.test(v), "Les caractères < et > sont interdits.")
  .refine(
    (v) => !/password|token|secret/i.test(v),
    "N'indiquez aucun secret dans un motif.",
  );

/**
 * Retraits : l'approbation déclenche un versement, désactivée tant que le propriétaire n'a pas
 * validé le versement (règle du document de conventions). La file reste consultable.
 */
export const WITHDRAWAL_DECISIONS_ENABLED = false;
export const withdrawalApprovalConfirmation = "APPROVE_WITHDRAWAL";
export type WithdrawalDecision = "approve" | "reject";
export type AnomalyAction = "review" | "resolve";

/** Valeur lisible pour un identifiant court (détail seulement, jamais saisi). */
export function shortId(id: string) {
  return id.slice(0, 8);
}
