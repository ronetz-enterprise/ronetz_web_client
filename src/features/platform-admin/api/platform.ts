"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { ApiError } from "@/lib/api-error";
import {
  auditPageSchema,
  dashboardSchema,
  organizationConfirmation,
  organizationDetailSchema,
  organizationPageSchema,
  organizationSummarySchema,
  paymentAnomalySchema,
  platformCapabilities,
  platformSessionSchema,
  routerPageSchema,
  sitePageSchema,
  withdrawalApprovalConfirmation,
  withdrawalPageSchema,
  withdrawalSchema,
  type AnomalyAction,
  type OrganizationAction,
  type PlatformOrganization,
  type PlatformSession,
  type WithdrawalDecision,
} from "../model/platform";

export const platformKeys = {
  all: ["platform"] as const,
  session: ["platform", "session"] as const,
  dashboard: ["platform", "dashboard"] as const,
  organizations: (filters: object, page: number, size: number) =>
    ["platform", "organizations", filters, page, size] as const,
  organization: (id: string) => ["platform", "organization", id] as const,
  sites: (filters: object, page: number, size: number) =>
    ["platform", "sites", filters, page, size] as const,
  routers: (filters: object, page: number, size: number) =>
    ["platform", "routers", filters, page, size] as const,
  audit: (filters: object, page: number, size: number) =>
    ["platform", "audit", filters, page, size] as const,
  withdrawals: (status: string, page: number) =>
    ["platform", "withdrawals", status, page] as const,
  anomalies: ["platform", "anomalies"] as const,
};

/** Un espace plateforme n'appartient à aucune organisation : pas de préfixe d'organisation. */
const endpoints = {
  session: "/api/platform/session",
  dashboard: "/api/platform/dashboard",
  organizations: "/api/platform/organizations",
  sites: "/api/platform/sites",
  routers: "/api/platform/routers",
  audit: "/api/platform/audit-entries",
  withdrawals: "/api/platform/withdrawals",
  anomalies: "/api/platform/payment-anomalies",
} as const;

/** Ne garde que les paramètres renseignés ; « ALL » signifie « pas de filtre ». */
export function queryOf(
  params: Record<string, string | number | null | undefined>,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text && text !== "ALL") query[key] = text;
  }
  return query;
}

type PageLike = { content: { id: string }[]; page: number; size: number };

/** Une page incohérente (mauvaise page, trop d'éléments, doublons) est refusée. */
export function readPage<S extends z.ZodType<PageLike>>(
  schema: S,
  value: unknown,
  page: number,
  size: number,
): z.output<S> {
  const parsed = schema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.page !== page ||
    parsed.data.size !== size ||
    parsed.data.content.length > size ||
    new Set(parsed.data.content.map((item) => item.id)).size !==
      parsed.data.content.length
  )
    throw new ApiError("invalid-response");
  return parsed.data;
}

/**
 * Permissions effectivement accordées. C'est la garde : le backend répond 403 à un compte sans
 * permission plateforme, et l'écran ne montre alors rien du contenu.
 */
