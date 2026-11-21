"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { Amount } from "@/components/amount";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatValidity } from "../formatters/access";
import { accessErrorMessage } from "../formatters/errors";
import {
  useManualAccess,
  type ManualAccessOutcome,
} from "../mutations/manual-access";
import { accessPermissions } from "../permissions/access-permissions";
import {
  useAccessOffers,
  useAccessSites,
  type AccessOffer,
} from "../queries/access-grants";
import {
  IssuedCredentialPanel,
  RemoteCredentialPanel,
} from "./credential-panel";

/** Corps de la création : la politique vient telle quelle de l'offre choisie. */
export function offerIssueBody(offer: AccessOffer) {
  return {
    subjectType: "ANONYMOUS",
    subjectId: null,
    activationMode: "IMMEDIATE" as const,
    policy: offer.accessPolicy,
  };
}

/**
 * « Vendre un accès » : tiroir à deux colonnes branché sur la création manuelle d'accès.
 * À gauche, ce que règle le gérant ; à droite, l'aperçu, le total et le ticket du client.
 * Le temps d'un accès commence à l'émission. L'identifiant et le mot de passe ne s'affichent
 * qu'une fois, à la création.
 */
export function SellAccessDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { membership } = useOrganization();
  const canSell = accessPermissions(membership).canCreateManualAccess;
  const sites = useAccessSites();
  const activeSites = useMemo(
    () => (sites.data ?? []).filter((s) => s.status === "ACTIVE"),
    [sites.data],
  );
  const [siteChoice, setSiteChoice] = useState<string | null>(null);
  const [offerChoice, setOfferChoice] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ManualAccessOutcome | null>(null);
  const issuing = useManualAccess();

  // Un seul site actif : il est choisi d'office.
  const siteId =
    siteChoice && activeSites.some((s) => s.id === siteChoice)
      ? siteChoice
      : (activeSites[0]?.id ?? null);
  const site = activeSites.find((s) => s.id === siteId) ?? null;
  const offers = useAccessOffers(siteId);
  const offer =
    offers.data?.find((o) => o.offerId === offerChoice) ??
    offers.data?.[0] ??
    null;

  // Après un échec, un autre choix est une nouvelle tentative : nouvelle clé.
  const { reset: resetMutation, rotate, isError } = issuing;
  function editedAfterFailure() {
    if (isError) {
      rotate();
      resetMutation();
    }
  }

  function startAnother() {
    setOutcome(null);
    rotate();
    resetMutation();
  }
  function close(next: boolean) {
    onOpenChange(next);
  }
  // À la fermeture, tout secret disparaît de l'écran et de la mémoire.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setOutcome(null);
      resetMutation();
    }, 200);
    return () => clearTimeout(timer);
  }, [open, resetMutation]);

  async function submit() {
    if (!site || !offer) return;
    const result = await issuing
      .issue({ siteId: site.id, body: offerIssueBody(offer) })
      .catch(() => null);
    if (result) setOutcome(result);
  }

  const credential = outcome?.credentialDelivery ?? null;
  const failure = issuing.error
    ? accessErrorMessage(issuing.error, "create")
    : null;

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
            Créez un identifiant et un mot de passe à remettre à un client.
          </SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
          {outcome ? (
            <div className="flex flex-col gap-6 p-6 lg:col-span-2 lg:overflow-y-auto">
              <p
                className="flex items-center gap-2 text-base font-medium"
                role="status"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="size-5 text-signal"
                  aria-hidden
                />
                {outcome.created ? "Accès créé." : "Cet accès existait déjà."}
              </p>
              <div className="max-w-xl">
                {credential ? (
                  <IssuedCredentialPanel credential={credential} />
                ) : outcome.retrievalToken ? (
                  <RemoteCredentialPanel
                    accessGrantId={outcome.grant.accessGrantId}
                    retrievalToken={outcome.retrievalToken}
                  />
                ) : (
                  <Alert variant="warning">
                    <AlertTitle>Le mot de passe n’est plus affiché</AlertTitle>
                    <AlertDescription>
                      Il n’est montré qu’à la création. Si vous ne l’avez pas
                      noté, annulez cet accès depuis la liste et vendez-en un
                      nouveau.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Le temps de l’accès a commencé : il court dès maintenant, même
                si le client ne s’est pas encore connecté.{" "}
                <Link
                  href={`${routes.access()}?acces=${outcome.grant.accessGrantId}`}
                  className="text-signal underline-offset-4 hover:underline"
                  onClick={() => close(false)}
                >
                  Suivre cet accès dans la liste
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 flex-col gap-6 p-6 lg:overflow-y-auto">
                {!canSell ? (
                  <Alert variant="warning">
                    <AlertTitle>Vente non autorisée</AlertTitle>
                    <AlertDescription>
                      Seul le propriétaire du compte peut vendre un accès.
                    </AlertDescription>
                  </Alert>
                ) : sites.isPending ? (
                  <Skeleton className="h-40 rounded-lg" />
                ) : sites.isError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Vos sites ne se chargent pas</AlertTitle>
                    <AlertDescription>
                      <Button
                        variant="outline"
                        className="mt-2 h-11 sm:h-9"
                        onClick={() => void sites.refetch()}
                      >
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : !site ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyTitle>Aucun site actif</EmptyTitle>
                      <EmptyDescription>
                        Créez d’abord un site pour pouvoir y vendre des accès.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Button
                      className="h-11 sm:h-9"
                      render={<Link href={routes.siteNew()} />}
                      nativeButton={false}
                    >
                      Créer un site
                    </Button>
                  </Empty>
                ) : (
                  <>
                    {activeSites.length > 1 ? (
                      <Field>
                        <FieldLabel htmlFor="sell-site">Site</FieldLabel>
                        <Select
                          value={site.id}
                          onValueChange={(v) => {
                            if (!v) return;
                            editedAfterFailure();
                            setSiteChoice(v);
                            setOfferChoice(null);
                          }}
                        >
                          <SelectTrigger
                            id="sell-site"
                            className="h-11 w-full sm:h-9"
                          >
                            <SelectValue>{site.name}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {activeSites.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    ) : null}

                    <Field>
                      <FieldLabel>Offre</FieldLabel>
                      <FieldDescription>
                        La durée et les conditions viennent de l’offre. Le temps
                        de l’accès commence dès que vous le créez, pas à la
                        première connexion du client.
                      </FieldDescription>
                      {offers.isPending ? (
                        <Skeleton className="h-24 rounded-lg" />
                      ) : offers.isError ? (
                        <p role="alert" className="text-sm text-destructive">
                          Les offres ne se chargent pas.{" "}
                          <button
                            type="button"
                            className="underline"
                            onClick={() => void offers.refetch()}
                          >
                            Réessayer
                          </button>
                        </p>
                      ) : offers.data.length === 0 ? (
                        <Empty className="border">
                          <EmptyHeader>
                            <EmptyTitle>Aucune offre publiée</EmptyTitle>
                            <EmptyDescription>
                              Publiez au moins une offre pour ce site avant de
                              vendre un accès.
                            </EmptyDescription>
                          </EmptyHeader>
                          <Button
                            variant="outline"
                            className="h-11 sm:h-9"
                            render={
                              <Link href={routes.siteOfferNew(site.id)} />
                            }
                            nativeButton={false}
                          >
                            Créer une offre
                          </Button>
                        </Empty>
                      ) : (
                        <div
                          role="radiogroup"
                          aria-label="Offre"
                          className="grid gap-2 sm:grid-cols-2"
                        >
                          {offers.data.map((o) => {
                            const on = o.offerId === offer?.offerId;
                            return (
                              <button
                                key={o.offerId}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => {
                                  editedAfterFailure();
                                  setOfferChoice(o.offerId);
                                }}
                                className={cn(
                                  "flex min-h-14 flex-col gap-0.5 rounded-lg border px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  on
                                    ? "border-signal bg-accent text-accent-foreground"
                                    : "border-input hover:bg-muted",
                                )}
                              >
                                <span className="font-medium">{o.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatValidity(
                                    o.accessPolicy.validitySeconds,
                                  )}{" "}
                                  · <Amount value={o.price.amount} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Field>
                  </>
                )}
                {failure ? (
                  <p role="alert" className="text-sm text-destructive">
                    {failure}
                  </p>
                ) : null}
              </div>

              <aside
                aria-label="Aperçu"
                className="flex min-w-0 flex-col gap-5 border-t border-border bg-muted/40 p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">Aperçu</h3>
                  <p className="text-sm text-muted-foreground">
                    Le total selon l’offre choisie.
                  </p>
                </div>
                {offer && site ? (
                  <>
                    <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm tabular-nums">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{offer.name}</dt>
                        <dd>
                          <Amount value={offer.price.amount} />
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 font-semibold">
                        <dt>Montant à recevoir</dt>
                        <dd>
                          <Amount value={offer.price.amount} />
                        </dd>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vente manuelle : vous recevez le paiement directement.
                        Ce paiement n’est pas enregistré dans Ronetz.
                      </p>
                    </dl>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Choisissez une offre pour voir le total.
                  </p>
                )}
              </aside>
            </>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border px-6 py-4">
          {outcome ? (
            <>
              <Button
                variant="outline"
                className="h-11 sm:h-9"
                onClick={startAnother}
              >
                Vendre un autre accès
              </Button>
              <Button className="h-11 sm:h-9" onClick={() => close(false)}>
                Terminer
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => close(false)}
              >
                Annuler
              </Button>
              <Button
                className="h-11 sm:h-9"
                disabled={!canSell || !offer || !site || issuing.isPending}
                onClick={() => void submit()}
              >
                {issuing.isPending ? "Création…" : "Créer l’accès"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
