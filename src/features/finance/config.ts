/**
 * Retraits Mobile Money réactivés le 2026-11-17 : les versements passent par Fapshi. Le serveur
 * reste juge (solde, minimum, approbation au-delà du seuil) ; s'il coupe les retraits
 * (RONETZ_WITHDRAWALS_ENABLED=false), il répond WITHDRAWALS_DISABLED et le formulaire l'affiche.
 */
export const WITHDRAWALS_ENABLED = true;

export const WITHDRAWALS_UNAVAILABLE_MESSAGE =
  "Les retraits seront bientôt disponibles.";
