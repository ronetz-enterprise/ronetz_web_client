import { ApiError, toUserMessage } from "@/lib/api-error";

/** Phrase pour le gérant à la suite d'un échec sur un accès (jamais de terme technique). */
export function accessErrorMessage(
  error: unknown,
  context: "create" | "change" | "read" = "read",
) {
  if (error instanceof ApiError && error.kind === "http") {
    if (context === "create") {
      if (error.status === 503)
        return "La création d’accès n’est pas disponible pour le moment. Aucun accès n’a été créé : réessayez dans quelques minutes.";
      if (error.status === 409)
        return "Cet accès existe déjà ou la demande est en conflit. Vérifiez la liste avant de recommencer.";
      if (error.status === 403)
        return "Seul le propriétaire du compte peut vendre un accès, sur un site actif.";
      if (error.status === 400)
        return "Vérifiez la durée et les conditions de l’accès.";
    }
    if (context === "change") {
      if (error.status === 503)
        return "L’accès a bien été modifié, mais le réseau du site n’est pas à jour. Appuyez sur « Relancer l’activation ».";
      if (error.status === 409)
        return "L’état de cet accès a changé entre-temps. Actualisez la page.";
    }
    if (error.status === 404) return "Cet accès est introuvable.";
  }
  return toUserMessage(error);
}
