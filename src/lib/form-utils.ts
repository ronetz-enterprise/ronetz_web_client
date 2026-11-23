import { z } from "zod";
import type { FieldValues, Resolver } from "react-hook-form";

// Scoped to flat technical forms. Nested schemas should use an explicit adapter.
export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T, T>,
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.length === 1 ? String(issue.path[0]) : "root";
      if (!errors[name])
        errors[name] = { type: "validation", message: issue.message };
    }
    return { values: {}, errors } as ReturnType<Resolver<T>>;
  };
}

/**
 * Fermeture involontaire d'un tiroir ou d'une fenêtre : clic à côté ou touche Échap.
 * Quand une saisie serait perdue, on l'ignore ; la croix et « Annuler » ferment toujours.
 */
export function isAccidentalDismiss(details?: { reason?: string }): boolean {
  return details?.reason === "outside-press" || details?.reason === "escape-key";
}
