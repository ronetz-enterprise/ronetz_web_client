/**
 * Calculs de présentation des tarifs, avec la règle d'arrondi de la vente réelle
 * (CommissionPolicy / Money côté backend : montant × taux, arrondi à l'unité de la
 * devise, au pair le plus proche). Aucun taux n'est écrit ici.
 */
const ZERO_DECIMAL = new Set(["XAF", "XOF"]);

function roundHalfEven(value: number, digits: number) {
  const factor = 10 ** digits;
  const scaled = Number((value * factor).toFixed(8));
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let rounded: number;
  if (diff > 0.5) rounded = floor + 1;
  else if (diff < 0.5) rounded = floor;
  else rounded = floor % 2 === 0 ? floor : floor + 1;
  return rounded / factor;
}

export function commissionFor(amount: number, rate: number, currency: string) {
  return roundHalfEven(amount * rate, ZERO_DECIMAL.has(currency) ? 0 : 2);
}

export function netFor(amount: number, rate: number, currency: string) {
  return amount - commissionFor(amount, rate, currency);
}

/**
 * Le prix public ne descend jamais sous 10 % (directive du 2026-11-26). Si le backend
 * renvoie moins, c'est une erreur de configuration : on n'affiche pas ce prix.
 */
export const PUBLIC_RATE_FLOOR = 0.1;
export function isPublishableRate(rate: number) {
  return rate >= PUBLIC_RATE_FLOOR - 1e-9;
}

/**
 * Offre de lancement décidée par le fondateur. Texte de promotion, pas un taux :
 * il ne modifie pas le prix affiché.
 */
export const LAUNCH_OFFER =
  "Lancement : le premier mois est offert aux 3 premiers sites.";
