"use client";

import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { LinkButton } from "@/features/site/components/feedback";
import { routes } from "@/lib/routes";
import { routerCapabilities } from "../model/router";

export function RoutersHeaderAction() {
  const { membership } = useOrganization();
  return routerCapabilities(membership).canCreateRouter ? (
    <LinkButton href={routes.routerNew()} variant="outline">
      + Ajouter un routeur
    </LinkButton>
  ) : null;
}
