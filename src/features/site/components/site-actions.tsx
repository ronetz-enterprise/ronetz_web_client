"use client";

import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { routes } from "@/lib/routes";
import { siteCapabilities } from "../model/site";
import { LinkButton } from "./feedback";

export function SitesHeaderAction() {
  const { membership } = useOrganization();
  return siteCapabilities(membership).canCreateSite ? (
    <LinkButton href={routes.siteNew()} variant="outline">
      + Créer un site
    </LinkButton>
  ) : null;
}
