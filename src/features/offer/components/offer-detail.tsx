"use client";

import { isAccidentalDismiss } from "@/lib/form-utils";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { StatusPill } from "@/components/patterns/row-card-list";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { DetailHeader } from "@/components/patterns/settings-page";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, formatQuota, formatRate } from "../formatters/offer";
import { describeDuration, devicesLabel } from "../model/units";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  useOffer,
  useOfferAccess,
  useCurrency,
  useSitesLookup,
  useAllOffers,
} from "../hooks/use-offers";
import { useOfferEditor } from "../hooks/use-offer-editor";
import { Button } from "@/components/ui/button";
import { FormRegistryContext, useFormRegistry } from "./edit-controls";
import { offerCapabilities } from "../model/admin";
import { currencyLabel } from "../model/format";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  DataField,
  DescriptionField,
  DevicesField,
  DownloadField,
  DurationField,
  NameField,
  OrderField,
  PriceField,
  UploadField,
} from "./offer-fields";
import { OfferActions } from "./offer-actions";
import { DetailSkeleton, OfferDenied, OfferFailure } from "./offer-states";
import { statusLabels, statusTones, type AdminOffer } from "../model/admin";

export type OfferTab = "overview" | "pricing" | "presentation";

/** Une seule page pour tout le forfait ; `tab` reste accepté pour les anciennes adresses. */
export function OfferDetail({
  offerId,
  inDrawer = false,
}: {
  offerId: string;
  tab?: OfferTab;
  /** Affichée dans le tiroir de la liste : ni en-tête de page ni colonne centrée. */
  inDrawer?: boolean;
}) {
  const { membership } = useOrganization();
  const access = useOfferAccess();
  const query = useOffer(offerId);
  const sites = useSitesLookup();
  const currency = useCurrency();
  const all = useAllOffers(sites.data);

  if (!access.canViewOffers) return <OfferDenied />;
  if (query.isPending || currency.isPending) return <DetailSkeleton />;
  if (!query.data || !currency.data)
    return (
      <OfferFailure
        error={query.error ?? currency.error}
        retry={() => {
          void query.refetch();
          void currency.refetch();
        }}
      />
    );

  const offer = query.data;
  const site = sites.data?.find((s) => s.id === offer.siteId);
  const caps = offerCapabilities(
    {
      role: membership.role,
      membershipStatus: membership.membershipStatus,
      organizationStatus: membership.organizationStatus,
      organizationId: membership.organizationId,
    },
    site,
    offer,
    currency.data,
  );
  const editable = offer.status !== "ARCHIVED";
  const canEdit = caps.canEditOffer && editable;
  const canEditPrice = caps.canEditPrice && editable;
  // Précédent / suivant dans la liste des forfaits, comme les flèches de Shopify.
  const order = all.rows.map((r) => r.offer.offerId);
  const at = order.indexOf(offer.offerId);
  const prev = at > 0 ? order[at - 1] : null;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;
  // Rang sur la page d'achat du site, dit comme le client le voit : « 2e sur 5 ».
  const siblings = all.rows
    .map((r) => r.offer)
    .filter((o) => o.siteId === offer.siteId)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  const index = siblings.findIndex((o) => o.offerId === offer.offerId);
  const rank =
    index >= 0
      ? `${index === 0 ? "1re" : `${index + 1}e`} sur ${siblings.length}`
      : null;

  return (
    <OfferEditor
      offer={offer}
      site={site}
      currency={currency.data}
      caps={caps}
      canEdit={canEdit}
      canEditPrice={canEditPrice}
      prev={prev}
      next={next}
      sitesError={sites.isError}
      inDrawer={inDrawer}
      rank={rank}
    />
  );
}

/**
 * Fiche d'un forfait : une seule colonne centrée, car un forfait tient en quelques champs.
 * En haut l'identité et le prix ; dessous deux blocs de propriétés, chacun avec son « Modifier »
 * qui n'ouvre que ses propres champs ; en pied, le site, l'identifiant et les dates.
 */
