import { z } from "zod";

const amount = z.number();
const instant = z.iso.datetime({ offset: true });
const currency = z.string().length(3);

export const balanceSchema = z.object({
  organizationId: z.uuid(),
  availableAmount: amount,
  reservedAmount: amount,
  paidOutAmount: amount,
  pendingAmount: amount.optional(),
  currency,
});
export type Balance = z.infer<typeof balanceSchema>;

export const ledgerTransactionSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  type: z.string(),
  status: z.string().optional(),
  grossAmount: amount,
  commissionAmount: amount,
  netAmount: amount,
  currency,
  externalReference: z.string().nullable().optional(),
  createdAt: instant,
});
export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>;

const pageFields = {
  page: z.number().int(),
  size: z.number().int(),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
};
export const ledgerPageSchema = z.object({
  content: z.array(ledgerTransactionSchema),
  ...pageFields,
});
export type LedgerPage = z.infer<typeof ledgerPageSchema>;

export const withdrawalSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  amount,
  currency,
  network: z.string(),
  country: z.string(),
  maskedMsisdn: z.string(),
  recipientName: z.string(),
  status: z.string(),
  requestedAt: instant,
  decidedAt: instant.nullable(),
  decisionReason: z.string().nullable(),
  completedAt: instant.nullable(),
  failureReason: z.string().nullable(),
});
export type Withdrawal = z.infer<typeof withdrawalSchema>;

export const withdrawalPageSchema = z.object({
  content: z.array(withdrawalSchema),
  ...pageFields,
});

/** Libellé et effet de chaque type de mouvement sur le solde disponible. */
export const ledgerTypeLabels: Record<
  string,
  { label: string; sign: 1 | -1 | 0 }
> = {
  SALE: { label: "Vente", sign: 1 },
  COMMISSION: { label: "Commission", sign: 0 },
  WITHDRAWAL: { label: "Retrait réservé", sign: -1 },
  WITHDRAWAL_RELEASE: { label: "Retrait annulé", sign: 1 },
  PAYOUT: { label: "Retrait effectué", sign: 0 },
  PAYOUT_REVERSAL: { label: "Retrait annulé", sign: 1 },
  REFUND: { label: "Remboursement client", sign: -1 },
  REFUND_SETTLEMENT: { label: "Remboursement réglé", sign: 0 },
  REFUND_REVERSAL: { label: "Remboursement refusé", sign: 1 },
  ADJUSTMENT: { label: "Ajustement", sign: 0 },
};

export type Tone = "success" | "warning" | "danger" | "neutral";

export const withdrawalStatusLabels: Record<
  string,
  { label: string; tone: Tone }
> = {
  PENDING_APPROVAL: { label: "En attente d’accord", tone: "warning" },
  PROCESSING: { label: "Retrait en cours", tone: "warning" },
  COMPLETED: { label: "Effectué", tone: "success" },
  FAILED: { label: "Échoué", tone: "danger" },
  REJECTED: { label: "Refusé", tone: "danger" },
  CANCELLED: { label: "Annulé", tone: "neutral" },
  REVERSED: { label: "Annulé par l’opérateur", tone: "danger" },
};

export const networkLabels: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ORANGEMONEY: "Orange Money",
};

/** Seuil d'approbation par défaut du backend (`accounting.withdrawal.approval-threshold`). */
export const APPROVAL_THRESHOLD = 100_000;
export const MINIMUM_WITHDRAWAL = 1_000;

/** Effet d'un mouvement sur le solde disponible (`null` quand il n'en a pas). */
export function balanceEffect(tx: LedgerTransaction): number | null {
  const meta = ledgerTypeLabels[tx.type];
  if (!meta || meta.sign === 0) return null;
  return meta.sign * tx.netAmount;
}

/** Le tableau de bord et la liste des mouvements ne comptent que les ventes. */
export const isSale = (tx: LedgerTransaction) => tx.type === "SALE";

/** Le backend n'expose que le rôle OWNER pour les finances (FINANCE_READ). */
export function canViewFinance(can: (permission: string) => boolean) {
  return can("FINANCE_READ");
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}

export type TimelineStep = {
  id: string;
  title: string;
  description?: string;
  at?: string | null;
  upcoming?: boolean;
  tone?: Tone | "info";
};

/**
 * Étapes d'un retrait : demandé → accord → versé. Une étape non atteinte est « à venir » ;
 * un refus ou un échec termine la frise.
 */
export function withdrawalTimeline(w: Withdrawal): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      id: "requested",
      title: "Demandé",
      description: `${networkLabels[w.network] ?? w.network} · ${w.maskedMsisdn}`,
      at: w.requestedAt,
    },
  ];
  if (w.status === "CANCELLED")
    return [...steps, { id: "cancelled", title: "Annulé", tone: "neutral" }];
  if (w.status === "REJECTED")
    return [
      ...steps,
      {
        id: "rejected",
        title: "Refusé",
        description: w.decisionReason ?? undefined,
        at: w.decidedAt,
        tone: "danger",
      },
    ];
  const approved = w.status !== "PENDING_APPROVAL";
  steps.push({
    id: "approved",
    title: approved ? "Accepté" : "En attente d’accord",
    at: approved ? w.decidedAt : undefined,
    upcoming: !approved,
  });
  if (w.status === "FAILED" || w.status === "REVERSED")
    return [
      ...steps,
      {
        id: "failed",
        title: w.status === "FAILED" ? "Retrait échoué" : "Retrait annulé",
        description: "Le montant est de nouveau disponible.",
        at: w.completedAt,
        tone: "danger",
      },
    ];
  steps.push({
    id: "paid",
    title: w.status === "COMPLETED" ? "Retrait effectué" : "Retrait",
    description:
      w.status === "PROCESSING"
        ? "Transfert en cours chez l’opérateur."
        : undefined,
    at: w.completedAt,
    tone: w.status === "PROCESSING" ? "info" : "success",
    upcoming: w.status !== "COMPLETED",
  });
  return steps;
}
