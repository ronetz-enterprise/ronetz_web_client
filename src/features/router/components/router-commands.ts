"use client";

import { useState } from "react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import type { Router, RouterAction } from "../model/router";
import { useRouterChange } from "../queries/routers";

const receiptSchema = z.object({
  action: z.enum(["provision", "artifact", "suspend", "resume", "revoke"]),
  key: z.uuid(),
});
type Receipt = z.infer<typeof receiptSchema>;

/** Résultat incertain (réseau, délai, panne) : on garde la clé pour rejouer sans doublon. */
export const isUncertain = (error: unknown) =>
  error instanceof ApiError &&
  (["network", "timeout"].includes(error.kind) ||
    (error.kind === "http" && error.status >= 500));

/**
 * Envoi des actions techniques d'un routeur avec une clé d'idempotence conservée tant que
 * le résultat est incertain (rechargement de page compris).
 */
export function useRouterCommands(router: Router) {
  const { organizationId } = useOrganization();
  const mutation = useRouterChange();
  const storageKey = `ronetz.router-intent.${organizationId}.${router.id}`;
  const [receipt, setReceipt] = useState<Receipt | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const v = receiptSchema.safeParse(
        JSON.parse(sessionStorage.getItem(storageKey) ?? "null"),
      );
      return v.success ? v.data : null;
    } catch {
      return null;
    }
  });

  function save(value: Receipt | null) {
    setReceipt(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* stockage indisponible : la clé reste en mémoire */
    }
  }

  async function send(action: RouterAction) {
    const intent =
      receipt && receipt.action === action
        ? receipt
        : { action, key: crypto.randomUUID() };
    save(intent);
    try {
      await mutation.mutateAsync({ action, router, key: intent.key });
      save(null);
      return true;
    } catch (error) {
      if (!isUncertain(error)) save(null);
      return false;
    }
  }

  return {
    send,
    pending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    reset: mutation.reset,
    receipt,
  };
}
