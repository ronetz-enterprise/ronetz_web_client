"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { zodResolver } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { routes } from "@/lib/routes";
import {
  siteFormSchema,
  suggestedCities,
  type Site,
  type SiteFormValues,
} from "../model/site";
import { useSiteChange } from "../queries/sites";

const OTHER = "other";

export function applyFieldErrors(
  error: unknown,
  setError: (name: keyof SiteFormValues, e: { message: string }) => void,
) {
  if (!(error instanceof ApiError) || !error.problem?.errors) return false;
  let applied = false;
  for (const { field, message } of error.problem.errors) {
    if (["name", "city", "district", "addressDetails"].includes(field)) {
      setError(field as keyof SiteFormValues, { message });
      applied = true;
    }
  }
  return applied;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

/**
 * Formulaire du site : nom + ville, quartier facultatif. Pas de saisie technique :
 * le fuseau horaire est déduit du pays de l'organisation par le backend.
 */
export function SiteForm({
  site,
  submitLabel,
  onDone,
  onCancel,
  defaultName = "",
}: {
  site?: Site;
  submitLabel: string;
  onDone: (site: Site) => void;
  onCancel?: () => void;
  defaultName?: string;
}) {
  const mutation = useSiteChange();
  const [cityMode, setCityMode] = useState<string>(() =>
    !site || (suggestedCities as readonly string[]).includes(site.city)
      ? (site?.city ?? "")
      : OTHER,
  );
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: site?.name ?? defaultName,
      city: site?.city ?? "",
      district: site?.district ?? "",
      addressDetails: site?.addressDetails ?? "",
    },
  });
  const errors = form.formState.errors;
  const city = form.watch("city");
  const otherCity = cityMode === OTHER;

  async function save(values: SiteFormValues) {
    try {
      const result = site
        ? await mutation.mutateAsync({ action: "update", site, values })
        : await mutation.mutateAsync({ action: "create", values });
      if (result) onDone(result);
    } catch (error) {
      applyFieldErrors(error, (n, e) => form.setError(n, e));
    }
  }

  const failure =
    mutation.isError &&
    !(
      mutation.error instanceof ApiError &&
      mutation.error.problem?.errors?.length
    )
      ? mutation.error
      : null;

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-5"
      onSubmit={(e) => void form.handleSubmit(save)(e)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="site-name" className="text-sm font-medium">
          Nom du site
        </label>
        <p id="site-name-help" className="text-sm text-muted-foreground">
          L&apos;endroit où se trouve votre Wi-Fi : un cybercafé, une boutique,
          un hôtel.
        </p>
        <Input
          id="site-name"
          className="h-11 md:h-9"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={`site-name-help${errors.name ? " site-name-error" : ""}`}
          disabled={mutation.isPending}
          {...form.register("name")}
        />
        <FieldError id="site-name-error" message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="site-city-label" className="text-sm font-medium">
          Ville
        </span>
        <div
          role="radiogroup"
          aria-labelledby="site-city-label"
          className="flex flex-wrap gap-2"
        >
          {[...suggestedCities, OTHER].map((c) => {
            const on = c === OTHER ? otherCity : !otherCity && city === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={mutation.isPending}
                onClick={() => {
                  setCityMode(c);
                  form.setValue("city", c === OTHER ? "" : c, {
                    shouldDirty: true,
                    shouldValidate: c !== OTHER,
                  });
                }}
                className={cn(
                  "inline-flex h-11 items-center rounded-full border px-4 text-sm outline-none md:h-9",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {c === OTHER ? "Autre ville" : c}
              </button>
            );
          })}
        </div>
        {otherCity ? (
          <>
            <label htmlFor="site-city" className="sr-only">
              Nom de la ville
            </label>
            <Input
              id="site-city"
              className="h-11 md:h-9"
              placeholder="Nom de la ville"
              autoComplete="address-level2"
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? "site-city-error" : undefined}
              disabled={mutation.isPending}
              {...form.register("city")}
            />
          </>
        ) : null}
        <FieldError id="site-city-error" message={errors.city?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="site-district" className="text-sm font-medium">
          Quartier{" "}
          <span className="font-normal text-muted-foreground">
            (facultatif)
          </span>
        </label>
        <Input
          id="site-district"
          className="h-11 md:h-9"
          autoComplete="off"
          aria-invalid={!!errors.district}
          disabled={mutation.isPending}
          {...form.register("district")}
        />
        <FieldError
          id="site-district-error"
          message={errors.district?.message}
        />
      </div>

      {site ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="site-address" className="text-sm font-medium">
            Repère pour trouver le site{" "}
            <span className="font-normal text-muted-foreground">
              (facultatif)
            </span>
          </label>
          <Input
            id="site-address"
            className="h-11 md:h-9"
            autoComplete="off"
            aria-invalid={!!errors.addressDetails}
            disabled={mutation.isPending}
            {...form.register("addressDetails")}
          />
          <FieldError
            id="site-address-error"
            message={errors.addressDetails?.message}
          />
        </div>
      ) : null}

      {failure ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {failure instanceof ApiError && failure.status === 403
              ? "Seul le propriétaire de l'organisation peut gérer les sites."
              : toUserMessage(failure)}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 md:h-9"
            disabled={mutation.isPending}
            onClick={onCancel}
          >
            Annuler
          </Button>
        ) : null}
        <Button
          type="submit"
          className="h-11 md:h-9"
          disabled={mutation.isPending || (!!site && !form.formState.isDirty)}
        >
          {mutation.isPending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function CreateSiteScreen() {
  const router = useRouter();
  const { organizationName } = useOrganization();
  return (
    <SiteForm
      submitLabel="Créer mon site"
      defaultName={organizationName}
      onCancel={() => router.push(routes.sites())}
      onDone={(site) => {
        toast.success(`Votre site est créé : ${site.name}.`);
        router.push(routes.site(site.id));
      }}
    />
  );
}
