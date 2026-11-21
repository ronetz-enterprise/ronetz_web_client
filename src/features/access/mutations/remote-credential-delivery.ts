"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { ApiError } from "@/lib/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import {
  issuedCredentialSchema,
  type IssuedCredential,
} from "../model/manual-access";

/** Le backend n'accepte que 10 demandes par minute : 7 s en laissent 9 dans la première. */
const POLL_INTERVAL_MS = 7_000;
const RATE_LIMITED_WAIT_MS = 30_000;
/** Au-delà, l'accès reste visible dans la liste : seul l'affichage du mot de passe est perdu. */
const GIVE_UP_AFTER_MS = 5 * 60_000;

export type RemoteCredentialState =
  | { status: "waiting" }
  | { status: "ready"; credential: IssuedCredential }
  | { status: "expired" }
  | { status: "failed"; error: unknown };

/**
 * Remise du mot de passe d'un accès préparé par le nœud du site. `503` tant que le réseau n'a
 * pas confirmé, `429` au-delà de la limite : ni l'un ni l'autre ne consomme une des 5 remises.
 * `403` : jeton expiré ou remises épuisées. Le jeton et le mot de passe ne vivent que ici.
 */
export function useRemoteCredentialDelivery(
  accessGrantId: string,
  retrievalToken: string,
): RemoteCredentialState {
  const { request } = useAuth();
  const [state, setState] = useState<RemoteCredentialState>({
    status: "waiting",
  });
  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + GIVE_UP_AFTER_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function attempt() {
      try {
        const value = await request(
          accessEndpoints.credentialDelivery(accessGrantId),
          {
            method: "POST",
            body: { token: retrievalToken },
            signal: controller.signal,
          },
        );
        const credential = issuedCredentialSchema.safeParse(value);
        setState(
          credential.success
            ? { status: "ready", credential: credential.data }
            : { status: "failed", error: new ApiError("invalid-response") },
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const rateLimited = error instanceof ApiError && error.status === 429;
        const pending =
          rateLimited ||
          (error instanceof ApiError &&
            (error.status === 503 ||
              error.kind === "network" ||
              error.kind === "timeout"));
        if (pending && Date.now() < deadline) {
          timer = setTimeout(
            () => void attempt(),
            rateLimited ? RATE_LIMITED_WAIT_MS : POLL_INTERVAL_MS,
          );
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          setState({ status: "expired" });
          return;
        }
        setState({ status: "failed", error });
      }
    }
    void attempt();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [accessGrantId, retrievalToken, request]);
  return state;
}
