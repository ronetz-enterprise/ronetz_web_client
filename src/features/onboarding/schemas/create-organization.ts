import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .max(150, "150 caractères maximum.")
    .refine(
      (value) => !!value.trim(),
      "Saisissez le nom de votre organisation.",
    ),
  country: z
    .string()
    .refine((value) => /^[A-Z]{2}$/.test(value), "Choisissez votre pays."),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/** La devise n'est jamais envoyée : le backend la déduit du pays. */
export function toCreateOrganizationDto(input: CreateOrganizationInput) {
  return { name: input.name.trim(), country: input.country };
}
