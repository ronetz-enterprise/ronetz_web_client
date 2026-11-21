"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  RowCardList,
  RowCardToolbar,
  StatusPill,
} from "@/components/patterns/row-card-list";
import { routes } from "@/lib/routes";
import Link from "next/link";
import {
  useAllOffers,
  useCurrency,
  useOfferAccess,
  useSitesLookup,
} from "../hooks/use-offers";
import { formatPrice } from "../formatters/offer";
import { statusLabels, statusTones } from "../model/admin";
import { describeDuration, devicesLabel } from "../model/units";
import { currencyLabel } from "../model/format";
import {
  countByStatus,
  filterRows,
  groupBySite,
  type StatusFilter,
} from "../model/list";
import { OfferCreateDrawer } from "./offer-create-drawer";
import { OfferDetail } from "./offer-detail";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { OfferDenied, OfferFailure } from "./offer-states";

/**
 * Liste des offres : de tous les sites (`/offers`) ou d'un seul (`/sites/[siteId]/offers`).
 * `createOpen` ouvre le tiroir de création d'emblée (`/sites/[siteId]/offers/new`).
 */
export function OffersListView({
  siteId,
  createOpen = false,
}: {
  siteId?: string;
  createOpen?: boolean;
}) {
  const router = useRouter();
  const access = useOfferAccess();
  const sitesQuery = useSitesLookup();
  const currency = useCurrency();
  const [drawer, setDrawer] = useState(createOpen);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const closeOffer = useCallback(() => setOpenId(null), []);

  const scoped = useMemo(
    () =>
      siteId
        ? sitesQuery.data?.filter((s) => s.id === siteId)
        : sitesQuery.data,
    [sitesQuery.data, siteId],
  );
  const all = useAllOffers(scoped);

  if (!access.canViewOffers) return <OfferDenied />;

  const site = siteId ? scoped?.[0] : undefined;
  const title = siteId ? `Offres de ${site?.name ?? "ce site"}` : "Offres";
  const description = siteId
    ? "Ce que vos clients peuvent acheter sur ce site."
    : "Ce que vos clients peuvent acheter, site par site.";
  const loading = sitesQuery.isPending || (!!scoped && all.pending);
  const failure = sitesQuery.error ?? all.error;
  const rows = all.rows;
  const counts = countByStatus(rows);
  const visible = filterRows(rows, status, search);
  const groups = groupBySite(visible).map((g) => ({
    key: g.site.id,
    label: siteId ? "Offres" : g.site.name,
    items: g.items,
  }));
  const canCreate =
    !!currency.data && (scoped?.some((s) => s.status === "ACTIVE") ?? false);

  function closeDrawer(open: boolean) {
    setDrawer(open);
    if (!open && createOpen && siteId)
      router.replace(routes.siteOffers(siteId));
  }

  const chips = (
    [
      ["ALL", "Toutes"],
      ["PUBLISHED", statusLabels.PUBLISHED],
      ["SUSPENDED", statusLabels.SUSPENDED],
      ["DRAFT", statusLabels.DRAFT],
      ["ARCHIVED", statusLabels.ARCHIVED],
    ] as [StatusFilter, string][]
  )
    .filter(([v]) => v === "ALL" || counts[v] > 0 || v === status)
    .map(([value, label]) => ({ value, label, count: counts[value] }));

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        back={
          siteId ? (
            <Link
              className="text-muted-foreground underline underline-offset-4"
              href={routes.site(siteId)}
            >
              ← {site?.name ?? "Site"}
            </Link>
          ) : undefined
        }
        actions={
          <Button
            variant="outline"
            className="h-11 sm:h-9"
            disabled={!canCreate}
            onClick={() => setDrawer(true)}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              aria-hidden
              data-icon="inline-start"
            />
            Créer une offre
          </Button>
        }
      />
      {failure ? (
        <OfferFailure
          error={failure}
          retry={() => {
            void sitesQuery.refetch();
            void all.refetch();
          }}
        />
      ) : (
        <>
          {rows.length > 0 || search || status !== "ALL" ? (
            <RowCardToolbar
              className="mb-4"
              search={search}
              onSearchChange={setSearch}
              searchLabel="Rechercher une offre"
              chips={chips}
              chip={status}
              onChipChange={(v) => setStatus(v as StatusFilter)}
            />
          ) : null}
          {all.truncated ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Seules les 100 premières offres de chaque site sont affichées.
            </p>
          ) : null}
          <RowCardList
            label="Offres"
            loading={loading}
            groups={groups}
            getKey={(r) => r.offer.offerId}
            onSelect={(r) => setOpenId(r.offer.offerId)}
            columns={[
              {
                key: "name",
                header: "Offre",
                cell: (r) => (
                  <span className="font-medium">{r.offer.name}</span>
                ),
              },
              {
                key: "status",
                header: "État",
                cell: (r) => (
                  <StatusPill
                    label={statusLabels[r.offer.status]}
                    tone={statusTones[r.offer.status]}
                  />
                ),
              },
              {
                key: "duration",
                header: "Durée",
                cell: (r) =>
                  describeDuration(r.offer.accessPolicy.validitySeconds),
              },
              {
                key: "devices",
                header: "Appareils",
                wide: true,
                cell: (r) =>
                  devicesLabel(r.offer.accessPolicy.maxConcurrentSessions),
              },
              ...(siteId
                ? []
                : [
                    {
                      key: "site",
                      header: "Site",
                      wide: true,
                      cell: (r: (typeof rows)[number]) => (
                        <span className="text-muted-foreground">
                          {r.site.name}
                        </span>
                      ),
                    },
                  ]),
              {
                key: "price",
                header: "Prix",
                align: "end",
                cell: (r) => (
                  <span className="font-medium">
                    {formatPrice(
                      r.offer.price.amount,
                      r.offer.price.currencyCode,
                    )}
                  </span>
                ),
              },
            ]}
            toRow={(r) => {
              const p = r.offer.accessPolicy;
              return {
                title: r.offer.name,
                value: formatPrice(
                  r.offer.price.amount,
                  r.offer.price.currencyCode,
                ),
                meta: [
                  siteId ? null : r.site.name,
                  describeDuration(p.validitySeconds),
                  devicesLabel(p.maxConcurrentSessions),
                ]
                  .filter(Boolean)
                  .join(" · "),
                status: statusLabels[r.offer.status],
                tone: statusTones[r.offer.status],
              };
            }}
            empty={
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>
                    {rows.length === 0
                      ? "Aucune offre pour le moment"
                      : "Aucune offre ne correspond"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {rows.length === 0
                      ? "Une offre, c’est une durée de connexion à un prix, par exemple « 1 heure, 200 FCFA »."
                      : "Essayez un autre mot ou un autre filtre."}
                  </EmptyDescription>
                </EmptyHeader>
                {rows.length === 0 && canCreate ? (
                  <EmptyContent>
                    <Button
                      className="h-11 sm:h-9"
                      onClick={() => setDrawer(true)}
                    >
                      Créer une offre
                    </Button>
                  </EmptyContent>
                ) : null}
                {rows.length === 0 &&
                !canCreate &&
                !loading &&
                sitesQuery.data ? (
                  <EmptyContent>
                    <Button
                      className="h-11 sm:h-9"
                      variant="outline"
                      render={<Link href={routes.siteNew()} />}
                      nativeButton={false}
                    >
                      Ajouter un site d’abord
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            }
          />
        </>
      )}
      {sitesQuery.data && currency.data ? (
        <>
          <Sheet
            open={openId !== null}
            onOpenChange={(o) => !o && closeOffer()}
          >
            <SheetContent
              side="right"
              className="overflow-y-auto data-[side=right]:w-full data-[side=right]:gap-0 data-[side=right]:sm:max-w-xl"
            >
              <SheetTitle className="sr-only">Offre</SheetTitle>
              {openId ? <OfferDetail offerId={openId} inDrawer /> : null}
            </SheetContent>
          </Sheet>
          <OfferCreateDrawer
            open={drawer}
            onOpenChange={closeDrawer}
            sites={sitesQuery.data}
            fixedSiteId={siteId}
            currency={currency.data}
            currencyLabel={currencyLabel(currency.data)}
          />
        </>
      ) : null}
    </div>
  );
}
