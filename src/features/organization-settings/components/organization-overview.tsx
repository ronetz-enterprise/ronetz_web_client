"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  countryName,
  organizationStatusLabel,
  organizationStatusTone,
} from "../model/organization";
import { useCountries, useOrganizationDetail } from "../queries/organization";
import { CountryFlag } from "./country-flag";
import { currencyLabel } from "./organization-form";
import { LocalFailure, SettingsSkeleton } from "./query-feedback";
import { SettingsRow } from "./settings-row";
import { StatusPill } from "./status-pill";
import { ApiError } from "@/lib/api-error";

/** Page Organisation : la fiche de l'organisation, en lecture, avec l'accès aux réglages. */
export function OrganizationOverview() {
  const { can } = useOrganization();
  const query = useOrganizationDetail();
  const countries = useCountries();
  if (!can("ORGANIZATION_READ"))
    return <LocalFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <SettingsSkeleton />;
  if (query.isError)
    return (
      <LocalFailure error={query.error} retry={() => void query.refetch()} />
    );
  const organization = query.data;
  const currency =
    countries.data?.find((c) => c.code === organization.country)?.currency ??
    organization.currency;
  return (
    <div className="space-y-8">
      <div>
        <SettingsRow label="Nom">
          <p className="font-medium">{organization.name}</p>
        </SettingsRow>
        <SettingsRow label="Pays">
          <p className="flex items-center gap-2 font-medium">
            <CountryFlag code={organization.country} />
            {countryName(organization.country, countries.data)}
          </p>
        </SettingsRow>
        <SettingsRow label="Devise" description="Déduite du pays.">
          <p className="font-medium">{currencyLabel(currency)}</p>
        </SettingsRow>
        <SettingsRow label="Statut">
          <StatusPill
            label={organizationStatusLabel[organization.status]}
            tone={organizationStatusTone[organization.status]}
          />
        </SettingsRow>
        <SettingsRow label="Créée le" className="border-b-0">
          <p className="font-medium">{formatDate(organization.createdAt)}</p>
        </SettingsRow>
      </div>
      <ul className="divide-y rounded-lg border bg-card">
        {[
          {
            label: "Réglages de l’organisation",
            hint: "Nom, pays et devise.",
            href: routes.settingsGeneral(),
          },
          {
            label: "Membres",
            hint: "Les personnes qui ont accès à l’organisation.",
            href: routes.settingsMembers(),
          },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span>
                <span className="block text-sm font-medium">{link.label}</span>
                <span className="block text-sm text-muted-foreground">
                  {link.hint}
                </span>
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={1.75}
                className="size-4 text-muted-foreground"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
