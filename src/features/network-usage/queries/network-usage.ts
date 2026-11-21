"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import {
  accessReportSchema,
  periodError,
  routerUsageSchema,
  SITE_REPORT_SIZE,
  sitePerformanceSchema,
  type UsageFilters,
} from "../model/network-usage";

/** Les rapports du backend exigent le rôle propriétaire. */
export function useCanViewUsage() {
  const { membership } = useOrganization();
  return membership.role === "OWNER";
}

export function useAccessUsageSummary(filters: UsageFilters) {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const allowed = useCanViewUsage();
  return useQuery({
    queryKey: ["org", organizationId, "usage", "summary", filters] as const,
    enabled: allowed && periodError(filters) === null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const query: Record<string, string> = {
        from: filters.from,
        to: filters.to,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (filters.siteId) query.siteId = filters.siteId;
      const result = accessReportSchema.safeParse(
        await request(orgApi("/reports/access"), { signal, query }),
      );
      // Un agrégat d'une autre organisation ou d'une autre période est rejeté.
      if (
        !result.success ||
        result.data.organizationId !== organizationId ||
        result.data.period.from !== filters.from ||
        result.data.period.to !== filters.to
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useRouterUsage(page: number, size: number) {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const allowed = useCanViewUsage();
  return useQuery({
    queryKey: [
      "org",
      organizationId,
      "usage",
      "routers",
      { page, size },
    ] as const,
    enabled: allowed,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = z.array(routerUsageSchema).safeParse(
        await request(orgApi("/reports/routers"), {
          signal,
          query: { page: String(page), size: String(size) },
        }),
      );
      if (
        !result.success ||
        result.data.length > size ||
        result.data.some((row) => row.organizationId !== organizationId)
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useSitePerformance() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const allowed = useCanViewUsage();
  return useQuery({
    queryKey: ["org", organizationId, "usage", "sites"] as const,
    enabled: allowed,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = z.array(sitePerformanceSchema).safeParse(
        await request(orgApi("/reports/sites"), {
          signal,
          query: { page: "0", size: String(SITE_REPORT_SIZE) },
        }),
      );
      if (
        !result.success ||
        result.data.some((row) => row.organizationId !== organizationId)
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}
