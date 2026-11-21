"use client";

import { useEffect, type ReactNode } from "react";
import {
  OnboardingBody,
  OnboardingFooter,
  SignOutBack,
} from "./onboarding-frame";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/form-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CountrySelect,
  currencyLabel,
  useCountries,
} from "@/features/countries";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "../schemas/create-organization";
import { useCreationAttempt } from "../hooks/onboarding-provider";
import { CountryWaitlistPanel } from "./country-waitlist-panel";

function applyApiFieldErrors(
  error: unknown,
  form: ReturnType<typeof useForm<CreateOrganizationInput>>,
  fields: (keyof CreateOrganizationInput)[],
) {
  if (!(error instanceof ApiError) || !error.problem?.errors) return;
  for (const { field, message } of error.problem.errors) {
    if (fields.includes(field as keyof CreateOrganizationInput))
      form.setError(field as keyof CreateOrganizationInput, { message });
  }
}

/**
 * Deux questions : le nom de l'organisation et le pays. La devise est déduite du pays et affichée,
 * jamais saisie. Un pays pas encore ouvert est sélectionnable mais mène à la liste d'attente.
 */
export function CreateOrganizationForm({ heading }: { heading?: ReactNode }) {
  const attempt = useCreationAttempt();
  const hydrated = useHydrated();
  const countries = useCountries();
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "", country: "" },
  });
  const country = useWatch({ control: form.control, name: "country" });

  // Par défaut : le premier pays ouvert (le Cameroun aujourd'hui).
  const firstOpen = countries.data?.find((c) => c.open)?.code;
  useEffect(() => {
    if (firstOpen && !form.getValues("country"))
      form.setValue("country", firstOpen);
  }, [firstOpen, form]);

  // Les erreurs de l'API s'affichent sur les champs concernés une fois le formulaire réactivé.
  useEffect(() => {
    if (!attempt.error) return;
    applyApiFieldErrors(attempt.error, form, ["name", "country"]);
    form.setError("root", {
      message:
        attempt.error instanceof ApiError && attempt.error.status === 409
          ? attempt.error.problem?.code === "ORGANIZATION_LIMIT_REACHED"
            ? "Vous avez déjà une organisation. Un compte ne peut en avoir qu'une pour l'instant."
            : "La création a été refusée. Vérifiez les informations avant de réessayer."
          : toUserMessage(attempt.error),
    });
  }, [attempt.error, form]);

  const selected = countries.data?.find((c) => c.code === country);
  const closed = selected !== undefined && !selected.open;
  const disabled = !hydrated || !["idle", "failed"].includes(attempt.status);
  const rootError = form.formState.errors.root?.message;

  return (
    <form
      noValidate
      className="flex flex-1 flex-col"
      onSubmit={form.handleSubmit(async (input) => {
        form.clearErrors();
        await attempt.submit(input);
      })}
    >
      <OnboardingBody>
        {heading}
        <Field data-invalid={!!form.formState.errors.name || undefined}>
          <FieldLabel htmlFor="field-name">
            Nom de votre organisation
          </FieldLabel>
          <FieldDescription>
            Le nom sous lequel vous vendez votre Wi-Fi. Vos clients le verront.
          </FieldDescription>
          <Input
            id="field-name"
            autoComplete="organization"
            placeholder="Ex. : Cyber Akwa"
            aria-invalid={!!form.formState.errors.name}
            className="h-11 sm:h-10"
            disabled={disabled}
            {...form.register("name")}
          />
          {form.formState.errors.name?.message && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!form.formState.errors.country || undefined}>
          <FieldLabel htmlFor="field-country">
            Dans quel pays travaillez-vous ?
          </FieldLabel>
          {countries.isPending ? (
            <Skeleton className="h-11 w-full sm:h-10" />
          ) : countries.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription className="space-y-2">
                <p>{toUserMessage(countries.error)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void countries.refetch()}
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Controller
                control={form.control}
                name="country"
                render={({ field }) => (
                  <CountrySelect
                    id="field-country"
                    countries={countries.data}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    invalid={!!form.formState.errors.country}
                  />
                )}
              />
              {selected?.open && (
                <FieldDescription>
                  Vos prix seront en {currencyLabel(selected.currency)}.
                </FieldDescription>
              )}
            </>
          )}
          {form.formState.errors.country?.message && (
            <FieldError>{form.formState.errors.country.message}</FieldError>
          )}
        </Field>

        {closed && selected && (
          <CountryWaitlistPanel
            key={selected.code}
            country={selected.code}
            countryName={selected.name}
            onChooseAnother={() => form.setValue("country", firstOpen ?? "")}
          />
        )}

        {rootError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}
        {attempt.error instanceof ApiError && attempt.error.correlationId && (
          <p className="text-xs text-muted-foreground">
            Référence :{" "}
            <code className="select-all">{attempt.error.correlationId}</code>
          </p>
        )}
      </OnboardingBody>
      <OnboardingFooter back={<SignOutBack />}>
        <Button
          type="submit"
          className="h-11 sm:h-10"
          disabled={
            disabled || closed || countries.isPending || countries.isError
          }
        >
          Continuer
        </Button>
      </OnboardingFooter>
    </form>
  );
}
