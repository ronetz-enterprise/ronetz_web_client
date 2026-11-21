"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { isoDay, addDays } from "@/features/finance/model/days";
import { ApiError } from "@/lib/api-error";
import { salesReportSchema } from "../model/sales-report";
import { accessPageSchema, routersPageSchema } from "../model/todo";

const LIST_SIZE = 100;

/** L'heure courante, rafraîchie à intervalle régulier (la courbe du jour avance avec elle). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const dashboardKeys = {
  routers: (org: string) => ["org", org, "dashboard", "routers"] as const,
  access: (org: string) => ["org", org, "dashboard", "access"] as const,
  sales: (org: string, from: string, to: string, tz: string) =>
    ["org", org, "dashboard", "sales", { from, to, tz }] as const,
};

/** Les routeurs de l'organisation (première page) : sert à repérer ceux qui ne répondent plus. */
export function useRoutersForTodo() {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    enabled: membership.role === "OWNER",
    queryKey: dashboardKeys.routers(organizationId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async ({ signal }) => {
      const result = routersPageSchema.safeParse(
        await request(orgApi("/routers"), {
          signal,
          query: { page: "0", size: String(LIST_SIZE) },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return {
        routers: result.data.content,
        partial: result.data.totalElements > result.data.content.length,
      };
    },
  });
}

/** Les accès les plus récents (première page) : sert à repérer ceux qui expirent ou à relancer. */
export function useAccessForTodo() {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    enabled: membership.role === "OWNER",
    queryKey: dashboardKeys.access(organizationId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async ({ signal }) => {
      const result = accessPageSchema.safeParse(
        await request(orgApi("/access-grants"), {
          signal,
          query: { page: "0", size: String(LIST_SIZE) },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return {
        accesses: result.data.content,
        partial: result.data.totalElements > result.data.content.length,
      };
    },
  });
}

/**
 * Ventes par jour sur les `days` derniers jours (aujourd'hui inclus), fuseau de l'appareil.
 * Rapport recalculé par événements : léger retard possible, et il ne compte pas encore les
 * ventes au comptoir saisies à la main. `null` = rapport pas encore calculé (404).
 */
export function useSalesReport(days: number, now: Date) {
  const { request } = useAuth();
  const { organizationId, orgApi, can } = useOrganization();
  const to = isoDay(now);
  const from = isoDay(addDays(now, -(days - 1)));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: dashboardKeys.sales(organizationId, from, to, timeZone),
    enabled: can("FINANCE_READ"),
    staleTime: 60_000,
    retry: (failures, error) =>
      !(error instanceof ApiError && error.status === 404) && failures < 2,
    queryFn: async ({ signal }) => {
      try {
        const result = salesReportSchema.safeParse(
          await request(orgApi("/reports/sales"), {
            signal,
            query: { from, to, timeZone, granularity: "DAY" },
          }),
        );
        if (!result.success || result.data.organizationId !== organizationId)
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}
