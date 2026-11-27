import { describe, expect, it } from "vitest";
import { commissionFor, isPublishableRate, netFor } from "./pricing";

describe("tarifs", () => {
  it.each([
    [100, 10, 90],
    [500, 50, 450],
    [2500, 250, 2250],
  ])("vente de %i FCFA à 10 %%", (amount, commission, net) => {
    expect(commissionFor(amount, 0.1, "XAF")).toBe(commission);
    expect(netFor(amount, 0.1, "XAF")).toBe(net);
  });
  it("arrondit au pair le plus proche comme la vente", () => {
    expect(commissionFor(25, 0.1, "XAF")).toBe(2);
    expect(commissionFor(35, 0.1, "XAF")).toBe(4);
  });
  it("refuse un prix public sous 10 %", () => {
    expect(isPublishableRate(0.02)).toBe(false);
    expect(isPublishableRate(0.1)).toBe(true);
  });
});
