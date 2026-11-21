"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type RowCardGroup,
  StatusPill,
} from "@/components/patterns/row-card-list";
import { useSelectedParam } from "@/components/patterns/split-view";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DetailCompactContext } from "@/components/patterns/detail-page";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { routes } from "@/lib/routes";
import { formatTimeLeft, dayLabel, formatValidity } from "../formatters/access";
import { accessErrorMessage } from "../formatters/errors";
import {
  accessDisplayState,
  matchesFilter,
  type AccessFilter,
  type AccessGrant,
} from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import {
  ACCESS_PAGE_SIZE,
  useAccessGrantList,
  useAccessSites,
} from "../queries/access-grants";
import { AccessDetailPanel } from "./access-detail-panel";
import { toneToRow } from "./tone";

const CHIPS: { value: AccessFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "expiring", label: "Expire bientôt" },
  { value: "expired", label: "Expirés" },
  { value: "suspended", label: "Suspendus" },
];

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Liste des accès : cartes-lignes groupées par jour, recherche, puces, panneau poussé `?acces=`. */
const RECENT_LIMIT = 100;

export function AccessList() {
  const { membership } = useOrganization();
  const canView = accessPermissions(membership).canViewAccessGrants;
  const canCreate = accessPermissions(membership).canCreateManualAccess;
  const [selectedId, setSelectedId] = useSelectedParam("acces");
  // Stripe : une ligne ouvre la page de l’élément (pas de panneau latéral).
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<AccessFilter>("all");
  // Les 100 derniers accès sont lus d'un coup : filtres, comptes et pages portent sur le même ensemble.
  const list = useAccessGrantList(0, RECENT_LIMIT);
  const sites = useAccessSites();
  const close = useCallback(() => setSelectedId(null), [setSelectedId]);

  const siteName = useCallback(
    (id: string) => sites.data?.find((s) => s.id === id)?.name ?? "",
    [sites.data],
  );

  // L'heure de référence des filtres (« expire bientôt ») avance à la minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Les filtres s'appliquent à la page lue : le serveur ne filtre que par page.
  const content = useMemo(() => list.data?.content ?? [], [list.data]);
  const filtered = useMemo(
    () =>
      content.filter(
        (g) =>
          matchesFilter(g, chip, now) &&
          (!search ||
            normalize(`${g.username ?? ""} ${siteName(g.siteId)}`).includes(
              normalize(search),
            )),
      ),
    [content, chip, search, siteName, now],
  );
  const pageItems = filtered.slice(
    (page - 1) * ACCESS_PAGE_SIZE,
    page * ACCESS_PAGE_SIZE,
  );
  const groups: RowCardGroup<AccessGrant>[] = [];
  for (const g of pageItems) {
    const label = dayLabel(g.issuedAt, now);
    let group = groups.find((x) => x.key === label);
    if (!group) {
      group = { key: label, label, items: [] };
      groups.push(group);
    }
    group.items.push(g);
  }

  const total = filtered.length;
  const truncated = (list.data?.totalElements ?? 0) > content.length;
  const filtering = chip !== "all" || search !== "";

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Accès"
        description="Les identifiants de connexion que vous avez vendus ou que vos clients ont achetés. Le temps d’un accès commence à son émission."
        actions={
          canCreate ? (
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              render={<Link href={routes.accessNew()} />}
              nativeButton={false}
            >
              Créer un accès
            </Button>
          ) : null
        }
      />
      {!canView ? (
        <Alert variant="warning">
          <AlertTitle>Accès réservés au propriétaire</AlertTitle>
          <AlertDescription>
            Seul le propriétaire du compte peut consulter et gérer les accès.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <RowCardToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchLabel="Rechercher un identifiant ou un site"
              chips={CHIPS.map((c) => ({
                value: c.value,
                label: c.label,
                count: list.data
                  ? content.filter((g) => matchesFilter(g, c.value, now)).length
                  : undefined,
              }))}
              chip={chip}
              onChipChange={(v) => {
                setChip(v as AccessFilter);
                setPage(1);
              }}
            />
            {truncated ? (
              <p className="text-xs text-muted-foreground">
                Seuls les {content.length} accès les plus récents sont affichés.
              </p>
            ) : null}
            {list.isError ? (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-lg border border-border p-4"
              >
                <p className="text-sm">
                  {accessErrorMessage(list.error, "read")}
                </p>
                <Button
                  variant="outline"
                  className="h-11 w-fit sm:h-9"
                  onClick={() => void list.refetch()}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <RowCardList
                label="Liste des accès"
                loading={list.isPending}
                groups={groups}
                getKey={(g) => g.accessGrantId}
                selectedKey={selectedId}
                onSelect={(g) => setSelectedId(g.accessGrantId)}
                columns={[
                  {
                    key: "id",
                    header: "Identifiant",
                    cell: (g) => (
                      <span className="font-mono font-medium">
                        {g.username ?? "En préparation"}
                      </span>
                    ),
                  },
                  {
                    key: "state",
                    header: "État",
                    cell: (g) => {
                      const st = accessDisplayState(g, now);
                      return (
                        <StatusPill
                          label={st.label}
                          tone={toneToRow(st.tone)}
                        />
                      );
                    },
                  },
                  {
                    key: "duration",
                    header: "Durée",
                    cell: (g) => formatValidity(g.policy.validitySeconds),
                  },
                  {
                    key: "site",
                    header: "Site",
                    wide: true,
                    cell: (g) => (
                      <span className="text-muted-foreground">
                        {siteName(g.siteId) ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "left",
                    header: "Temps restant",
                    align: "end",
                    cell: (g) =>
                      accessDisplayState(g, now).usable
                        ? formatTimeLeft(g.expiresAt, now)
                        : "—",
                  },
                ]}
                toRow={(g) => {
                  const state = accessDisplayState(g, now);
                  return {
                    title: (
                      <span className="font-mono">
                        {g.username ?? "En préparation"}
                      </span>
                    ),
                    value: state.usable
                      ? formatTimeLeft(g.expiresAt, now)
                      : undefined,
                    meta: `${formatValidity(g.policy.validitySeconds)}${siteName(g.siteId) ? ` · ${siteName(g.siteId)}` : ""}`,
                    status: state.label,
                    tone: toneToRow(state.tone),
                  };
                }}
                empty={
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyTitle>
                        {filtering
                          ? "Aucun accès trouvé"
                          : "Aucun accès pour le moment"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {filtering
                          ? "Essayez un autre filtre ou une autre recherche."
                          : "Vendez votre premier accès : il apparaîtra ici dès sa création."}
                      </EmptyDescription>
                    </EmptyHeader>
                    {!filtering && canCreate ? (
                      <EmptyContent>
                        <Button
                          className="h-11 sm:h-9"
                          render={<Link href={routes.accessNew()} />}
                          nativeButton={false}
                        >
                          Créer un accès
                        </Button>
                      </EmptyContent>
                    ) : null}
                  </Empty>
                }
              />
            )}
            {list.data ? (
              <RowCardPagination
                page={page}
                pageSize={ACCESS_PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            ) : null}
          </div>
          <Sheet open={selectedId !== null} onOpenChange={(o) => !o && close()}>
            <SheetContent
              side="right"
              className="overflow-y-auto data-[side=right]:w-full data-[side=right]:gap-0 data-[side=right]:sm:max-w-xl"
            >
              <SheetTitle className="sr-only">Détail de l’accès</SheetTitle>
              {selectedId ? (
                <DetailCompactContext.Provider value>
                  <AccessDetailPanel
                    key={selectedId}
                    accessGrantId={selectedId}
                  />
                </DetailCompactContext.Provider>
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
