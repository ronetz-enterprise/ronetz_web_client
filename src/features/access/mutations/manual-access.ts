"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import { accessGrantSchema, type AccessGrant } from "../model/access-grant";
import {
  accessIssuanceResultSchema,
  type AccessIssuanceResult,
} from "../model/manual-access";
import { accessPermissions } from "../permissions/access-permissions";
import { accessKeys } from "../queries/access-grants";

/** Résultat utile au composant : le droit créé et, une seule fois, le secret. */
export type ManualAccessOutcome = AccessIssuanceResult & { grant: AccessGrant };

/** Corps de politique tel que le backend l'attend (secondes, octets, bit/s ; null = illimité). */
export type IssueRequest = {
  siteId: string;
  body: {
    subjectType: string;
    subjectId: string | null;
    activationMode: string;
    policy: {
      validitySeconds: number;
      dataAllowanceBytes: number | null;
      downloadLimitBps: number | null;
      uploadLimitBps: number | null;
      maxConcurrentSessions: number;
    };
  };
};

/**
 * Émission manuelle d'un accès.
 *
 * La clé d'idempotence est créée une fois par tentative et gardée tant que le formulaire vit :
 * un rejeu de la même clé renvoie l'accès existant, sans mot de passe. La réponse est
 * sensible : elle n'entre dans aucun cache de requêtes, ni stockage, ni adresse. Seuls
 * l'identifiant et le mot de passe (ou le jeton de remise) restent dans l'état du composant.
 */
export function useManualAccess() {
  const { request } = useAuth();
  const { organizationId, membership, orgApi } = useOrganization();
  const client = useQueryClient();
  const lock = useRef(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const mutation = useMutation<ManualAccessOutcome, unknown, IssueRequest>({
    retry: false,
    mutationFn: async ({ siteId, body }) => {
      if (!accessPermissions(membership).canCreateManualAccess)
        throw new ApiError("http", 403);
      const value = await request(accessEndpoints.manualGrant(orgApi, siteId), {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body,
      });
      const grant = accessGrantSchema.safeParse(
        (value as { grant?: unknown } | null)?.grant,
      );
      const result = accessIssuanceResultSchema.safeParse(value);
      if (
        !grant.success ||
        !result.success ||
        grant.data.organizationId !== organizationId ||
        grant.data.siteId !== siteId
      )
        throw new ApiError("invalid-response");
      return { ...result.data, grant: grant.data };
    },
    onSuccess: async (outcome) => {
      client.setQueryData(
        accessKeys.detail(organizationId, outcome.grant.accessGrantId),
        outcome.grant,
      );
      await client.invalidateQueries({
        queryKey: accessKeys.all(organizationId),
      });
    },
  });
  return {
    ...mutation,
    idempotencyKey,
    /** Nouvelle clé après un accès accepté : le prochain accès est une nouvelle tentative. */
    rotate: () => setIdempotencyKey(crypto.randomUUID()),
    issue: async (request: IssueRequest) => {
      if (lock.current || mutation.isPending) return null;
      lock.current = true;
      try {
        return await mutation.mutateAsync(request);
      } finally {
        lock.current = false;
      }
    },
  };
}
