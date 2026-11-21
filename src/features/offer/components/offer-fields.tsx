"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import {
  detailsSchema,
  orderSchema,
  priceSchema,
  type AdminOffer,
  type PolicyValues,
} from "../model/admin";
import {
  dataUnits,
  durationUnits,
  fromDraft,
  rateUnits,
  toDraft,
  type Unit,
  type UnitDraft,
} from "../model/units";
import { mergePolicy, type useOfferEditor } from "../hooks/use-offer-editor";
import { EditControls, useFieldDraft } from "./edit-controls";
import { UnitField } from "./unit-field";

type Editor = ReturnType<typeof useOfferEditor>;
type Common = {
  offer: AdminOffer;
  editor: Editor;
  disabled: boolean;
  currencyLabel: string;
  currency: string;
};

/** Texte de l'erreur d'un champ du schéma, en phrase simple. */
export function NameField({ offer, editor, disabled }: Common) {
  const id = useId();
  const f = useFieldDraft(offer.name);
  async function save() {
    const parsed = detailsSchema.shape.name.safeParse(f.draft);
    if (!parsed.success) return f.setError(parsed.error.issues[0].message);
    f.setError(await editor.save("details", { name: parsed.data }));
  }
  return (
    <Field data-invalid={f.error ? true : undefined}>
      <FieldLabel htmlFor={id}>Nom de l’offre</FieldLabel>
      <FieldDescription>Le nom que vos clients voient.</FieldDescription>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={f.draft}
          disabled={disabled}
          maxLength={100}
          aria-invalid={!!f.error}
          aria-describedby={`${id}-error`}
          onChange={(e) => f.setDraft(e.target.value)}
          className="h-11 min-w-0 flex-1 sm:h-9"
        />
        <EditControls
          label="nom de l’offre"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {f.error}
      </p>
    </Field>
  );
}

export function DescriptionField({ offer, editor, disabled }: Common) {
  const id = useId();
  const f = useFieldDraft(offer.description ?? "");
  async function save() {
    const parsed = detailsSchema.shape.description.safeParse(f.draft);
    if (!parsed.success) return f.setError(parsed.error.issues[0].message);
    f.setError(await editor.save("details", { description: parsed.data }));
  }
  return (
    <Field data-invalid={f.error ? true : undefined}>
      <FieldLabel htmlFor={id}>Description (facultatif)</FieldLabel>
      <FieldDescription>
        Une phrase pour aider le client à choisir.
      </FieldDescription>
      <div className="flex items-start gap-2">
        <Textarea
          id={id}
          rows={3}
          value={f.draft}
          disabled={disabled}
          aria-invalid={!!f.error}
          aria-describedby={`${id}-error`}
          onChange={(e) => f.setDraft(e.target.value)}
          className="min-w-0 flex-1"
        />
        <EditControls
          label="description"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {f.error}
      </p>
    </Field>
  );
}

export function OrderField({ offer, editor, disabled }: Common) {
  const id = useId();
  const f = useFieldDraft(offer.displayOrder);
  async function save() {
    const parsed = orderSchema.safeParse({ displayOrder: f.draft });
    if (!parsed.success)
      return f.setError("Indiquez un nombre entier, à partir de 0.");
    f.setError(
      await editor.save("order", { displayOrder: parsed.data.displayOrder }),
    );
  }
  return (
    <Field data-invalid={f.error ? true : undefined}>
      <FieldLabel htmlFor={id}>Place dans la liste</FieldLabel>
      <FieldDescription>
        Les plus petits numéros passent en premier sur la page d’achat.
      </FieldDescription>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="numeric"
          value={f.draft}
          disabled={disabled}
          aria-invalid={!!f.error}
          aria-describedby={`${id}-error`}
          onChange={(e) => f.setDraft(e.target.value.replace(/\s/g, ""))}
          className="h-11 w-32 sm:h-9"
        />
        <EditControls
          label="place dans la liste"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {f.error}
      </p>
    </Field>
  );
}

export function PriceField({
  offer,
  editor,
  disabled,
  currency,
  currencyLabel,
}: Common) {
  const id = useId();
  const f = useFieldDraft(offer.price.amount);
  async function save() {
    const parsed = priceSchema(currency).safeParse({
      amount: f.draft.replace(",", "."),
    });
    if (!parsed.success)
      return f.setError(
        "Entrez un prix en francs, supérieur à zéro, sans centimes.",
      );
    f.setError(await editor.save("price", { amount: parsed.data.amount }));
  }
  return (
    <Field data-invalid={f.error ? true : undefined}>
      <FieldLabel htmlFor={id}>Prix</FieldLabel>
      <FieldDescription>
        Ce que paie le client. Ne change pas les accès déjà vendus.
      </FieldDescription>
      <div className="flex items-center gap-2">
        <InputGroup className="h-11 min-w-0 flex-1 sm:h-9">
          {/* Comme Shopify : la devise en préfixe, dans le champ. */}
          <InputGroupAddon align="inline-start">
            <InputGroupText>{currencyLabel}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            inputMode="numeric"
            value={f.draft}
            disabled={disabled}
            aria-invalid={!!f.error}
            aria-describedby={`${id}-error`}
            onChange={(e) => f.setDraft(e.target.value)}
          />
        </InputGroup>
        <EditControls
          label="prix"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {f.error}
      </p>
    </Field>
  );
}

type PolicyKey = keyof PolicyValues;

