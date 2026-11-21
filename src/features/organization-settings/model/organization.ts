import { z } from "zod";

/** Une organisation telle que l'API la renvoie (le pays est ajouté par la migration V38). */
export const organizationDetailSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(150),
  country: z.string().regex(/^[A-Z]{2}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  suspensionReason: z.string().nullable(),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  closedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type OrganizationDetail = z.infer<typeof organizationDetailSchema>;

/** Pays du catalogue public. La devise est déduite du pays : on ne la saisit jamais. */
export const countrySchema = z.object({
  code: z.string().regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  timeZone: z.string(),
  open: z.boolean(),
});
export type Country = z.infer<typeof countrySchema>;

export const organizationStatusLabel: Record<
  OrganizationDetail["status"],
  string
> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Fermée",
};

export const organizationStatusTone = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  CLOSED: "neutral",
} as const;

/**
 * Le backend n'expose pas encore de route pour renommer l'organisation (GET seulement).
 * Passer à `true` quand elle existe : le formulaire d'édition est déjà prêt.
 */
export const ORGANIZATION_RENAME_AVAILABLE = false;

export const organizationNameSchema = z.object({
  name: z
    .string()
    .max(150, "150 caractères maximum.")
    .refine((value) => !!value.trim(), "Saisissez le nom de l’organisation."),
});
export type OrganizationNameInput = z.infer<typeof organizationNameSchema>;

/** Le nom a-t-il changé (espaces de bord ignorés) ? Pilote le bouton Enregistrer. */
export function nameChanged(current: string, draft: string) {
  const trimmed = draft.trim();
  return trimmed.length > 0 && trimmed !== current.trim();
}

/** Nom du pays à afficher : celui du catalogue, sinon le code. */
export function countryName(code: string, countries: Country[] | undefined) {
  return countries?.find((c) => c.code === code)?.name ?? code;
}
