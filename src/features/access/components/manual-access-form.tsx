"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { zodResolver } from "@/lib/form-utils";
import { routes } from "@/lib/routes";
import { accessErrorMessage } from "../formatters/errors";
import { formatValidity } from "../formatters/access";
import {
  dataUnits,
  durationUnits,
  manualAccessBody,
  manualAccessDefaults,
  manualAccessSchema,
  type ManualAccessValues,
} from "../model/manual-access";
import {
  useManualAccess,
  type ManualAccessOutcome,
} from "../mutations/manual-access";
import { accessPermissions } from "../permissions/access-permissions";
import { useAccessOffers, useAccessSites } from "../queries/access-grants";
import {
  IssuedCredentialPanel,
  RemoteCredentialPanel,
} from "./credential-panel";

const inputClass = "h-11 sm:h-9";

/**
 * Création manuelle d'un accès sur mesure (page `/access/new`) : durée et conditions libres,
 * ou reprises d'une offre. Pour une vente rapide, le tiroir « Vendre un accès » suffit.
 */
export function ManualAccessForm() {
  const { membership } = useOrganization();
  const canCreate = accessPermissions(membership).canCreateManualAccess;
  const sites = useAccessSites();
  const activeSites = useMemo(
    () => (sites.data ?? []).filter((s) => s.status === "ACTIVE"),
    [sites.data],
  );
  const issuing = useManualAccess();
  const [outcome, setOutcome] = useState<ManualAccessOutcome | null>(null);
  const form = useForm<ManualAccessValues>({
    resolver: zodResolver(manualAccessSchema),
    defaultValues: manualAccessDefaults,
  });
  const firstSiteId = activeSites[0]?.id;
  const { getValues, setValue } = form;
  useEffect(() => {
    if (firstSiteId && !getValues("siteId")) setValue("siteId", firstSiteId);
  }, [firstSiteId, getValues, setValue]);
  const siteId = form.watch("siteId") || firstSiteId || "";
  const offers = useAccessOffers(siteId || null);

  function fromOffer(offerId: string) {
    const offer = offers.data?.find((o) => o.offerId === offerId);
    if (!offer) return;
    const p = offer.accessPolicy;
    const unit = (["days", "hours", "minutes"] as const).find(
      (u) => p.validitySeconds % durationUnits[u].seconds === 0,
    )!;
    form.setValue("validityUnit", unit);
    form.setValue(
      "validityAmount",
      String(p.validitySeconds / durationUnits[unit].seconds),
    );
    form.setValue(
      "dataAmount",
      p.dataAllowanceBytes === null
        ? ""
        : String(Math.round(p.dataAllowanceBytes / dataUnits.MB.bytes)),
    );
    form.setValue("dataUnit", "MB");
    form.setValue(
      "downloadMbps",
      p.downloadLimitBps === null
        ? ""
        : String(Math.round(p.downloadLimitBps / 1_000_000)),
    );
    form.setValue(
      "uploadMbps",
      p.uploadLimitBps === null
        ? ""
        : String(Math.round(p.uploadLimitBps / 1_000_000)),
    );
    form.setValue("maxConcurrentSessions", String(p.maxConcurrentSessions));
    resetFailure();
  }
  // Après un échec, modifier le formulaire est une nouvelle tentative : nouvelle clé.
  function resetFailure() {
    if (issuing.isError) {
      issuing.rotate();
      issuing.reset();
    }
  }

  if (!canCreate)
    return (
      <Alert variant="warning">
        <AlertTitle>Création non autorisée</AlertTitle>
        <AlertDescription>
          Seul le propriétaire du compte peut créer un accès.
        </AlertDescription>
      </Alert>
    );
  if (sites.isPending) return <Skeleton className="h-64 max-w-xl rounded-lg" />;
  if (sites.isError)
    return (
      <div role="alert" className="flex max-w-xl flex-col gap-3">
        <p className="text-sm">{accessErrorMessage(sites.error)}</p>
        <Button
          variant="outline"
          className="h-11 w-fit sm:h-9"
          onClick={() => void sites.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  if (activeSites.length === 0)
    return (
      <Alert>
        <AlertTitle>Aucun site actif</AlertTitle>
        <AlertDescription>
          Créez d’abord un site pour pouvoir y créer des accès.{" "}
          <Link href={routes.siteNew()} className="text-signal underline">
            Créer un site
          </Link>
        </AlertDescription>
      </Alert>
    );

  if (outcome)
    return (
      <div className="flex max-w-xl flex-col gap-6">
        <p role="status" className="text-base font-medium">
          {outcome.created ? "Accès créé." : "Cet accès existait déjà."}
        </p>
        {outcome.credentialDelivery ? (
          <IssuedCredentialPanel credential={outcome.credentialDelivery} />
        ) : outcome.retrievalToken ? (
          <RemoteCredentialPanel
            accessGrantId={outcome.grant.accessGrantId}
            retrievalToken={outcome.retrievalToken}
          />
        ) : (
          <Alert variant="warning">
            <AlertTitle>Le mot de passe n’est plus affiché</AlertTitle>
            <AlertDescription>
              Il n’est montré qu’à la création. Annulez cet accès depuis la
              liste si vous ne l’avez pas noté.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-11 sm:h-9"
            render={
              <Link
                href={`${routes.access()}?acces=${outcome.grant.accessGrantId}`}
              />
            }
            nativeButton={false}
          >
            Voir l’accès dans la liste
          </Button>
          <Button
            variant="outline"
            className="h-11 sm:h-9"
            onClick={() => {
              setOutcome(null);
              issuing.rotate();
              issuing.reset();
              form.reset({ ...manualAccessDefaults, siteId });
            }}
          >
            Créer un autre accès
          </Button>
        </div>
      </div>
    );

  const errors = form.formState.errors;
  const failure = issuing.error
    ? accessErrorMessage(issuing.error, "create")
    : null;

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        const parsed = { ...values, siteId };
        const result = await issuing
          .issue({ siteId, body: manualAccessBody(parsed) })
          .catch(() => null);
        if (result) setOutcome(result);
      })}
    >
      <p className="text-sm text-muted-foreground">
        Le temps de l’accès commence dès sa création, pas à la première
        connexion du client.
      </p>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="access-site">Site</FieldLabel>
          <Controller
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <Select
                value={field.value || activeSites[0].id}
                onValueChange={(v) => {
                  if (v) {
                    field.onChange(v);
                    resetFailure();
                  }
                }}
              >
                <SelectTrigger
                  id="access-site"
                  className={`${inputClass} w-full`}
                >
                  <SelectValue>
                    {
                      activeSites.find(
                        (s) => s.id === (field.value || activeSites[0].id),
                      )?.name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeSites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {offers.data && offers.data.length > 0 ? (
          <Field>
            <FieldLabel htmlFor="access-offer">Partir d’une offre</FieldLabel>
            <FieldDescription>
              Remplit la durée et les conditions ci-dessous ; vous pouvez
              ensuite les ajuster.
            </FieldDescription>
            <Select onValueChange={(v) => v && fromOffer(String(v))}>
              <SelectTrigger
                id="access-offer"
                className={`${inputClass} w-full`}
              >
                <SelectValue placeholder="Choisir une offre (facultatif)" />
              </SelectTrigger>
              <SelectContent>
                {offers.data.map((o) => (
                  <SelectItem key={o.offerId} value={o.offerId}>
                    {o.name} · {formatValidity(o.accessPolicy.validitySeconds)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <Field data-invalid={!!errors.validityAmount}>
          <FieldLabel htmlFor="access-duration">Durée</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="access-duration"
              inputMode="numeric"
              className={inputClass}
              aria-invalid={!!errors.validityAmount}
              {...form.register("validityAmount", { onChange: resetFailure })}
            />
            <Controller
              control={form.control}
              name="validityUnit"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger
                    aria-label="Unité de durée"
                    className={`${inputClass} w-32`}
                  >
                    <SelectValue>
                      {durationUnits[field.value].label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(durationUnits).map(([k, u]) => (
                      <SelectItem key={k} value={k}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <FieldError>{errors.validityAmount?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.dataAmount}>
          <FieldLabel htmlFor="access-data">Volume de données</FieldLabel>
          <FieldDescription>
            Laissez vide pour un volume illimité.
          </FieldDescription>
          <div className="flex gap-2">
            <Input
              id="access-data"
              inputMode="numeric"
              className={inputClass}
              aria-invalid={!!errors.dataAmount}
              {...form.register("dataAmount", { onChange: resetFailure })}
            />
            <Controller
              control={form.control}
              name="dataUnit"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger
                    aria-label="Unité de volume"
                    className={`${inputClass} w-24`}
                  >
                    <SelectValue>{dataUnits[field.value].label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dataUnits).map(([k, u]) => (
                      <SelectItem key={k} value={k}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <FieldError>{errors.dataAmount?.message}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.downloadMbps}>
            <FieldLabel htmlFor="access-down">
              Vitesse de téléchargement (Mbit/s)
            </FieldLabel>
            <Input
              id="access-down"
              inputMode="numeric"
              placeholder="Illimitée"
              className={inputClass}
              aria-invalid={!!errors.downloadMbps}
              {...form.register("downloadMbps", { onChange: resetFailure })}
            />
            <FieldError>{errors.downloadMbps?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.uploadMbps}>
            <FieldLabel htmlFor="access-up">
              Vitesse d’envoi (Mbit/s)
            </FieldLabel>
            <Input
              id="access-up"
              inputMode="numeric"
              placeholder="Illimitée"
              className={inputClass}
              aria-invalid={!!errors.uploadMbps}
              {...form.register("uploadMbps", { onChange: resetFailure })}
            />
            <FieldError>{errors.uploadMbps?.message}</FieldError>
          </Field>
        </div>

        <Field data-invalid={!!errors.maxConcurrentSessions}>
          <FieldLabel htmlFor="access-devices">
            Appareils connectés en même temps
          </FieldLabel>
          <Input
            id="access-devices"
            inputMode="numeric"
            className={`${inputClass} sm:w-32`}
            aria-invalid={!!errors.maxConcurrentSessions}
            {...form.register("maxConcurrentSessions", {
              onChange: resetFailure,
            })}
          />
          <FieldError>{errors.maxConcurrentSessions?.message}</FieldError>
        </Field>
      </FieldGroup>

      {failure ? (
        <p role="alert" className="text-sm text-destructive">
          {failure}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          className="h-11 sm:h-9"
          disabled={issuing.isPending}
        >
          {issuing.isPending ? "Création…" : "Créer l’accès"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-9"
          render={<Link href={routes.access()} />}
          nativeButton={false}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
