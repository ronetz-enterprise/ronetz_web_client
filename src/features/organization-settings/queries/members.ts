"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  membershipKeys,
  organizationCapabilities,
} from "@/features/memberships";
import { ApiError } from "@/lib/api-error";
import { actionPath, memberSchema, type MemberAction } from "../model/members";
import { orgSettingsKeys } from "./organization";

export function useOrganizationMembers() {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    queryKey: orgSettingsKeys.members(organizationId),
    enabled: organizationCapabilities(membership).canViewMembers,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const parsed = z
        .array(memberSchema)
        .safeParse(await request(orgApi("/memberships"), { signal }));
      if (
        !parsed.success ||
        parsed.data.some((m) => m.organizationId !== organizationId) ||
        new Set(parsed.data.map((m) => m.id)).size !== parsed.data.length
      )
        throw new ApiError("invalid-response");
      return parsed.data;
    },
  });
}

export function useMemberChange() {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (change: { action: MemberAction; userId: string }) => {
      if (!organizationCapabilities(membership).canManageMembers)
        throw new ApiError("http", 403);
      const userId = z.uuid().parse(change.userId);
      await request(actionPath(orgApi("/memberships"), userId, change.action), {
        method: change.action === "revoke" ? "DELETE" : "PATCH",
      });
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: orgSettingsKeys.members(organizationId),
        }),
        client.invalidateQueries({ queryKey: membershipKeys.mine }),
        client.invalidateQueries({
          queryKey: membershipKeys.access(organizationId),
        }),
      ]);
    },
  });
}
