"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  buildCommand,
  fetchCurrency,
  fetchOffer,
  fetchSiteOffers,
  fetchSites,
  sendCommand,
  type Change,
} from "../api/offers-api";
import {
  offerCapabilities,
  type AdminOffer,
  type SiteLite,
} from "../model/admin";

export const offerKeys = {
  all: (org: string) => ["org", org, "offers"] as const,
  sites: (org: string) => ["org", org, "offers", "sites"] as const,
  currency: (org: string) => ["org", org, "offers", "currency"] as const,
  list: (org: string, site: string) =>
    ["org", org, "offers", "list", site] as const,
  detail: (org: string, id: string) =>
    ["org", org, "offers", "detail", id] as const,
};

/** Le gérant de l'organisation (seul rôle) : toutes les écritures du domaine l'exigent. */
export function useOfferAccess() {
  const { membership } = useOrganization();
  return offerCapabilities({
    role: membership.role,
    membershipStatus: membership.membershipStatus,
    organizationStatus: membership.organizationStatus,
    organizationId: membership.organizationId,
  });
}

export function useSitesLookup() {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: offerKeys.sites(organizationId),
    staleTime: 0,
    queryFn: ({ signal }) => fetchSites(request, organizationId, signal),
  });
}

export function useCurrency() {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: offerKeys.currency(organizationId),
    staleTime: 60_000,
    queryFn: ({ signal }) => fetchCurrency(request, organizationId, signal),
  });
}

export function useSiteOffers(siteId: string) {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: offerKeys.list(organizationId, siteId),
    staleTime: 0,
    queryFn: ({ signal }) =>
      fetchSiteOffers(request, organizationId, siteId, 0, 100, signal),
  });
}

export type OfferRow = { offer: AdminOffer; site: SiteLite };

/** Toutes les offres : le serveur ne liste que par site, on fusionne les sites (100 offres chacun). */
export function useAllOffers(sites: SiteLite[] | undefined) {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  return useQueries({
    queries: (sites ?? []).map((site) => ({
      queryKey: offerKeys.list(organizationId, site.id),
      staleTime: 0,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchSiteOffers(request, organizationId, site.id, 0, 100, signal),
    })),
    combine: (results) => ({
      pending: results.some((r) => r.isPending),
      error: results.find((r) => r.error)?.error ?? null,
      refetch: () => Promise.all(results.map((r) => r.refetch())),
      rows: (sites ?? []).flatMap((site, i) =>
        (results[i]?.data?.content ?? []).map((offer) => ({ offer, site })),
      ) as OfferRow[],
      truncated: results.some(
        (r) =>
          r.data &&
          BigInt(r.data.totalElements) > BigInt(r.data.content.length),
      ),
    }),
  });
}

export function useOffer(offerId: string) {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: offerKeys.detail(organizationId, offerId),
    staleTime: 0,
    queryFn: ({ signal }) =>
      fetchOffer(request, organizationId, offerId, signal),
  });
}

/**
 * Modifie ou crée une offre. Avant d'envoyer, relit l'offre : si elle a changé depuis l'écran
 * du gérant (autre onglet, autre appareil), on refuse (409) plutôt que d'écraser.
 */
export function useOfferChange() {
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  const client = useQueryClient();
  const mutation = useMutation({
    retry: false,
    mutationFn: async (change: Change) => {
      if (change.action !== "create") {
        const current = await fetchOffer(
          request,
          organizationId,
          change.offer.offerId,
        );
        if (current.updatedAt !== change.offer.updatedAt)
          throw new ApiError("http", 409);
      }
      const siteId =
        change.action === "create" ? change.siteId : change.offer.siteId;
      const cmd = buildCommand(change, organizationId);
      return sendCommand(
        request,
        cmd,
        organizationId,
        siteId,
        change.action === "create" ? undefined : change.offer.offerId,
      );
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: offerKeys.all(organizationId) }),
  });
  return mutation;
}
