"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useOfferChange } from "./use-offers";
import { offerErrorMessage } from "../model/errors";
import {
  policySchema,
  type AdminOffer,
  type CreateValues,
  type EditKind,
  type PolicyValues,
} from "../model/admin";

export const policyOf = (o: AdminOffer): PolicyValues => ({
  validitySeconds: o.accessPolicy.validitySeconds,
  dataAllowanceBytes: o.accessPolicy.dataAllowanceBytes ?? "",
  downloadLimitBps: o.accessPolicy.downloadLimitBps ?? "",
  uploadLimitBps: o.accessPolicy.uploadLimitBps ?? "",
  maxConcurrentSessions: o.accessPolicy.maxConcurrentSessions,
});

/** Valide un réglage d'accès modifié, les autres gardant leur valeur enregistrée. */
export function mergePolicy(offer: AdminOffer, patch: Partial<PolicyValues>) {
  return policySchema.safeParse({ ...policyOf(offer), ...patch });
}

/**
 * Édition champ par champ : chaque ✓ envoie une seule modification, sur la dernière version
 * connue de l'offre (celle renvoyée par l'enregistrement précédent).
 */
export function useOfferEditor(offer: AdminOffer, currency: string) {
  const mutation = useOfferChange();
  const [saved, setSaved] = useState<AdminOffer | null>(null);
  // Mode « tout enregistrer » : les champs déposent leur modification, puis flush() envoie le lot.
  const batch = useRef<
    { action: EditKind; values: Partial<CreateValues> }[] | null
  >(null);
  // Dernière version connue : celle renvoyée par le dernier enregistrement tant que la lecture n'a pas rattrapé.
  const baseline =
    saved &&
    saved.offerId === offer.offerId &&
    saved.updatedAt > offer.updatedAt
      ? saved
      : offer;

  async function send(
    action: EditKind,
    values: Partial<CreateValues>,
    on: AdminOffer,
  ) {
    return mutation.mutateAsync({ action, offer: on, values, currency });
  }

  async function save(
    action: EditKind,
    values: Partial<CreateValues>,
  ): Promise<string | null> {
    if (batch.current) {
      batch.current.push({ action, values });
      return null;
    }
    try {
      const next = await send(action, values, baseline);
      setSaved(next);
      toast.success("Modification enregistrée");
      return null;
    } catch (error) {
      return offerErrorMessage(error);
    }
  }

  function begin() {
    batch.current = [];
  }

  /** Envoie le lot : une requête par nature de modification, réglages d'accès fusionnés. */
  async function flush(): Promise<string | null> {
    const items = batch.current ?? [];
    batch.current = null;
    if (!items.length) return null;
    const base = policyOf(baseline);
    const grouped = new Map<EditKind, Partial<CreateValues>>();
    for (const { action, values } of items) {
      if (action === "policy") {
        // Chaque champ envoie le réglage complet : on ne garde que ce qu'il change.
        const diff = Object.fromEntries(
          Object.entries(values).filter(
            ([k, v]) => String(v) !== String(base[k as keyof PolicyValues]),
          ),
        );
        grouped.set("policy", { ...(grouped.get("policy") ?? {}), ...diff });
      } else {
        grouped.set(action, { ...(grouped.get(action) ?? {}), ...values });
      }
    }
    let current = baseline;
    try {
      for (const [action, values] of grouped) {
        const payload =
          action === "policy"
            ? (() => {
                const merged = mergePolicy(
                  current,
                  values as Partial<PolicyValues>,
                );
                if (!merged.success) throw new Error("policy");
                return merged.data;
              })()
            : values;
        current = await send(action, payload, current);
      }
      setSaved(current);
      toast.success("Modifications enregistrées");
      return null;
    } catch (error) {
      if (current !== baseline) setSaved(current);
      return error instanceof Error && error.message === "policy"
        ? "Un réglage d’accès n’est pas valide."
        : offerErrorMessage(error);
    }
  }

  return {
    save,
    begin,
    flush,
    queued: () => batch.current?.length ?? 0,
    flushCancel: () => {
      batch.current = null;
    },
    pending: mutation.isPending,
    baseline,
  };
}
