"use client";

import { useRef } from "react";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import {
  accessTransitions,
  type AccessTransition,
} from "../api/access-endpoints";
import { type AccessGrant } from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import { accessKeys, parseGrant } from "../queries/access-grants";

export type AccessChange = {
  transition: AccessTransition;
  accessGrantId: string;
};

/**
 * Suspension, reprise, annulation et relance de l'activation.
 *
 * Aucun état optimiste : la réponse du backend fait foi. L'état courant est relu dans le cache
 * avant l'appel (jamais d'action à l'aveugle), le double clic est bloqué, et tout le cache du
 * domaine est invalidé après coup. Le corps est vide : le contrat n'accepte aucun motif.
 */
export function useAccessChanges() {
  const { request } = useAuth();
  const { organizationId, membership } = useOrganization();
  const client = useQueryClient();
  const lock = useRef(false);
  const mutationKey = accessKeys.mutation(organizationId);
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation<AccessGrant, unknown, AccessChange>({
    mutationKey,
    retry: false,
    mutationFn: async ({ transition, accessGrantId }) => {
      if (!z.uuid().safeParse(accessGrantId).success)
        throw new ApiError("http", 404);
      const current = client.getQueryData<AccessGrant>(
        accessKeys.detail(organizationId, accessGrantId),
      );
      if (!current || current.organizationId !== organizationId)
        throw new ApiError("http", 403);
      const permissions = accessPermissions(membership, current);
      const allowed: Record<AccessTransition, boolean> = {
        suspend: permissions.canSuspendAccess,
        resume: permissions.canResumeAccess,
        revoke: permissions.canRevokeAccess,
        retryProjection: permissions.canRetryProvisioning,
      };
      if (!allowed[transition]) throw new ApiError("http", 403);
      const route = accessTransitions[transition](accessGrantId);
      return parseGrant(
        await request(route.path, { method: route.method }),
        organizationId,
        accessGrantId,
      );
    },
    onSuccess: (grant) => {
      client.setQueryData(
        accessKeys.detail(organizationId, grant.accessGrantId),
        grant,
      );
    },
    onSettled: async () => {
      await client.invalidateQueries({
        queryKey: accessKeys.all(organizationId),
      });
    },
  });
  return {
    ...mutation,
    pending: busy || mutation.isPending,
    change: async (value: AccessChange) => {
      if (lock.current || client.isMutating({ mutationKey }))
        return { applied: false as const };
      lock.current = true;
      try {
        const grant = await mutation.mutateAsync(value);
        return { applied: true as const, grant };
      } finally {
        lock.current = false;
      }
    },
  };
}
