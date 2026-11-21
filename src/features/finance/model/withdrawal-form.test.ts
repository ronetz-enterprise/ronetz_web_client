import { describe, expect, it } from "vitest";

import { fallbackPaymentChannels } from "@/features/purchase/model/payment-channel";
import {
  operatorMismatch,
  validateWithdrawal,
  withdrawalMsisdn,
} from "./withdrawal-form";

const channels = fallbackPaymentChannels;
const base = { amount: "1000", firstName: "Serge", lastName: "Mbarga" };

describe("formulaire de retrait", () => {
  it("accepte un numéro MTN avec l'opérateur MTN", () => {
    expect(
      validateWithdrawal(
        { ...base, msisdn: "6 77 11 22 33", network: "MTN" },
        5000,
        channels,
      ),
    ).toEqual({});
  });

  it("refuse un numéro MTN envoyé chez Orange, et dit quoi faire", () => {
    const errors = validateWithdrawal(
      { ...base, msisdn: "677112233", network: "ORANGEMONEY" },
      5000,
      channels,
    );
    expect(errors.msisdn).toContain("MTN Mobile Money");
  });

  it("laisse passer un préfixe inconnu (le serveur reste juge)", () => {
    expect(operatorMismatch("620112233", "MTN", channels)).toBeNull();
  });

  it("refuse un numéro qui n'est pas un mobile camerounais", () => {
    expect(
      validateWithdrawal(
        { ...base, msisdn: "2223344", network: "MTN" },
        5000,
        channels,
      ).msisdn,
    ).toBeDefined();
  });

  it("refuse moins que le minimum et plus que le solde", () => {
    const ok = { ...base, msisdn: "677112233", network: "MTN" };
    expect(
      validateWithdrawal({ ...ok, amount: "999" }, 5000, channels).amount,
    ).toBeDefined();
    expect(
      validateWithdrawal({ ...ok, amount: "6000" }, 5000, channels).amount,
    ).toContain("5");
  });

  it("envoie le numéro au serveur avec l'indicatif du Cameroun", () => {
    expect(withdrawalMsisdn("6 77 11 22 33")).toBe("237677112233");
    expect(withdrawalMsisdn("+237 677112233")).toBe("237677112233");
  });
});
