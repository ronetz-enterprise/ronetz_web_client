"use client";

import { isAccidentalDismiss } from "@/lib/form-utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useOfferChange } from "../hooks/use-offers";
import { offerErrorMessage } from "../model/errors";
import { createSchema, type CreateValues, type SiteLite } from "../model/admin";
import {
  dataUnits,
  durationUnits,
  fromDraft,
  rateUnits,
  toDraft,
  type UnitDraft,
} from "../model/units";
import { UnitField } from "./unit-field";

type Draft = {
  siteId: string;
  name: string;
  description: string;
  amount: string;
  duration: UnitDraft;
  devices: string;
  data: UnitDraft;
  down: UnitDraft;
  up: UnitDraft;
  publishNow: boolean;
};

const blank = (siteId: string): Draft => ({
  siteId,
  name: "",
  description: "",
  amount: "",
  duration: { amount: "", unit: "heures", unlimited: false },
  devices: "1",
  data: toDraft(null, dataUnits, 1),
  down: toDraft(null, rateUnits, 1),
  up: toDraft(null, rateUnits, 1),
  publishNow: true,
});

/** Saisie → valeurs du schéma (texte exact) ; une saisie invalide reste vide pour que le schéma la refuse. */
export function draftToValues(d: Draft): CreateValues {
  return {
    name: d.name,
    description: d.description,
    amount: d.amount.replace(",", "."),
    validitySeconds: fromDraft(d.duration, durationUnits, false) ?? "",
    maxConcurrentSessions: d.devices,
    dataAllowanceBytes: fromDraft(d.data, dataUnits, true) ?? "-",
    downloadLimitBps: fromDraft(d.down, rateUnits, true) ?? "-",
    uploadLimitBps: fromDraft(d.up, rateUnits, true) ?? "-",
    displayOrder: "0",
  };
}

const messages: Partial<Record<keyof CreateValues, string>> = {
  validitySeconds: "Indiquez la durée (365 jours au maximum).",
  maxConcurrentSessions: "Indiquez un nombre d’appareils entre 1 et 32.",
  dataAllowanceBytes: "Indiquez le volume ou choisissez « Illimité ».",
  downloadLimitBps: "Indiquez la vitesse ou choisissez « Illimité ».",
  uploadLimitBps: "Indiquez la vitesse ou choisissez « Illimité ».",
};

export function validateDraft(d: Draft, currency: string) {
  const result = createSchema(currency).safeParse(draftToValues(d));
  const errors: Partial<Record<keyof CreateValues, string>> = {};
  if (!result.success)
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof CreateValues;
      errors[key] ??=
        key === "amount"
          ? issue.message.includes("devise") ||
            issue.message.includes("décimale")
            ? "Entrez un prix en francs, sans centimes."
            : "Indiquez un prix supérieur à zéro."
          : (messages[key] ?? issue.message);
    }
  return { ok: result.success, errors };
}

/**
 * Création d'une offre : le formulaire à gauche, ce que verra le client à droite
 * (l'offre sur la page d'achat, prix compris). L'offre démarre à l'émission du code.
 */
