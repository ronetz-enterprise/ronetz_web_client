import { cn } from "@/lib/utils";

/** « 12 500 » : séparateur de milliers insécable, à la française. */
export function formatNumber(value: number) {
  const sign = value < 0 ? "−" : "";
  return (
    sign +
    Math.abs(Math.round(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  );
}

/** Montant en francs CFA : « 12 500 FCFA ». Chiffres alignés en colonnes. */
export function Amount({
  value,
  currency = "FCFA",
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn("tnum whitespace-nowrap", className)}>
      {formatNumber(value)}&nbsp;
      <span className="text-[0.85em] text-muted-foreground">{currency}</span>
    </span>
  );
}