/** Un réglage d'accès : on n'envoie que lui, les autres gardent leur valeur enregistrée. */
function PolicyUnitField({
  offer,
  editor,
  disabled,
  field,
  units,
  fallback,
  label,
  description,
  baseLabel,
  unlimitable,
  errorText,
  adding = false,
}: Common & {
  adding?: boolean;
  field: PolicyKey;
  units: Unit[];
  fallback: number;
  label: string;
  description?: string;
  baseLabel: string;
  unlimitable: boolean;
  errorText: string;
}) {
  const stored =
    field === "validitySeconds"
      ? offer.accessPolicy.validitySeconds
      : (offer.accessPolicy[field as "dataAllowanceBytes"] ?? null);
  const initial = toDraft(stored, units, fallback);
  // « + Ajouter » : le champ s'ouvre limité, prêt à être confirmé par ✓.
  const f = useFieldDraft<UnitDraft>(
    initial,
    adding ? { ...initial, unlimited: false } : initial,
  );
  async function save() {
    const value = fromDraft(f.draft, units, unlimitable);
    if (value === null) return f.setError(errorText);
    const merged = mergePolicy(editor.baseline, { [field]: value });
    if (!merged.success) return f.setError(errorText);
    f.setError(await editor.save("policy", merged.data));
  }
  return (
    <UnitField
      label={label}
      description={description}
      units={units}
      baseLabel={baseLabel}
      unlimitable={unlimitable}
      draft={f.draft}
      onChange={f.setDraft}
      disabled={disabled}
      error={f.error ?? undefined}
      after={
        <EditControls
          label={label.toLowerCase()}
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      }
    />
  );
}

export function DurationField(p: Common) {
  return (
    <PolicyUnitField
      {...p}
      field="validitySeconds"
      units={durationUnits}
      fallback={1}
      label="Durée"
      baseLabel="secondes"
      unlimitable={false}
      description="Le temps de l’offre commence dès l’émission du code, pas à la première connexion."
      errorText="Indiquez une durée d’au plus 365 jours."
    />
  );
}
export function DataField(p: Common & { adding?: boolean }) {
  return (
    <PolicyUnitField
      {...p}
      field="dataAllowanceBytes"
      units={dataUnits}
      fallback={1}
      label="Volume de données"
      baseLabel="octets"
      unlimitable
      errorText="Indiquez le volume ou choisissez « Illimité »."
    />
  );
}
export function DownloadField(p: Common & { adding?: boolean }) {
  return (
    <PolicyUnitField
      {...p}
      field="downloadLimitBps"
      units={rateUnits}
      fallback={1}
      label="Vitesse de téléchargement"
      baseLabel="bit/s"
      unlimitable
      errorText="Indiquez la vitesse ou choisissez « Illimité »."
    />
  );
}
export function UploadField(p: Common & { adding?: boolean }) {
  return (
    <PolicyUnitField
      {...p}
      field="uploadLimitBps"
      units={rateUnits}
      fallback={1}
      label="Vitesse d’envoi"
      baseLabel="bit/s"
      unlimitable
      errorText="Indiquez la vitesse ou choisissez « Illimité »."
    />
  );
}

export function DevicesField({ offer, editor, disabled }: Common) {
  const id = useId();
  const f = useFieldDraft(offer.accessPolicy.maxConcurrentSessions);
  async function save() {
    const merged = mergePolicy(editor.baseline, {
      maxConcurrentSessions: f.draft,
    });
    if (!merged.success)
      return f.setError("Indiquez un nombre d’appareils entre 1 et 32.");
    f.setError(await editor.save("policy", merged.data));
  }
  return (
    <Field data-invalid={f.error ? true : undefined}>
      <FieldLabel htmlFor={id}>Nombre d’appareils</FieldLabel>
      <FieldDescription>
        Combien d’appareils peuvent être connectés en même temps, de 1 à 32.
      </FieldDescription>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="numeric"
          value={f.draft}
          disabled={disabled}
          aria-invalid={!!f.error}
          aria-describedby={`${id}-error`}
          onChange={(e) => f.setDraft(e.target.value.replace(/\s/g, ""))}
          className="h-11 w-32 sm:h-9"
        />
        <EditControls
          label="nombre d’appareils"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {f.error}
      </p>
    </Field>
  );
}

/** Titre de la fiche, modifiable sur place comme chez Shopify : grand texte, sans cadre au repos. */
export function TitleField({ offer, editor, disabled }: Common) {
  const id = useId();
  const f = useFieldDraft(offer.name);
  async function save() {
    const parsed = detailsSchema.shape.name.safeParse(f.draft);
    if (!parsed.success) return f.setError(parsed.error.issues[0].message);
    f.setError(await editor.save("details", { name: parsed.data }));
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Nom du forfait
        </label>
        <input
          id={id}
          value={f.draft}
          disabled={disabled}
          maxLength={100}
          aria-invalid={!!f.error}
          onChange={(e) => f.setDraft(e.target.value)}
          className="-mx-2 h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-xl font-semibold outline-none hover:border-border focus:border-muted-foreground/50 disabled:opacity-100"
        />
        <EditControls
          label="nom du forfait"
          dirty={f.dirty}
          pending={editor.pending}
          onSave={save}
          onCancel={f.reset}
        />
      </div>
      <p aria-live="polite" className="text-sm text-destructive empty:hidden">
        {f.error}
      </p>
    </div>
  );
}
