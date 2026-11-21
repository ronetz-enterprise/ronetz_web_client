"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import {
  siteCapabilities,
  siteFormSchema,
  siteSchema,
  toCreateBody,
  type Site,
  type SiteAction,
  type SiteFormValues,
} from "../model/site";

export const siteKeys = {
  all: (org: string) => ["org", org, "sites"] as const,
  list: (org: string) => ["org", org, "sites", "list"] as const,
  detail: (org: string, id: string) =>
    ["org", org, "sites", "detail", id] as const,
};

export function parseSite(value: unknown, org: string, id?: string) {
  const parsed = siteSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.organizationId !== org ||
    (id && parsed.data.id !== id)
  )
    throw new ApiError("invalid-response");
  return parsed.data;
}

export function parseSites(value: unknown, org: string) {
  const result = z.array(siteSchema).safeParse(value);
  if (
    !result.success ||
    result.data.some((s) => s.organizationId !== org) ||
    new Set(result.data.map((s) => s.id)).size !== result.data.length
  )
    throw new ApiError("invalid-response");
  return result.data;
}

export function useSites() {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    queryKey: siteKeys.list(organizationId),
    enabled: siteCapabilities(membership).canViewSites,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) =>
      parseSites(await request(orgApi("/sites"), { signal }), organizationId),
  });
}

export function useSite(id: string) {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    queryKey: siteKeys.detail(organizationId, id),
    enabled: siteCapabilities(membership).canViewSites,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      if (!z.uuid().safeParse(id).success) throw new ApiError("http", 404);
      return parseSite(
        await request(orgApi(`/sites/${id}`), { signal }),
        organizationId,
        id,
      );
    },
  });
}

export type SiteChange =
  | { action: "create"; values: SiteFormValues }
  | { action: "update"; site: Site; values: Partial<SiteFormValues> }
  | { action: SiteAction; site: Site };

export function useSiteChange() {
  const { request } = useAuth();
  const client = useQueryClient();
  const { organizationId, orgApi, membership } = useOrganization();
  return useMutation({
    retry: false,
    mutationFn: async (change: SiteChange) => {
      const caps = siteCapabilities(
        membership,
        "site" in change ? change.site : undefined,
      );
      const allowed =
        change.action === "create"
          ? caps.canCreateSite
          : change.action === "update"
            ? caps.canEditSite
            : caps[change.action];
      if (!allowed) throw new ApiError("http", 403);
      if (change.action === "create")
        return parseSite(
          await request(orgApi("/sites"), {
            method: "POST",
            body: toCreateBody(change.values),
          }),
          organizationId,
        );
      const target = orgApi(`/sites/${z.uuid().parse(change.site.id)}`);
      if (change.action === "update")
        return parseSite(
          await request(target, {
            method: "PATCH",
            body: siteFormSchema.partial().parse(change.values),
          }),
          organizationId,
          change.site.id,
        );
      await request(
        target +
          (change.action === "suspend"
            ? "/suspension"
            : change.action === "reactivate"
              ? "/reactivation"
              : ""),
        { method: change.action === "close" ? "DELETE" : "POST" },
      );
      return null;
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: siteKeys.all(organizationId) }),
  });
}
