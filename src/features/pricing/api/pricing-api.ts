import { z } from "zod";
import { httpClient } from "@/lib/http-client";
import { ApiError } from "@/lib/api-error";

/**
 * Tarifs publics (fiche 011). Contrat SUPPOSÉ, en attente de backend-argent :
 *   GET /api/public/pricing  (sans compte)
 *   → { commissionRate: 0.1, currency: "XAF", effectiveFrom: "2026-11-26",
 *       withdrawal: { enabled, minimumAmount, approvalThreshold } }
 * Aujourd'hui seul GET /api/accounting/pricing existe (authentifié, sans devise ni date).
 * Tout l'écart avec le backend réel se règle dans ce fichier.
 */
const pricingSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(1),
  currency: z.string().length(3).default("XAF"),
  effectiveFrom: z.string().nullish(),
  withdrawal: z
    .object({
      enabled: z.boolean(),
      minimumAmount: z.coerce.number(),
      approvalThreshold: z.coerce.number(),
    })
    .nullish(),
});

export type Pricing = z.infer<typeof pricingSchema>;

export async function fetchPublicPricing(
  signal?: AbortSignal,
): Promise<Pricing> {
  const result = pricingSchema.safeParse(
    await httpClient("/api/public/pricing", { signal }),
  );
  if (!result.success) throw new ApiError("invalid-response");
  return result.data;
}
