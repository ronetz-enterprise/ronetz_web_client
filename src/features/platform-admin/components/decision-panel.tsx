"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { reasonSchema } from "../model/platform";

/**
 * Confirmation d'une action sensible, dans le panneau : ce qu'elle entraîne, un motif
 * obligatoire (il finit au journal), et, si elle est définitive, une case à cocher.
 * La phrase de confirmation attendue par le serveur est envoyée par la mutation, jamais saisie.
 */
export function DecisionPanel({
  title,
  consequences,
  summary,
  submitLabel,
  irreversible = false,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  title: string;
  consequences: string[];
  summary?: ReactNode;
  submitLabel: string;
  irreversible?: boolean;
  busy: boolean;
  error: unknown;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);
  const check = reasonSchema.safeParse(reason);
  const reasonError =
    touched && !check.success ? check.error.issues[0]?.message : undefined;
  const ready = check.success && (!irreversible || confirmed);

  return (
    <form
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-lg border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (ready && !busy && check.success) onSubmit(check.data);
      }}
    >
      <h3 id={`${id}-title`} className="text-base font-semibold">
        {title}
      </h3>
      {summary}
      <div className="flex flex-col gap-1.5 text-sm">
        <p className="font-medium">Ce que cela entraîne</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {consequences.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-reason`}>Motif</Label>
        <Textarea
          id={`${id}-reason`}
          value={reason}
          rows={3}
          disabled={busy}
          aria-invalid={!!reasonError}
          aria-describedby={`${id}-reason-help`}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        <p
          id={`${id}-reason-help`}
          className={
            reasonError
              ? "text-sm text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {reasonError ??
            "Entre 10 et 1 000 caractères. Il est inscrit au journal : n'y mettez aucun secret."}
        </p>
      </div>
      {irreversible ? (
        <div className="flex items-start gap-2.5">
          <Checkbox
            id={`${id}-confirm`}
            checked={confirmed}
            disabled={busy}
            onCheckedChange={(value) => setConfirmed(value === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor={`${id}-confirm`}
            className="text-sm leading-snug font-normal"
          >
            Je comprends que cette décision est définitive.
          </Label>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="text-sm text-destructive">
          <p>{toUserMessage(error)}</p>
          {error instanceof ApiError && error.status === 409 ? (
            <p className="mt-1 text-muted-foreground">
              Cette action a peut-être déjà été traitée : fermez ce panneau et
              rechargez la fiche pour voir son état actuel.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 md:h-9"
          disabled={busy}
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant={irreversible ? "destructive" : "default"}
          className="h-11 md:h-9"
          disabled={busy || (touched && !ready)}
        >
          {busy ? "En cours…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
