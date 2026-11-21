import { z } from "zod";
import { addDays, isoDay } from "@/features/finance/model/days";

const amount = z.number();

/** `TimeSeriesPointView` : une ligne par jour ayant eu au moins une vente. */
export const salesPointSchema = z.object({
  periodStart: z.iso.date(),
  count: z.number().int().nonnegative(),
  grossAmount: amount,
  commissionAmount: amount,
  netAmount: amount,
});
export type SalesPoint = z.infer<typeof salesPointSchema>;

/** `SalesReportView` (`/reports/sales`, par jour). */
export const salesReportSchema = z.object({
  organizationId: z.uuid(),
  currency: z.string().length(3),
  salesCount: z.number().int().nonnegative(),
  confirmedPayments: z.number().int().nonnegative(),
  failedPayments: z.number().int().nonnegative(),
  grossRevenue: amount,
  commissionAmount: amount,
  netRevenue: amount,
  series: z.array(salesPointSchema),
});
export type SalesReport = z.infer<typeof salesReportSchema>;

export type SalesDay = { day: string; count: number; net: number };

/**
 * Série continue jour par jour : le backend omet les jours sans vente, qui valent zéro.
 * `days` jours se terminant à `end` inclus.
 */
export function dailySales(
  series: SalesPoint[],
  end: Date,
  days: number,
): SalesDay[] {
  const byDay = new Map(series.map((point) => [point.periodStart, point]));
  return Array.from({ length: days }, (_, index) => {
    const day = isoDay(addDays(end, days - 1 - index));
    const point = byDay.get(day);
    return { day, count: point?.count ?? 0, net: point?.netAmount ?? 0 };
  });
}

/** Évolution relative entre deux totaux ; `null` sans base de comparaison. */
export function relativeChange(current: number, previous: number) {
  if (!previous) return null;
  return (current - previous) / previous;
}

export function sum(days: SalesDay[], key: "count" | "net") {
  return days.reduce((total, day) => total + day[key], 0);
}

/** « +18 % », « −5 % » ou « stable » ; `null` sans base de comparaison. */
export function describeChange(current: number, previous: number) {
  const change = relativeChange(current, previous);
  if (change === null) return null;
  const percent = Math.round(change * 100);
  if (percent === 0) return "stable";
  return `${percent > 0 ? "+" : "−"}${Math.abs(percent)} %`;
}