function OfferEditor({
  offer,
  site,
  currency,
  caps,
  canEdit,
  canEditPrice,
  prev,
  next,
  sitesError,
  inDrawer,
  rank,
}: {
  inDrawer: boolean;
  rank: string | null;
  offer: AdminOffer;
  site: { id: string; name: string; status: string } | undefined;
  currency: string;
  caps: ReturnType<typeof offerCapabilities>;
  canEdit: boolean;
  canEditPrice: boolean;
  prev: string | null;
  next: string | null;
  sitesError: boolean;
}) {
  const [editing, setEditing] = useState<EditSection | null>(null);
  const p = offer.accessPolicy;
  const price = formatPrice(offer.price.amount, offer.price.currencyCode);
  const editable = offer.status !== "ARCHIVED";
  const modified = offer.updatedAt !== offer.createdAt;

  return (
    <div className="flex flex-col">
      {inDrawer ? null : (
        <DetailHeader
          back={{ href: routes.offers(), label: "Offres" }}
          title={offer.name}
          actions={
            <span className="flex overflow-hidden rounded-lg border">
              <NavArrow
                href={prev}
                label="Forfait précédent"
                icon={ArrowUp01Icon}
              />
              <NavArrow
                href={next}
                label="Forfait suivant"
                icon={ArrowDown01Icon}
              />
            </span>
          }
        />
      )}
      <div
        className={
          inDrawer
            ? "flex flex-col gap-8 px-6 pt-12 pb-6"
            : "mx-auto flex w-full max-w-2xl flex-col gap-8 pt-4 pb-16"
        }
      >
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <h1 className="min-w-0 text-xl font-semibold break-words">
                  {offer.name}
                </h1>
                <StatusPill
                  label={statusLabels[offer.status]}
                  tone={statusTones[offer.status]}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="tabular-nums">{price}</span> ·{" "}
                {describeDuration(p.validitySeconds)} ·{" "}
                {devicesLabel(p.maxConcurrentSessions)}
                {site ? (
                  <>
                    {" · "}
                    <Link
                      href={routes.site(site.id)}
                      className="text-signal hover:underline"
                    >
                      {site.name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OfferActions offer={offer} allowed={caps} />
            </div>
          </div>
          {!editable ? (
            <Notice>
              Ce forfait est archivé : vous pouvez le consulter, plus le
              modifier.
            </Notice>
          ) : null}
          {editable && site && site.status !== "ACTIVE" ? (
            <Notice>
              Le site n’est pas actif : réactivez-le pour modifier ce forfait.
            </Notice>
          ) : null}
          {offer.price.currencyCode !== currency ? (
            <Notice>
              Le prix n’est plus dans la monnaie de votre organisation :
              corrigez-le dans « Prix et conditions ».
            </Notice>
          ) : null}
          {sitesError ? (
            <Notice>Le nom du site n’a pas pu être chargé.</Notice>
          ) : null}
        </header>

        <PropertyBlock
          title="Prix et conditions"
          onEdit={canEdit || canEditPrice ? () => setEditing("terms") : null}
          rows={[
            [
              "Prix",
              <span key="p" className="tabular-nums">
                {price}
              </span>,
            ],
            ["Durée", describeDuration(p.validitySeconds)],
            ["Appareils en même temps", devicesLabel(p.maxConcurrentSessions)],
            ["Volume de données", formatQuota(p.dataAllowanceBytes)],
            ["Vitesse de téléchargement", formatRate(p.downloadLimitBps)],
            ["Vitesse d’envoi", formatRate(p.uploadLimitBps)],
          ]}
          note="Le temps commence à l’achat, que le client se connecte tout de suite ou plus tard."
        />

        <PropertyBlock
          title="Présentation"
          onEdit={canEdit ? () => setEditing("presentation") : null}
          rows={[
            ["Nom", offer.name],
            [
              "Description",
              offer.description ?? (
                <span key="d" className="text-muted-foreground">
                  Aucune
                </span>
              ),
            ],
            ["Place sur la page d’achat", rank ?? "—"],
          ]}
        />

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Créé le {formatDateTime(offer.createdAt)}</span>
          {modified ? (
            <span>Modifié le {formatDateTime(offer.updatedAt)}</span>
          ) : null}
        </footer>
      </div>
      {editing ? (
        <OfferEditDialog
          section={editing}
          offer={offer}
          currency={currency}
          canEdit={canEdit}
          canEditPrice={canEditPrice}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

type EditSection = "terms" | "presentation";

/** Bloc de propriétés : titre, « Modifier » discret, lignes libellé / valeur à filets clairs. */
function PropertyBlock({
  title,
  onEdit,
  rows,
  note,
}: {
  title: string;
  onEdit: (() => void) | null;
  rows: [string, ReactNode][];
  note?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {onEdit ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} />
            Modifier
          </Button>
        ) : null}
      </div>
      <dl className="divide-y divide-border border-y border-border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1 py-3 text-sm sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
    </section>
  );
}

/** Fenêtre de modification : tous les champs, un seul « Enregistrer ». */
function OfferEditDialog({
  section,
  offer,
  currency,
  canEdit,
  canEditPrice,
  onClose,
}: {
  section: EditSection;
  offer: AdminOffer;
  currency: string;
  canEdit: boolean;
  canEditPrice: boolean;
  onClose: () => void;
}) {
  const editor = useOfferEditor(offer, currency);
  const base = {
    offer,
    editor,
    currency,
    currencyLabel: currencyLabel(currency),
  };
  const form = useFormRegistry();
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveAll() {
    setFailure(null);
    setSaving(true);
    const expected = form.dirtyCount;
    editor.begin();
    await form.saveAll();
    if (editor.queued() < expected) {
      editor.flushCancel();
      setFailure("Corrigez les champs signalés en rouge.");
      setSaving(false);
      return;
    }
    const error = await editor.flush();
    setSaving(false);
    if (error) setFailure(error);
    else onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (open || saving) return;
        // Des champs modifiés ne se perdent pas sur un clic à côté ou sur Échap.
        if (form.dirtyCount > 0 && isAccidentalDismiss(details)) return;
        onClose();
      }}
    >
      <DialogContent className="max-h-[90svh] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {section === "terms" ? "Prix et conditions" : "Présentation"}
          </DialogTitle>
        </DialogHeader>
        <FormRegistryContext.Provider value={form.context}>
          <div className="flex max-h-[65svh] flex-col gap-5 overflow-y-auto px-6 py-5 [&_[data-slot=field-description]]:hidden">
            {section === "terms" ? (
              <>
                <PriceField {...base} disabled={!canEditPrice} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <DurationField {...base} disabled={!canEdit} />
                  <DevicesField {...base} disabled={!canEdit} />
                </div>
                <DataField {...base} disabled={!canEdit} />
                <DownloadField {...base} disabled={!canEdit} />
                <UploadField {...base} disabled={!canEdit} />
              </>
            ) : (
              <>
                <NameField {...base} disabled={!canEdit} />
                <DescriptionField {...base} disabled={!canEdit} />
                <OrderField {...base} disabled={!canEdit} />
              </>
            )}
          </div>
        </FormRegistryContext.Provider>
        <DialogFooter className="m-0 flex items-center gap-2 border-t border-border px-6 py-4 sm:justify-between">
          <p role="alert" className="text-sm text-destructive">
            {failure}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={saving} onClick={onClose}>
              Annuler
            </Button>
            <Button
              disabled={saving || form.dirtyCount === 0}
              onClick={() => void saveAll()}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NavArrow({
  href,
  label,
  icon,
}: {
  href: string | null;
  label: string;
  icon: typeof ArrowUp01Icon;
}) {
  const cls =
    "grid size-8 place-items-center text-foreground hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-40";
  return href ? (
    <Link href={routes.offer(href)} aria-label={label} className={cls}>
      <HugeiconsIcon icon={icon} strokeWidth={1.8} className="size-4" />
    </Link>
  ) : (
    <span aria-disabled="true" aria-label={label} className={cls}>
      <HugeiconsIcon icon={icon} strokeWidth={1.8} className="size-4" />
    </span>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="w-full rounded-lg bg-muted px-4 py-3 text-sm">
      {children}
    </p>
  );
}
