import { ApiError } from "@/lib/api-error";

/** Messages des refus du serveur, sans vocabulaire technique. */
export function purchaseErrorMessage(error: unknown) {
  if (!(error instanceof ApiError))
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  if (error.kind === "network")
    return "Connexion impossible. Vérifiez que vous êtes bien connecté au Wi-Fi, puis réessayez.";
  if (error.kind === "timeout")
    return "Le service met trop de temps à répondre. Réessayez dans un instant.";
  const code = error.problem?.detail ?? "";
  if (error.status === 429)
    return "Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.";
  if (code === "InvalidPaymentRequest" || error.status === 400)
    return "Ce numéro ou cet opérateur ne peut pas être utilisé pour ce paiement. Vérifiez-les et réessayez.";
  if (code === "PaymentAlreadySucceeded") return "Ce paiement a déjà été reçu.";
  if (code === "PaymentReconciliationRequired")
    return "Un paiement est déjà en cours de validation pour cet achat. Patientez quelques instants.";
  // Seul le refus de la session d'achat parle de délai ; tout autre refus (sécurité, configuration)
  // ne doit pas faire croire au client qu'il a trop attendu.
  if (error.status === 403 && code.startsWith("Checkout"))
    return "Ce paiement n'est plus possible : le délai est dépassé ou le nombre d'essais est atteint.";
  if (error.status === 403)
    return "Le paiement n'a pas pu être lancé depuis cette page. Rechargez la page puis réessayez.";
  if (error.status === 404) return "Cette offre n'est plus disponible.";
  return "Le paiement n'a pas pu être lancé. Réessayez dans un instant.";
}

export function toUserMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  if (error.kind === "network")
    return "Connexion impossible. Vérifiez votre connexion Internet.";
  if (error.kind === "timeout")
    return "Le serveur met trop de temps à répondre.";
  if (error.kind === "aborted") return "La demande a été annulée.";
  const messages: Record<number, string> = {
    400: "Vérifiez les informations saisies.",
    401: "Votre session est absente ou expirée.",
    403: "Vous n'avez pas accès à cette ressource.",
    404: "Cette ressource est introuvable.",
    409: "Cette opération entre en conflit avec l'état actuel de la ressource.",
    422: "Les informations ne permettent pas cette opération.",
    429: "Trop de demandes. Veuillez patienter avant de réessayer.",
  };
  return (
    messages[error.status] ??
    "Le service est temporairement indisponible. Veuillez réessayer plus tard."
  );
}