export function usePlatformSession() {
  const { request, status } = useAuth();
  const signedIn = status === "authenticated" || status === "refreshing";
  return useQuery({
    queryKey: platformKeys.session,
    enabled: signedIn,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }): Promise<PlatformSession> => {
      const result = platformSessionSchema.safeParse(
        await request(endpoints.session, { signal }),
      );
      if (!result.success || !result.data.administrator)
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function usePlatformDashboard(session: PlatformSession) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.dashboard,
    enabled: platformCapabilities(session).canViewPlatform,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const result = dashboardSchema.safeParse(
        await request(endpoints.dashboard, { signal }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type OrganizationFilters = {
  status: string;
  query: string;
  sort: string;
};

export function usePlatformOrganizations(
  session: PlatformSession,
  filters: OrganizationFilters,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.organizations(filters, page, size),
    enabled: platformCapabilities(session).canReadOrganizations,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readPage(
        organizationPageSchema,
        await request(endpoints.organizations, {
          signal,
          query: queryOf({ ...filters, page, size }),
        }),
        page,
        size,
      ),
  });
}

export function usePlatformOrganization(
  session: PlatformSession,
  organizationId: string | null,
) {
  const { request } = useAuth();
  const valid = !!organizationId && z.uuid().safeParse(organizationId).success;
  return useQuery({
    queryKey: platformKeys.organization(organizationId ?? ""),
    enabled: valid && platformCapabilities(session).canReadOrganizations,
    queryFn: async ({ signal }) => {
      const result = organizationDetailSchema.safeParse(
        await request(`${endpoints.organizations}/${organizationId}`, {
          signal,
        }),
      );
      if (!result.success || result.data.id !== organizationId)
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type SiteFilters = {
  organizationId: string | null;
  status: string;
  query: string;
};

export function usePlatformSites(
  session: PlatformSession,
  filters: SiteFilters,
  page: number,
  size: number,
  enabled = true,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.sites(filters, page, size),
    enabled: enabled && platformCapabilities(session).canReadNetwork,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readPage(
        sitePageSchema,
        await request(endpoints.sites, {
          signal,
          query: queryOf({ ...filters, sort: "name", page, size }),
        }),
        page,
        size,
      ),
  });
}

export type RouterFilters = {
  organizationId: string | null;
  lifecycleStatus: string;
  connectivityStatus: string;
  query: string;
};

export function usePlatformRouters(
  session: PlatformSession,
  filters: RouterFilters,
  page: number,
  size: number,
  enabled = true,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.routers(filters, page, size),
    enabled: enabled && platformCapabilities(session).canReadNetwork,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readPage(
        routerPageSchema,
        await request(endpoints.routers, {
          signal,
          query: queryOf({ ...filters, sort: "name", page, size }),
        }),
        page,
        size,
      ),
  });
}

export type AuditFilters = {
  organizationId: string | null;
  actorType: string;
  result: string;
  severity: string;
  source: string;
  from: string;
  to: string;
};

export function usePlatformAudit(
  session: PlatformSession,
  filters: AuditFilters,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.audit(filters, page, size),
    enabled: platformCapabilities(session).canReadAudit,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readPage(
        auditPageSchema,
        await request(endpoints.audit, {
          signal,
          query: queryOf({ ...filters, sort: "occurredAt", page, size }),
        }),
        page,
        size,
      ),
  });
}

export function useOrganizationAction() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      action,
      reason,
    }: {
      organizationId: string;
      action: OrganizationAction;
      reason: string;
    }): Promise<PlatformOrganization> => {
      const result = organizationSummarySchema.safeParse(
        await request(
          `${endpoints.organizations}/${organizationId}/${action}`,
          {
            method: "POST",
            // Nouvelle clé à chaque tentative : le backend refuse le rejeu d'une clé.
            body: {
              reason,
              confirmation: organizationConfirmation[action],
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success || result.data.id !== organizationId)
        throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  });
}

export const WITHDRAWAL_PAGE_SIZE = 20;

export function usePlatformWithdrawals(
  session: PlatformSession,
  status: string,
  page: number,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.withdrawals(status, page),
    enabled: platformCapabilities(session).canViewPlatform,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readPage(
        withdrawalPageSchema,
        await request(endpoints.withdrawals, {
          signal,
          query: queryOf({ status, page, size: WITHDRAWAL_PAGE_SIZE }),
        }),
        page,
        WITHDRAWAL_PAGE_SIZE,
      ),
  });
}

export function useWithdrawalDecision() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      withdrawalId,
      decision,
      reason,
    }: {
      withdrawalId: string;
      decision: WithdrawalDecision;
      reason: string;
    }) => {
      const result = withdrawalSchema.safeParse(
        await request(
          `${endpoints.withdrawals}/${z.uuid().parse(withdrawalId)}/${decision}`,
          {
            method: "POST",
            body: {
              reason,
              confirmation:
                decision === "approve" ? withdrawalApprovalConfirmation : null,
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success || result.data.id !== withdrawalId)
        throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  });
}

export function usePaymentAnomalies(session: PlatformSession) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.anomalies,
    enabled: platformCapabilities(session).canViewPlatform,
    queryFn: async ({ signal }) => {
      const result = z.array(paymentAnomalySchema).safeParse(
        await request(endpoints.anomalies, {
          signal,
          query: { limit: "50" },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useAnomalyAction() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      action,
      reason,
    }: {
      eventId: string;
      action: AnomalyAction;
      reason: string;
    }) => {
      const result = paymentAnomalySchema.safeParse(
        await request(
          `${endpoints.anomalies}/${z.uuid().parse(eventId)}/${action}`,
          {
            method: "POST",
            body: {
              reason,
              confirmation: null,
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: platformKeys.all }),
  });
}
