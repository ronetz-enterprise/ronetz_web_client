"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Unit, UnitDraft } from "../model/units";

/**
 * Champ « nombre + unité », avec « Illimité » si le réglage est facultatif.
 * `after` reçoit les boutons ✓ / ✗ de l'édition champ par champ.
 */
export function UnitField({
  label,
  description,
  units,
  draft,
  onChange,
  error,
  unlimitable = false,
  baseLabel = "unités",
  disabled = false,
  after,
}: {
  label: string;
  description?: string;
  units: Unit[];
  draft: UnitDraft;
  onChange: (next: UnitDraft) => void;
  error?: string;
  unlimitable?: boolean;
  baseLabel?: string;
  disabled?: boolean;
  after?: React.ReactNode;
}) {
  const id = useId();
  const options =
    draft.unit === "base" ? [{ label: "base", factor: 1n }, ...units] : units;
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {unlimitable ? (
          <label className="flex min-h-11 items-center gap-2 text-sm sm:min-h-0">
            <Switch
              size="sm"
              checked={draft.unlimited}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ ...draft, unlimited: checked })
              }
              aria-label={`${label} : illimité`}
            />
            Illimité
          </label>
        ) : null}
      </div>
      {description && !draft.unlimited ? (
        <FieldDescription id={`${id}-help`}>{description}</FieldDescription>
      ) : null}
      <div className="flex items-center gap-2">
        {draft.unlimited ? (
          <p className="flex h-11 min-w-0 flex-1 items-center text-sm text-muted-foreground sm:h-9">
            Sans limite
          </p>
        ) : (
          // Comme Shopify : nombre et unité dans un seul champ, séparés d'un filet.
          <div
            data-slot="input-group"
            className="flex h-11 min-w-0 flex-1 items-stretch rounded-md border border-input bg-background transition-[box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive sm:h-9 dark:bg-input/30"
          >
            <input
              id={id}
              inputMode="numeric"
              value={draft.amount}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={`${id}-help ${id}-error`}
              onChange={(e) =>
                onChange({
                  ...draft,
                  amount: e.target.value.replace(/\s/g, ""),
                })
              }
              className="min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none disabled:opacity-50"
            />
            <span aria-hidden className="my-1.5 w-px bg-border" />
            <Select
              value={draft.unit}
              disabled={disabled}
              onValueChange={(v) => v && onChange({ ...draft, unit: v })}
            >
              <SelectTrigger
                aria-label={`Unité : ${label}`}
                className="h-full w-auto shrink-0 gap-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((u) => (
                  <SelectItem key={u.label} value={u.label}>
                    {u.label === "base" ? baseLabel : u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {after}
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {error}
      </p>
    </Field>
  );
}
