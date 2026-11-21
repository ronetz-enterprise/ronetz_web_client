import { z } from "zod";

export const LONG_MAX = 9223372036854775807n;

export const integerText = (min: bigint, max: bigint) =>
  z
    .string()
    .regex(/^(0|[1-9]\d*)$/, "Saisissez un entier sans séparateur.")
    .refine(
      (v) =>
        /^(0|[1-9]\d*)$/.test(v) &&
        v.length <= 19 &&
        BigInt(v) >= min &&
        BigInt(v) <= max,
      `Valeur attendue entre ${min} et ${max}.`,
    );

const moneyText = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/,
    "Montant positif : 15 chiffres entiers et 4 décimales au maximum, séparateur point.",
  )
  .refine((v) => /[1-9]/.test(v), "Le montant doit être strictement positif.");

export function currencyDigits(currency: string) {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

export const priceSchema = (currency: string) =>
  z.object({
    amount: moneyText.refine(
      (v) =>
        (v.split(".")[1] ?? "").replace(/0+$/, "").length <=
        currencyDigits(currency),
      `Cette devise accepte ${currencyDigits(currency)} décimale(s).`,
    ),
  });

const accessPolicyResponseSchema = z.object({
  validitySeconds: integerText(1n, 31536000n),
  dataAllowanceBytes: integerText(1n, LONG_MAX).nullable(),
  downloadLimitBps: integerText(1n, LONG_MAX).nullable(),
  uploadLimitBps: integerText(1n, LONG_MAX).nullable(),
  maxConcurrentSessions: integerText(1n, 32n),
});

export const offerSchema = z.object({
  offerId: z.uuid(),
  siteId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  // Le backend renvoie null quand l'offre n'a pas de description.
  description: z.string().trim().max(500).nullable(),
  price: z.object({
    amount: z.string(),
    currencyCode: z.string(),
  }),
  accessPolicy: accessPolicyResponseSchema,
  displayOrder: integerText(0n, 2147483647n),
});
