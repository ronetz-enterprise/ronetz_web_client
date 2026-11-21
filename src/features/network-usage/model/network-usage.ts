import { z } from "zod";
import { isoDay } from "@/features/finance/model/days";

const count = z.number().int().nonnegative();
const localDate = z.iso.date();

export const reportPeriodSchema = z.object({
  from: localDate,
  to: localDate,
  timeZone: z.string().min(1),
  granularity: z.string(),
});

/** `AccessReportView` : volumes en octets, compteurs sur la période demandée. */
export const accessReportSchema = z.object({
  organizationId: z.uuid(),
  period: reportPeriodSchema,
  created: count,
  provisioned: count,
  active: count,
  expired: count,
  suspended: count,
  revoked: count,
  authenticationSuccesses: count,
  authenticationFailures: count,
  sessions: count,
  inputBytes: count,
  outputBytes: count,
});
export type AccessReport = z.infer<typeof accessReportSchema>;

/** `RouterPerformanceView` : cumul non borné par la période. */
export const routerUsageSchema = z.object({
  organizationId: z.uuid(),
  siteId: z.uuid().nullable(),
  routerId: z.uuid(),
  routerName: z.string().nullable(),
  status: z.string().nullable(),
  lastSeenAt: z.iso.datetime({ offset: true }).nullable(),
  accessCount: count,
  authenticationSuccessCount: count,
  authenticationFailureCount: count,
  totalSessionCount: count,
  totalInputBytes: count,
  totalOutputBytes: count,
});
export type RouterUsage = z.infer<typeof routerUsageSchema>;

/** `SitePerformanceView` : instantané courant par site, sans période. */
export const sitePerformanceSchema = z.object({
  organizationId: z.uuid(),
  siteId: z.uuid(),
  siteName: z.string().nullable(),
  routerCount: count,
  onlineRouterCount: count,
  activeOfferCount: count,
  purchaseCount: count,
  successfulPaymentCount: count,
  accessCount: count,
});
export type SitePerformance = z.infer<typeof sitePerformanceSchema>;
export const SITE_REPORT_SIZE = 100;

/** Plafond serveur `ronetz.reporting.query.maximum-range-days`. */
export const MAX_RANGE_DAYS = 366;
export const ROUTER_PAGE_SIZE = 20;

export type UsageFilters = {
  from: string;
  to: string;
  siteId: string | null;
};

/** Les `days` derniers jours, aujourd'hui inclus. */
export function lastDaysFilters(
  days: number,
  siteId: string | null,
  now = new Date(),
): UsageFilters {
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: isoDay(start), to: isoDay(now), siteId };
}

/** Nombre de jours de la période, bornes incluses. */
export function periodDays(filters: { from: string; to: string }) {
  return (
    Math.round(
      (Date.parse(`${filters.to}T00:00:00Z`) -
        Date.parse(`${filters.from}T00:00:00Z`)) /
        86_400_000,
    ) + 1
  );
}

/** Période de même durée qui précède immédiatement celle choisie, pour les évolutions. */
export function previousPeriod(filters: UsageFilters): UsageFilters {
  const days = periodDays(filters);
  const to = new Date(`${filters.from}T00:00:00`);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDay(from), to: isoDay(to), siteId: filters.siteId };
}

/** Même règle que `ReportPeriod` : bornes incluses, `to >= from`, plafond. */
export function periodError(filters: UsageFilters) {
  if (!localDate.safeParse(filters.from).success)
    return "Date de début invalide.";
  if (!localDate.safeParse(filters.to).success) return "Date de fin invalide.";
  const from = Date.parse(`${filters.from}T00:00:00Z`);
  const to = Date.parse(`${filters.to}T00:00:00Z`);
  if (to < from) return "La date de fin précède la date de début.";
  if ((to - from) / 86_400_000 + 1 > MAX_RANGE_DAYS)
    return `La période ne peut pas dépasser ${MAX_RANGE_DAYS} jours.`;
  return null;
}
