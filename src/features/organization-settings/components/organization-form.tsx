"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { zodResolver } from "@/lib/form-utils";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  ORGANIZATION_RENAME_AVAILABLE,
  countryName,
  nameChanged,
  organizationNameSchema,
  organizationStatusLabel,
  organizationStatusTone,
  type OrganizationDetail,
  type OrganizationNameInput,
} from "../model/organization";
import {
  useCountries,
  useOrganizationDetail,
  useRenameOrganization,
} from "../queries/organization";
import { CountryFlag } from "./country-flag";
import { LocalFailure, SettingsSkeleton } from "./query-feedback";
import { SettingsRow } from "./settings-row";
import { StatusPill } from "./status-pill";

/** Réglages généraux, modèle « Réglages » : libellé à gauche, contrôle à droite, filets entre lignes. */
export function OrganizationForm() {
  const { can } = useOrganization();
  const query = useOrganizationDetail();
  if (!can("ORGANIZATION_READ"))
    return <LocalFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <SettingsSkeleton />;
  if (query.isError)
    return (
      <LocalFailure error={query.error} retry={() => void query.refetch()} />
    );
  return (
    <OrganizationFields
      organization={query.data}
      editable={ORGANIZATION_RENAME_AVAILABLE && can("ORGANIZATION_UPDATE")}
    />
  );
}

export function OrganizationFields({
  organization,
  editable,
}: {
  organization: OrganizationDetail;
  editable: boolean;
}) {
  const countries = useCountries();
  const rename = useRenameOrganization();
  const form = useForm<OrganizationNameInput>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: organization.name },
  });
  const draft = useWatch({ control: form.control, name: "name" });
  const dirty = nameChanged(organization.name, draft ?? "");

  // Une valeur renvoyée par le serveur (après enregistrement ou rafraîchissement) remet le formulaire à zéro.
  useEffect(() => {
    form.reset({ name: organization.name });
  }, [organization.name, form]);

  const country = countries.data?.find((c) => c.code === organization.country);
  const currency = country?.currency ?? organization.currency;

  const submit = form.handleSubmit(async (values) => {
    try {
      await rename.mutateAsync(values);
      toast.success("Le nom de l’organisation est enregistré.");
    } catch (error) {
      form.setError("name", { message: toUserMessage(error) });
    }
  });

  return (
    <form onSubmit={submit} noValidate aria-label="Réglages de l’organisation">
      <SettingsRow
        label="Nom de l’organisation"
        htmlFor={editable ? "organization-name" : undefined}
        description="Le nom que voient vos clients et votre équipe."
      >
        {editable ? (
          <div className="max-w-sm space-y-1.5">
            <Input
              id="organization-name"
              className="h-11 sm:h-9"
              autoComplete="organization"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby="organization-name-error"
              {...form.register("name")}
            />
            <p
              id="organization-name-error"
              role="alert"
              className="min-h-5 text-sm text-destructive"
            >
              {form.formState.errors.name?.message}
            </p>
          </div>
        ) : (
          <div>
            <p id="organization-name" className="font-medium">
              {organization.name}
            </p>
            <p className="mt-1 text-muted-foreground">
              La modification du nom sera bientôt disponible.
            </p>
          </div>
        )}
      </SettingsRow>
      <SettingsRow
        label="Pays"
        description="Le pays fixe la devise et le fuseau horaire de vos sites."
      >
        <p className="flex items-center gap-2 font-medium">
          <CountryFlag code={organization.country} />
          {countryName(organization.country, countries.data)}
        </p>
        <p className="mt-1 text-muted-foreground">
          Le Cameroun est le seul pays ouvert pour l’instant.
        </p>
      </SettingsRow>
      <SettingsRow
        label="Devise"
        description="Déduite du pays, elle ne se modifie pas."
      >
        <p className="font-medium">{currencyLabel(currency)}</p>
      </SettingsRow>
      <SettingsRow label="Statut">
        <StatusPill
          label={organizationStatusLabel[organization.status]}
          tone={organizationStatusTone[organization.status]}
        />
      </SettingsRow>
      {editable ? (
        <div className="flex justify-end gap-2 pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:h-9"
            disabled={!dirty || rename.isPending}
            onClick={() => form.reset({ name: organization.name })}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="h-11 sm:h-9"
            disabled={!dirty || rename.isPending}
          >
            {rename.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

/** « Franc CFA (XAF) » pour les devises connues, sinon le code seul. */
export function currencyLabel(code: string) {
  try {
    const name = new Intl.DisplayNames("fr", { type: "currency" }).of(code);
    return name && name !== code ? `${capitalize(name)} (${code})` : code;
  } catch {
    return code;
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
