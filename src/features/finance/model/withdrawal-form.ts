import { APPROVAL_THRESHOLD, MINIMUM_WITHDRAWAL } from "./finance";
import { formatNumber } from "@/lib/format";

import {
  guessChannel,
  type PaymentChannel,
} from "@/features/purchase/model/payment-channel";
import {
  isMobileNumber,
  localDigits,
} from "@/features/purchase/model/mobile-money";

export type WithdrawalFields = {
  amount: string;
  /** Numéro local (9 chiffres) : l'indicatif +237 est fixe, le Cameroun étant le seul pays ouvert. */
  msisdn: string;
  /** Opérateur choisi (`MTN`, `ORANGEMONEY`). */
  network?: string;
  firstName: string;
  lastName: string;
};
export type WithdrawalErrors = Partial<Record<keyof WithdrawalFields, string>>;

const fcfa = (value: number) => `${formatNumber(value)} FCFA`;

/**
 * Mêmes règles que l'ancien front. Le serveur reste juge du solde, du seuil d'approbation et du
 * format : on évite seulement les allers-retours inutiles.
 */
export function validateWithdrawal(
  fields: WithdrawalFields,
  available: number,
  channels: readonly PaymentChannel[] = [],
): WithdrawalErrors {
  const errors: WithdrawalErrors = {};
  const value = Number(fields.amount);
  if (!Number.isInteger(value) || value < MINIMUM_WITHDRAWAL)
    errors.amount = `Montant entier d’au moins ${fcfa(MINIMUM_WITHDRAWAL)}.`;
  else if (value > available)
    errors.amount = `Au plus ${fcfa(available)} disponibles.`;
  if (!isMobileNumber(fields.msisdn))
    errors.msisdn =
      "Numéro mobile camerounais de 9 chiffres, commençant par 6.";
  else {
    const mismatch = operatorMismatch(fields.msisdn, fields.network, channels);
    if (mismatch) errors.msisdn = mismatch;
  }
  if (!fields.firstName.trim()) errors.firstName = "Prénom requis.";
  if (!fields.lastName.trim()) errors.lastName = "Nom requis.";
  return errors;
}

/** Au-delà de ce montant, un retrait attend l'accord de Ronetz avant le versement. */
export function needsApproval(amount: number) {
  return Number.isFinite(amount) && amount > APPROVAL_THRESHOLD;
}

/**
 * Un numéro dont le préfixe désigne clairement un autre opérateur que celui choisi : le versement
 * partirait sur le mauvais réseau et échouerait. Préfixe inconnu ou ambigu : on laisse passer.
 */
export function operatorMismatch(
  msisdn: string,
  network: string | undefined,
  channels: readonly PaymentChannel[],
): string | null {
  if (!network) return null;
  const guessed = channels.find((c) => c.id === guessChannel(channels, msisdn));
  if (!guessed || guessed.network === network) return null;
  return `Ce numéro est un numéro ${guessed.label}. Choisissez ${guessed.label} ou vérifiez le numéro.`;
}

/** Numéro au format attendu par le serveur pour un retrait : `2376XXXXXXXX`. */
export function withdrawalMsisdn(msisdn: string) {
  return `237${localDigits(msisdn)}`;
}
