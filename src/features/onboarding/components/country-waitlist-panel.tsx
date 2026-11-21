"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { toUserMessage } from "@/lib/api-error";
import { joinCountryWaitlist } from "../api/waitlist";

/**
 * Pays pas encore ouvert : on le dit clairement et on propose d'être prévenu. La case est décochée
 * d'office, et l'adresse e-mail n'est utilisée que pour annoncer l'ouverture de ce pays.
 */
export function CountryWaitlistPanel({
  country,
  countryName,
  onChooseAnother,
}: {
  country: string;
  countryName: string;
  onChooseAnother: () => void;
}) {
  const auth = useAuth();
  const [consent, setConsent] = useState(false);
  const mutation = useMutation({
    mutationFn: () => joinCountryWaitlist(auth.request, country),
  });
  const email = auth.loginEmail;

  if (mutation.isSuccess)
    return (
      <Alert role="status">
        <AlertTitle>C'est noté.</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Nous vous écrirons à l'ouverture de Ronetz en {countryName}.</p>
          <Button type="button" variant="outline" onClick={onChooseAnother}>
            Choisir un autre pays
          </Button>
        </AlertDescription>
      </Alert>
    );

  return (
    <div
      className="space-y-4 rounded-lg bg-muted p-4"
      role="group"
      aria-label="Pays pas encore disponible"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Ronetz n'est pas encore disponible en {countryName}.
        </p>
        <p className="text-sm text-muted-foreground">
          Nous ouvrons pays par pays. Vous pouvez demander à être prévenu.
        </p>
      </div>
      <Field orientation="horizontal" className="items-start">
        <Checkbox
          id="waitlist-consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          disabled={mutation.isPending}
        />
        <FieldLabel htmlFor="waitlist-consent" className="font-normal">
          J'accepte que Ronetz utilise l'adresse e-mail de mon compte
          {email ? ` (${email})` : ""} uniquement pour m'informer de l'ouverture
          en {countryName}.
        </FieldLabel>
      </Field>
      {mutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {toUserMessage(mutation.error)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!consent || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Me prévenir à l'ouverture
        </Button>
        <Button type="button" variant="outline" onClick={onChooseAnother}>
          Choisir un autre pays
        </Button>
      </div>
    </div>
  );
}
