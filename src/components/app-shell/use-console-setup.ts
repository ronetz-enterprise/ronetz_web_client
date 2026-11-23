"use client";

import type { ChecklistStep } from "@/components/start-checklist";
import { useAccessGrantList } from "@/features/access/queries/access-grants";
import {
  useAllOffers,
  useSitesLookup,
} from "@/features/offer/hooks/use-offers";
import { useRouterList } from "@/features/router/queries/routers";

import { buildSetupSteps } from "./setup-steps";

/**
 * Étapes du guide pour le compte connecté. `null` tant que les données ne sont pas toutes là :
 * on n'affiche pas un guide faux pendant le chargement.
 */
export function useConsoleSetupSteps(): ChecklistStep[] | null {
  const sites = useSitesLookup();
  const routers = useRouterList(0);
  const offers = useAllOffers(sites.data);
  const access = useAccessGrantList(0, 1);

  if (
    sites.isPending ||
    routers.isPending ||
    offers.pending ||
    access.isPending
  ) {
    return null;
  }
  return buildSetupSteps({
    hasSite: (sites.data?.length ?? 0) > 0,
    firstSiteId: sites.data?.[0]?.id ?? null,
    hasRouter: (routers.data?.content.length ?? 0) > 0,
    hasOffer: offers.rows.length > 0,
    hasAccess: (access.data?.content.length ?? 0) > 0,
  });
}
