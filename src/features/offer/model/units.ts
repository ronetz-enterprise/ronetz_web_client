/**
 * Saisie « nombre + unité » : la valeur envoyée au serveur reste en unité de base
 * (secondes, octets, bit/s), en texte exact (aucun Number sur les entiers 64 bits).
 */
export type Unit = { label: string; factor: bigint };

export const durationUnits: Unit[] = [
  { label: "minutes", factor: 60n },
  { label: "heures", factor: 3600n },
  { label: "jours", factor: 86400n },
];
export const dataUnits: Unit[] = [
  { label: "Mo", factor: 1000000n },
  { label: "Go", factor: 1000000000n },
];
export const rateUnits: Unit[] = [
  { label: "kbit/s", factor: 1000n },
  { label: "Mbit/s", factor: 1000000n },
];

export type UnitDraft = { amount: string; unit: string; unlimited: boolean };

/** Valeur serveur → saisie : la plus grande unité qui tombe juste. `null` = illimité. */
export function toDraft(
  value: string | null,
  units: Unit[],
  fallback: number,
): UnitDraft {
  if (value === null || value === "")
    return { amount: "", unit: units[fallback].label, unlimited: true };
  if (!/^[1-9]\d*$/.test(value))
    return { amount: value, unit: units[fallback].label, unlimited: false };
  const n = BigInt(value);
  const unit = [...units].reverse().find((u) => n % u.factor === 0n);
  return unit
    ? { amount: String(n / unit.factor), unit: unit.label, unlimited: false }
    : { amount: value, unit: "base", unlimited: false };
}

/** Saisie → valeur serveur : `""` = illimité, `null` = saisie invalide. */
export function fromDraft(
  draft: UnitDraft,
  units: Unit[],
  allowUnlimited: boolean,
): string | null {
  if (draft.unlimited) return allowUnlimited ? "" : null;
  if (!/^[1-9]\d{0,18}$/.test(draft.amount)) return null;
  const factor =
    draft.unit === "base"
      ? 1n
      : (units.find((u) => u.label === draft.unit)?.factor ?? null);
  if (factor === null) return null;
  return String(BigInt(draft.amount) * factor);
}

/** « 1 heure », « 7 jours », « 90 minutes » : durée lisible, au pluriel juste. */
export function describeDuration(seconds: string) {
  const n = BigInt(seconds);
  for (const [unit, one, many] of [
    [86400n, "jour", "jours"],
    [3600n, "heure", "heures"],
    [60n, "minute", "minutes"],
  ] as const) {
    if (n >= unit && n % unit === 0n) {
      const c = n / unit;
      return `${c} ${c === 1n ? one : many}`;
    }
  }
  const mins = n / 60n;
  if (n >= 60n) return `${mins} min${n % 60n ? ` ${n % 60n} s` : ""}`;
  return `${n} s`;
}

export const devicesLabel = (n: string) =>
  `${n} ${n === "1" ? "appareil" : "appareils"}`;
