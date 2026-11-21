import { z } from "zod";
import { LONG_MAX, integerText, priceSchema, currencyDigits } from "./offer";

export { priceSchema, currencyDigits, integerText, LONG_MAX };

const moneyText = z
  .string()
  .regex(/^(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Montant invalide.")
  .refine((v) => /[1-9]/.test(v), "Le montant doit être supérieur à zéro.");

export const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Au moins 2 caractères.")
    .max(100, "100 caractères au maximum.")
    .refine(
      (v) =>
        !Array.from(v).some(
          (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
        ),
      "Ce nom contient un caractère interdit.",
    ),
  description: z.string().trim().max(500, "500 caractères au maximum."),
});

const optionalLimit = z.union([z.literal(""), integerText(1n, LONG_MAX)]);

/** Conditions d'accès. `""` = illimité (volume et vitesses). */
export const policySchema = z.object({
  validitySeconds: integerText(1n, 31536000n),
  dataAllowanceBytes: optionalLimit,
  downloadLimitBps: optionalLimit,
  uploadLimitBps: optionalLimit,
  maxConcurrentSessions: integerText(1n, 32n),
});
export const orderSchema = z.object({
  displayOrder: integerText(0n, 2147483647n),
});

export const createSchema = (currency: string) =>
  detailsSchema
    .extend(priceSchema(currency).shape)
    .extend(policySchema.shape)
    .extend(orderSchema.shape);

export type CreateValues = z.infer<ReturnType<typeof createSchema>>;
export type PolicyValues = z.infer<typeof policySchema>;
export type EditKind = "details" | "price" | "policy" | "order";
export type OfferAction = "publish" | "suspend" | "resume" | "archive";

export const statusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SUSPENDED",
  "ARCHIVED",
]);
export type OfferStatus = z.infer<typeof statusSchema>;

const policyResponseSchema = z.object({
  validitySeconds: integerText(1n, 31536000n),
  dataAllowanceBytes: integerText(1n, LONG_MAX).nullable(),
  downloadLimitBps: integerText(1n, LONG_MAX).nullable(),
  uploadLimitBps: integerText(1n, LONG_MAX).nullable(),
  maxConcurrentSessions: integerText(1n, 32n),
});

export const adminOfferSchema = z
  .object({
    offerId: z.uuid(),
    organizationId: z.uuid(),
    siteId: z.uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(500).nullable(),
    price: z.object({
      amount: moneyText,
      currencyCode: z.string().regex(/^[A-Z]{3}$/),
    }),
    accessPolicy: policyResponseSchema,
    status: statusSchema,
    displayOrder: integerText(0n, 2147483647n),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .refine(
    (o) =>
      priceSchema(o.price.currencyCode).safeParse({ amount: o.price.amount })
        .success,
    "Précision monétaire incohérente.",
  );
export type AdminOffer = z.infer<typeof adminOfferSchema>;

export const adminOfferPageSchema = z.object({
  content: z.array(adminOfferSchema),
  page: integerText(0n, 2147483647n),
  size: integerText(1n, 100n),
  totalElements: integerText(0n, LONG_MAX),
});

/** Vocabulaire du gérant : jamais « brouillon publié suspendu ». */
export const statusLabels: Record<OfferStatus, string> = {
  DRAFT: "Pas en vente",
  PUBLISHED: "En vente",
  SUSPENDED: "En pause",
  ARCHIVED: "Archivée",
};
export const statusTones: Record<
  OfferStatus,
  "success" | "warning" | "neutral"
> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  SUSPENDED: "warning",
  ARCHIVED: "neutral",
};

export const actionLabels: Record<OfferAction, string> = {
  publish: "Mettre en vente",
  suspend: "Mettre en pause",
  resume: "Remettre en vente",
  archive: "Archiver",
};
export const actionImpacts: Record<OfferAction, string> = {
  publish: "Vos clients pourront acheter cette offre sur la page de ce site.",
  suspend:
    "Vos clients ne pourront plus l’acheter tant qu’elle est en pause. Les accès déjà vendus ne changent pas.",
  resume: "Vos clients pourront de nouveau acheter cette offre.",
  archive:
    "L’offre sort de la vente pour toujours : vous ne pourrez plus la modifier ni la remettre en vente. Les accès déjà vendus ne changent pas.",
};

export type SiteLite = {
  id: string;
  organizationId: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
};

export type OwnerContext = {
  role: string;
  membershipStatus: string;
  organizationStatus: string;
  organizationId: string;
};

/** Ce que le gérant peut faire. Règles reprises de l'ancien front (jamais inventées ici). */
export function offerCapabilities(
  active: OwnerContext,
  site?: SiteLite,
  offer?: AdminOffer,
  currency?: string,
) {
  const owner =
    active.role === "OWNER" &&
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const scoped =
    owner &&
    !!site &&
    site.organizationId === active.organizationId &&
    (!offer ||
      (offer.organizationId === active.organizationId &&
        offer.siteId === site.id));
  const available = scoped && site?.status === "ACTIVE";
  const editable = available && !!offer && offer.status !== "ARCHIVED";
  const sameCurrency = !!currency && offer?.price.currencyCode === currency;
  return {
    canViewOffers: owner,
    canCreateOffer: available,
    canEditPrice: editable,
    canEditOffer: editable && sameCurrency,
    publish: editable && sameCurrency && offer?.status === "DRAFT",
    suspend: scoped && offer?.status === "PUBLISHED",
    resume: editable && sameCurrency && offer?.status === "SUSPENDED",
    archive: scoped && !!offer && offer.status !== "ARCHIVED",
  };
}
