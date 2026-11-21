"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import {
  accessGrantPageSchema,
  accessGrantSchema,
  isAppliedProjection,
  isFailedProjection,
  isTerminalGrant,
  type AccessGrant,
} from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";

export const accessKeys = {
  /** Tout le domaine d'une organisation : sert à invalider après une création ou un changement. */
  all: (organizationId: string) => ["access", organizationId] as const,
  list: (organizationId: string, page: number, size: number) =>
    ["access", organizationId, "list", { page, size }] as const,
  detail: (organizationId: string, accessGrantId: string) =>
    ["access", organizationId, "detail", accessGrantId] as const,
  sites: (organizationId: string) =>
    ["access", organizationId, "sites"] as const,
  offers: (organizationId: string, siteId: string) =>
    ["access", organizationId, "offers", siteId] as const,
  mutation: (organizationId: string) =>
    ["access", organizationId, "mutation"] as const,
};

export const ACCESS_PAGE_SIZE = 20;

/** Un droit d'une autre organisation ou un identifiant incohérent n'est jamais rendu. */
export function parseGrant(
  value: unknown,
  organizationId: string,
  accessGrantId?: string,
) {
  const parsed = accessGrantSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.organizationId !== organizationId ||
    (accessGrantId && parsed.data.accessGrantId !== accessGrantId)
  )
    throw new ApiError(
      accessGrantId ? "http" : "invalid-response",
      accessGrantId ? 404 : undefined,
    );
  return parsed.data;
}

/** Liste des accès de l'organisation : le serveur ne filtre que par page. */
export function useAccessGrantList(page: number, size = ACCESS_PAGE_SIZE) {
  const { request } = useAuth();
  const { organizationId, membership, orgApi } = useOrganization();
  return useQuery({
    queryKey: accessKeys.list(organizationId, page, size),
    enabled: accessPermissions(membership).canViewAccessGrants,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const result = accessGrantPageSchema.safeParse(
        await request(accessEndpoints.list(orgApi), {
          signal,
          query: { page: String(page), size: String(size) },
        }),
      );
      if (
        !result.success ||
        result.data.content.length > size ||
        result.data.content.some((g) => g.organizationId !== organizationId)
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

/**
 * Lecture d'un accès. Tant que l'activation sur le réseau n'est pas terminée, la page se
 * relit toute seule (5 s, 15 s après une erreur) pendant 5 minutes au plus.
 */
export function useAccessGrant(accessGrantId: string | null) {
  const { request } = useAuth();
  const { organizationId, membership } = useOrganization();
  return useQuery<AccessGrant>({
    queryKey: accessKeys.detail(organizationId, accessGrantId ?? "none"),
    enabled:
      accessGrantId !== null &&
      accessPermissions(membership).canViewAccessDetails,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const grant = query.state.data as AccessGrant | undefined;
      if (!grant || !isTracking(grant)) return false;
      if (
        query.state.dataUpdatedAt &&
        Date.now() - new Date(grant.issuedAt).getTime() > 300_000
      )
        return false;
      return query.state.error ? 15_000 : 5_000;
    },
    queryFn: async ({ signal }) => {
      if (!accessGrantId || !z.uuid().safeParse(accessGrantId).success)
        throw new ApiError("http", 404);
      return parseGrant(
        await request(accessEndpoints.detail(accessGrantId), { signal }),
        organizationId,
        accessGrantId,
      );
    },
  });
}

/** Un accès se relit tant que le réseau n'a ni confirmé ni échoué. */
export function isTracking(grant: AccessGrant) {
  if (isTerminalGrant(grant)) return false;
  if (isAppliedProjection(grant.projectionStatus)) return false;
  if (isFailedProjection(grant.projectionStatus)) return false;
  return (
    grant.status === "PENDING_PROVISIONING" ||
    (grant.status === "ACTIVE" && grant.projectionStatus === "PENDING")
  );
}

const siteSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  status: z.string(),
});
export type AccessSite = z.infer<typeof siteSchema>;

/** Sites de l'organisation : sert aux noms dans la liste et au choix dans la vente. */
export function useAccessSites() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  return useQuery({
    queryKey: accessKeys.sites(organizationId),
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = z
        .array(siteSchema)
        .safeParse(await request(orgApi("/sites"), { signal }));
      if (!result.success) throw new ApiError("invalid-response");
      return result.data.filter((s) => s.organizationId === organizationId);
    },
  });
}

const numberish = z.union([z.number(), z.string()]).transform(Number);
const offerSchema = z.object({
  offerId: z.uuid(),
  siteId: z.uuid(),
  name: z.string(),
  status: z.string(),
  price: z.object({ amount: numberish, currencyCode: z.string() }),
  accessPolicy: z.object({
    validitySeconds: z.number().int(),
    dataAllowanceBytes: z.number().nullable(),
    downloadLimitBps: z.number().nullable(),
    uploadLimitBps: z.number().nullable(),
    maxConcurrentSessions: z.number().int(),
  }),
  displayOrder: z.number().int(),
});
export type AccessOffer = z.infer<typeof offerSchema>;

/**
 * Offres publiées d'un site : la durée et les conditions d'un accès vendu au comptoir
 * viennent de l'offre, jamais d'une saisie libre.
 */
export function useAccessOffers(siteId: string | null) {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  return useQuery({
    queryKey: accessKeys.offers(organizationId, siteId ?? "none"),
    enabled: siteId !== null,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const result = z.object({ content: z.array(offerSchema) }).safeParse(
        await request(orgApi(`/sites/${siteId}/offers`), {
          signal,
          query: { page: "0", size: "100" },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data.content
        .filter((o) => o.status === "PUBLISHED")
        .sort((a, b) => a.displayOrder - b.displayOrder);
    },
  });
}

/** Accès d'un site, les plus récents d'abord (100 au plus) : de quoi résumer son activité. */
export function useSiteAccessGrants(siteId: string) {
  const { request } = useAuth();
  const { organizationId, membership, orgApi } = useOrganization();
  return useQuery({
    queryKey: ["access", organizationId, "site", siteId] as const,
    enabled: accessPermissions(membership).canViewAccessGrants,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const result = accessGrantPageSchema.safeParse(
        await request(accessEndpoints.siteList(orgApi, siteId), {
          signal,
          query: { page: "0", size: "100" },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return [...result.data.content].sort((a, b) =>
        b.issuedAt.localeCompare(a.issuedAt),
      );
    },
  });
}
