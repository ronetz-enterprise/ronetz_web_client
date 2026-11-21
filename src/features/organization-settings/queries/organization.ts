"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import {
  countrySchema,
  organizationDetailSchema,
  type OrganizationNameInput,
} from "../model/organization";
import { z } from "zod";

export const orgSettingsKeys = {
  detail: (id: string) => ["organization", id, "detail"] as const,
  members: (id: string) => ["organization", id, "memberships"] as const,
  countries: ["public", "countries"] as const,
};

export function useOrganizationDetail() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  return useQuery({
    queryKey: orgSettingsKeys.detail(organizationId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const parsed = organizationDetailSchema.safeParse(
        await request(orgApi(), { signal }),
      );
      if (!parsed.success || parsed.data.id !== organizationId)
        throw new ApiError("invalid-response");
      return parsed.data;
    },
  });
}

/** Catalogue public des pays (nom, devise déduite). Échec non bloquant : on retombe sur le code. */
export function useCountries() {
  const { request } = useAuth();
  return useQuery({
    queryKey: orgSettingsKeys.countries,
    staleTime: 3_600_000,
    queryFn: async ({ signal }) => {
      const parsed = z
        .array(countrySchema)
        .safeParse(await request("/api/public/countries", { signal }));
      if (!parsed.success) throw new ApiError("invalid-response");
      return parsed.data;
    },
  });
}

/** Renommer l'organisation. Inutilisée tant que ORGANIZATION_RENAME_AVAILABLE est faux. */
export function useRenameOrganization() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrganizationNameInput) => {
      const parsed = organizationDetailSchema.safeParse(
        await request(orgApi(), {
          method: "PATCH",
          body: { name: input.name.trim() },
        }),
      );
      if (!parsed.success) throw new ApiError("invalid-response");
      return parsed.data;
    },
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: orgSettingsKeys.detail(organizationId),
      });
      await client.invalidateQueries({ queryKey: ["memberships", "current"] });
    },
  });
}