export function OfferCreateDrawer({
  open,
  onOpenChange,
  sites,
  fixedSiteId,
  currency,
  currencyLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: SiteLite[];
  fixedSiteId?: string;
  currency: string;
  currencyLabel: string;
}) {
  const active = useMemo(
    () => sites.filter((s) => s.status === "ACTIVE"),
    [sites],
  );
  const initialSite = fixedSiteId ?? active[0]?.id ?? "";
  const [draft, setDraft] = useState<Draft>(() => blank(initialSite));
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const mutation = useOfferChange();
  const siteId = draft.siteId || initialSite;
  const site = sites.find((s) => s.id === siteId);
  const { ok, errors } = validateDraft(draft, currency);
  const show = (k: keyof CreateValues) => (submitted ? errors[k] : undefined);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Un brouillon commencé ne se perd pas sur un clic à côté ou sur Échap.
  const dirty =
    JSON.stringify({ ...draft, siteId: "" }) !==
    JSON.stringify({ ...blank(initialSite), siteId: "" });
  function close(next: boolean, details?: { reason?: string }) {
    if (mutation.isPending) return;
    if (!next && dirty && isAccidentalDismiss(details)) return;
    onOpenChange(next);
    if (!next)
      setTimeout(() => {
        setDraft(blank(initialSite));
        setSubmitted(false);
        setFailure(null);
        mutation.reset();
      }, 200);
  }

  async function submit() {
    setSubmitted(true);
    setFailure(null);
    if (!ok || !site) return;
    let created;
    try {
      created = await mutation.mutateAsync({
        action: "create",
        siteId: site.id,
        values: draftToValues(draft),
        currency,
      });
    } catch (error) {
      setFailure(offerErrorMessage(error));
      return;
    }
    if (draft.publishNow) {
      try {
        await mutation.mutateAsync({ action: "publish", offer: created });
        toast.success("Offre créée et mise en vente");
      } catch {
        toast.warning(
          "Offre créée, mais pas encore en vente. Ouvrez-la pour la mettre en vente.",
        );
      }
    } else toast.success("Offre créée");
    onOpenChange(false);
    setDraft(blank(initialSite));
    setSubmitted(false);
  }

  const noSite = active.length === 0;
  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:gap-0 data-[side=right]:sm:max-w-5xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-xl font-semibold">
            Créer une offre
          </SheetTitle>
          <SheetDescription className="sr-only">
            Réglez la durée, le prix et le nombre d’appareils ; l’aperçu montre
            ce que verra votre client.
          </SheetDescription>
        </SheetHeader>

        <form
          id="offer-create-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="grid min-h-0 flex-1 overflow-y-auto lg:overflow-hidden"
        >
          <div className="flex min-w-0 flex-col gap-7 p-6 lg:overflow-y-auto">
            {noSite ? (
              <p
                role="status"
                className="rounded-lg border border-border p-4 text-sm"
              >
                Il vous faut d’abord un site actif pour y proposer une offre.
              </p>
            ) : null}
            <FieldGroup>
              {fixedSiteId ? (
                <Field>
                  <FieldLabel>Site</FieldLabel>
                  <p className="text-sm">{site?.name ?? "—"}</p>
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="offer-site">Site</FieldLabel>
                  <FieldDescription>
                    Où cette offre sera proposée à vos clients.
                  </FieldDescription>
                  <Select
                    value={siteId}
                    items={active.map((s) => ({ value: s.id, label: s.name }))}
                    onValueChange={(v) => v && set({ siteId: v })}
                  >
                    <SelectTrigger
                      id="offer-site"
                      className="h-11 w-full sm:h-9"
                    >
                      <SelectValue placeholder="Choisir un site" />
                    </SelectTrigger>
                    <SelectContent>
                      {active.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field data-invalid={show("name") ? true : undefined}>
                <FieldLabel htmlFor="offer-name">Nom de l’offre</FieldLabel>
                <FieldDescription>
                  Le nom que vos clients voient, par exemple « Pass 1 heure ».
                </FieldDescription>
                <Input
                  id="offer-name"
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  aria-invalid={!!show("name")}
                  aria-describedby="offer-name-error"
                  className="h-11 sm:h-9"
                  maxLength={100}
                />
                <p
                  id="offer-name-error"
                  aria-live="polite"
                  className="text-sm text-destructive empty:hidden"
                >
                  {show("name")}
                </p>
              </Field>

              <Field data-invalid={show("description") ? true : undefined}>
                <FieldLabel htmlFor="offer-description">
                  Description (facultatif)
                </FieldLabel>
                <FieldDescription>
                  Une phrase pour aider le client à choisir.
                </FieldDescription>
                <Textarea
                  id="offer-description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
                <p
                  aria-live="polite"
                  className="text-sm text-destructive empty:hidden"
                >
                  {show("description")}
                </p>
              </Field>

              <Field data-invalid={show("amount") ? true : undefined}>
                <FieldLabel htmlFor="offer-price">Prix</FieldLabel>
                <FieldDescription>Ce que paie le client.</FieldDescription>
                <InputGroup className="h-11 sm:h-9">
                  <InputGroupInput
                    id="offer-price"
                    inputMode="numeric"
                    value={draft.amount}
                    onChange={(e) => set({ amount: e.target.value })}
                    aria-invalid={!!show("amount")}
                    aria-describedby="offer-price-error"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{currencyLabel}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <p
                  id="offer-price-error"
                  aria-live="polite"
                  className="text-sm text-destructive empty:hidden"
                >
                  {show("amount")}
                </p>
              </Field>

              <UnitField
                label="Durée"
                description="Le temps de l’offre commence dès l’émission du code, pas à la première connexion du client."
                units={durationUnits}
                baseLabel="secondes"
                draft={draft.duration}
                onChange={(duration) => set({ duration })}
                error={show("validitySeconds")}
              />

              <Field
                data-invalid={show("maxConcurrentSessions") ? true : undefined}
              >
                <FieldLabel htmlFor="offer-devices">
                  Nombre d’appareils
                </FieldLabel>
                <FieldDescription>
                  Combien d’appareils peuvent être connectés en même temps, de 1
                  à 32.
                </FieldDescription>
                <Input
                  id="offer-devices"
                  inputMode="numeric"
                  value={draft.devices}
                  onChange={(e) =>
                    set({ devices: e.target.value.replace(/\s/g, "") })
                  }
                  aria-invalid={!!show("maxConcurrentSessions")}
                  className="h-11 sm:h-9"
                />
                <p
                  aria-live="polite"
                  className="text-sm text-destructive empty:hidden"
                >
                  {show("maxConcurrentSessions")}
                </p>
              </Field>

              <UnitField
                label="Volume de données"
                description="Ce que le client peut consommer."
                units={dataUnits}
                baseLabel="octets"
                unlimitable
                draft={draft.data}
                onChange={(data) => set({ data })}
                error={show("dataAllowanceBytes")}
              />
              <UnitField
                label="Vitesse de téléchargement"
                units={rateUnits}
                baseLabel="bit/s"
                unlimitable
                draft={draft.down}
                onChange={(down) => set({ down })}
                error={show("downloadLimitBps")}
              />
              <UnitField
                label="Vitesse d’envoi"
                units={rateUnits}
                baseLabel="bit/s"
                unlimitable
                draft={draft.up}
                onChange={(up) => set({ up })}
                error={show("uploadLimitBps")}
              />

              <label className="flex min-h-11 items-start gap-3 text-sm">
                <Switch
                  checked={draft.publishNow}
                  onCheckedChange={(v) => set({ publishNow: v })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">
                    Mettre en vente tout de suite
                  </span>
                  <span className="block text-muted-foreground">
                    Sinon, l’offre reste en préparation jusqu’à ce que vous la
                    mettiez en vente.
                  </span>
                </span>
              </label>
            </FieldGroup>
            {failure ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {failure}
              </p>
            ) : null}
          </div>
        </form>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={mutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="offer-create-form"
            disabled={mutation.isPending || noSite}
          >
            {mutation.isPending ? "Création…" : "Créer l’offre"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
