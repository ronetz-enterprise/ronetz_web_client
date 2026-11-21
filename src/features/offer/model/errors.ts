import { ApiError, extractFieldErrors, toUserMessage } from "@/lib/api-error";

/** Phrase pour le gérant : on garde le message générique sauf pour les cas propres aux offres. */
export function offerErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === "http") {
    if (error.status === 409)
      return "Cette offre a été modifiée entre-temps. Rechargez la page, puis recommencez.";
    if (error.status === 403)
      return "Seul le propriétaire de l’organisation peut gérer les offres.";
    if (error.status === 404) return "Cette offre est introuvable.";
    if (error.status === 400) {
      const fields = Object.values(extractFieldErrors(error.problem)).flat();
      return fields[0] ?? "Vérifiez les informations saisies.";
    }
  }
  return toUserMessage(error);
}

/** Erreurs récupérables : on garde l'écran et on propose de réessayer. */
export function isRetryable(error: unknown) {
  return (
    error instanceof ApiError &&
    (["network", "timeout", "aborted"].includes(error.kind) ||
      error.status >= 500 ||
      error.status === 429)
  );
}
