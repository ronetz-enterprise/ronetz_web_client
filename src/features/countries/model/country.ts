import { z } from "zod";

/** Un pays connu de la plateforme. La devise et le fuseau en sont déduits : le gérant ne les saisit jamais. */
export const countrySchema = z.object({
  code: z.string().regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  timeZone: z.string().min(1),
  open: z.boolean(),
});

export type Country = z.infer<typeof countrySchema>;

export const countriesSchema = z.array(countrySchema);

const currencyNames: Record<string, string> = {
  XAF: "franc CFA (XAF)",
  XOF: "franc CFA (XOF)",
  EUR: "euro (EUR)",
};

/** « franc CFA (XAF) » : un nom que le gérant reconnaît, jamais le seul code. */
export function currencyLabel(code: string) {
  return currencyNames[code] ?? code;
}
