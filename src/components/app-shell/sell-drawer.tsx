"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { toast } from "sonner";

import { formatNumber } from "@/components/amount";
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
import { cn } from "@/lib/utils";

// Données d'exemple : les offres et les sites viendront de l'API.
const durations = [
  { id: "1h", label: "1 heure", price: 100 },
  { id: "24h", label: "24 heures", price: 500 },
  { id: "7j", label: "7 jours", price: 2500 },
  { id: "30j", label: "30 jours", price: 8000 },
] as const;
const sites = ["Cyber Akwa", "Bonapriso"];

const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans I, L, O, 0, 1 : pas de confusion à la lecture
function newCode() {
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}
const fcfa = (n: number) => `${formatNumber(n)} FCFA`;

/**
 * « Vendre un accès » : un tiroir à deux colonnes, comme les formulaires riches de la référence.
 * À gauche, ce que le gérant règle. À droite, l'aperçu : la quantité, le total, le ticket du client.
 */
export function SellDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [durationId, setDurationId] =
    useState<(typeof durations)[number]["id"]>("24h");
  const [price, setPrice] = useState("500");
  const [site, setSite] = useState(sites[0]);
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [codes, setCodes] = useState<string[] | null>(null);

  const unit = Math.max(0, Number.parseInt(price.replace(/\D/g, ""), 10) || 0);
  const qty = Math.min(500, Math.max(1, Number.parseInt(quantity, 10) || 1));
  const total = unit * qty;
  const valid = unit > 0;

  function choose(id: (typeof durations)[number]["id"]) {
    setDurationId(id);
    setPrice(String(durations.find((d) => d.id === id)?.price ?? 0));
  }
  function reset() {
    setCodes(null);
    setPhone("");
    setQuantity("1");
  }
  function close(next: boolean) {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié");
    } catch {
      toast.error("Copie impossible : recopiez à la main.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:gap-0 data-[side=right]:sm:max-w-5xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-xl font-semibold">
            Vendre un accès
          </SheetTitle>
          <SheetDescription className="sr-only">
            Créez un code de connexion à remettre à un client.
          </SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
          {codes ? (
            <div className="flex flex-col gap-6 p-6 lg:col-span-2 lg:overflow-y-auto">
              <p
                className="flex items-center gap-2 text-base font-medium"
                role="status"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="size-5 text-signal"
                />
                {codes.length > 1
                  ? `${codes.length} accès créés`
                  : "Accès créé"}
                . Remettez le code au client.
              </p>
              <ul className="flex max-w-md flex-col divide-y divide-border rounded-xl border border-border">
                {codes.slice(0, 5).map((c) => (
                  <li
                    key={c}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="font-mono text-lg tracking-widest">
                      {c}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copy(c)}>
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        strokeWidth={1.8}
                        data-icon="inline-start"
                      />
                      Copier
                    </Button>
                  </li>
                ))}
              </ul>
              {codes.length > 5 ? (
                <p className="text-sm text-muted-foreground">
                  et {codes.length - 5} autres. La liste complète sera
                  téléchargeable.
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Démonstration : aucun accès n’est réellement créé.
              </p>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 flex-col gap-7 p-6 lg:overflow-y-auto">
                <Field>
                  <FieldLabel>Durée</FieldLabel>
                  <FieldDescription>
                    Combien de temps le client reste connecté.
                  </FieldDescription>
                  <div
                    role="radiogroup"
                    aria-label="Durée"
                    className="grid grid-cols-2 gap-2"
                  >
                    {durations.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        role="radio"
                        aria-checked={d.id === durationId}
                        onClick={() => choose(d.id)}
                        className={cn(
                          "min-h-11 rounded-lg border px-3 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          d.id === durationId
                            ? "border-signal bg-accent text-accent-foreground"
                            : "border-input hover:bg-muted",
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="sell-price">
                      Prix (obligatoire)
                    </FieldLabel>
                    <FieldDescription>
                      Le prix de l’offre. Vous pouvez le changer pour ce client.
                    </FieldDescription>
                    <InputGroup className="h-11 sm:h-9">
                      <InputGroupInput
                        id="sell-price"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) =>
                          setPrice(e.target.value.replace(/\D/g, ""))
                        }
                        aria-invalid={!valid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>FCFA</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sell-site">Site</FieldLabel>
                    <Select value={site} onValueChange={(v) => v && setSite(v)}>
                      <SelectTrigger
                        id="sell-site"
                        className="h-11 w-full sm:h-9"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sell-phone">
                      Numéro du client (facultatif)
                    </FieldLabel>
                    <FieldDescription>
                      Pour lui envoyer le code par WhatsApp. Sans numéro,
                      remettez-lui le code à la main.
                    </FieldDescription>
                    <Input
                      id="sell-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="6 XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 sm:h-9"
                    />
                  </Field>
                </FieldGroup>
              </div>

              <aside
                aria-label="Aperçu"
                className="flex min-w-0 flex-col gap-5 border-t border-border bg-muted/40 p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">Aperçu</h3>
                  <p className="text-sm text-muted-foreground">
                    Le total selon la durée, le prix et le nombre d’accès.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="sell-qty">Nombre d’accès</FieldLabel>
                  <Input
                    id="sell-qty"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value.replace(/\D/g, ""))
                    }
                    className="h-11 sm:h-9"
                  />
                  <FieldDescription>
                    Jusqu’à 500 codes d’un coup, pour préparer un lot d’avance.
                  </FieldDescription>
                </Field>
                <p className="border-t border-border pt-4 text-sm tabular-nums">
                  {qty} × {fcfa(unit)} = {fcfa(total)}
                </p>
                <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd>{fcfa(total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Commission</dt>
                    <dd>0&nbsp;FCFA</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>Total reçu</dt>
                    <dd>{fcfa(total)}</dd>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vente manuelle : aucune commission Mobile Money.
                  </p>
                </dl>
              </aside>
            </>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border px-6 py-4">
          {codes ? (
            <>
              <Button variant="outline" onClick={reset}>
                Vendre un autre accès
              </Button>
              <Button onClick={() => close(false)}>Terminer</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                Annuler
              </Button>
              <Button
                disabled={!valid}
                onClick={() => setCodes(Array.from({ length: qty }, newCode))}
              >
                {qty > 1 ? `Créer ${qty} accès` : "Créer l’accès"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
