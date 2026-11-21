import { z } from "zod";
import type { Membership } from "@/features/memberships";

export const siteStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]);
export const siteSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  city: z.string(),
  district: z.string().nullable(),
  addressDetails: z.string().nullable(),
  timezone: z.string(),
  status: siteStatusSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Site = z.infer<typeof siteSchema>;
export type SiteAction = "suspend" | "reactivate" | "close";

export const siteStatusLabels: Record<Site["status"], string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CLOSED: "Fermé",
};

/** Villes proposées en puces ; « Autre ville » ouvre la saisie libre. */
export const suggestedCities = ["Douala", "Yaoundé"] as const;

/**
 * Création : le gérant ne saisit que le nom et la ville (+ quartier facultatif).
 * Le fuseau horaire est déduit du pays par le backend.
 */
export const siteFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Donnez un nom à votre site.")
    .max(150, "150 caractères maximum."),
  city: z
    .string()
    .trim()
    .min(1, "Indiquez la ville de votre site.")
    .max(150, "150 caractères maximum."),
  district: z.string().trim().max(150, "150 caractères maximum."),
  addressDetails: z.string().trim().max(500, "500 caractères maximum."),
});
export type SiteFormValues = z.infer<typeof siteFormSchema>;

/** Corps envoyé au backend : les champs facultatifs vides sont omis. */
export function toCreateBody(values: SiteFormValues) {
  const v = siteFormSchema.parse(values);
  return {
    name: v.name,
    city: v.city,
    ...(v.district ? { district: v.district } : {}),
    ...(v.addressDetails ? { addressDetails: v.addressDetails } : {}),
  };
}

export function siteCapabilities(active: Membership, site?: Site) {
  const readable =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = readable && active.role === "OWNER";
  const target = owner && site?.organizationId === active.organizationId;
  return {
    canViewSites: readable,
    canCreateSite: owner,
    canEditSite: !!target && site.status !== "CLOSED",
    suspend: !!target && site.status === "ACTIVE",
    reactivate: !!target && site.status === "SUSPENDED",
    close: !!target && site.status !== "CLOSED",
  };
}

export const siteTone = (status: Site["status"]) =>
  status === "ACTIVE"
    ? "success"
    : status === "SUSPENDED"
      ? "warning"
      : "neutral";

/** Adresse lisible du site : « Quartier, Ville ». */
export const siteLocation = (site: Pick<Site, "city" | "district">) =>
  [site.district, site.city].filter(Boolean).join(", ");
