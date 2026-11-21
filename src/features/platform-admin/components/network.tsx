"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type RowCardGroup,
} from "@/components/patterns/row-card-list";
import { SplitView, useSelectedParam } from "@/components/patterns/split-view";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatRelative } from "@/lib/format";
import { usePlatformRouters, usePlatformSites } from "../api/platform";
import {
  connectivityLabels,
  connectivityTones,
  label,
  organizationStatusTones,
  platformCapabilities,
  routerStateLabels,
  setupHint,
  setupLabels,
  setupTones,
  siteStatusLabels,
  type PlatformRouter,
  type PlatformSession,
  type PlatformSite,
} from "../model/platform";
import {
  FilterSelect,
  OrganizationFilter,
  useOrganizationNames,
} from "./filters";
import { Facts, Hint, InlineError, NoPermission, ToneBadge } from "./parts";
import { readChoice, readPage, useUrlState } from "./use-url-state";

const PAGE_SIZE = 20;
const SITE_CHIPS = [
  { value: "ALL", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "SUSPENDED", label: "Suspendus" },
  { value: "CLOSED", label: "Fermés" },
];
const LINK_CHIPS = [
  { value: "ALL", label: "Tous" },
  { value: "ONLINE", label: "En ligne" },
  { value: "OFFLINE", label: "Hors ligne" },
  { value: "UNKNOWN", label: "Pas de nouvelles" },
];
const STATE_OPTIONS = [
  { value: "ALL", label: "Tous les états" },
  { value: "ACTIVE", label: "En service" },
  { value: "SUSPENDED", label: "Suspendus" },
  { value: "CLOSED", label: "Retirés" },
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function RouterPanel({
  router,
  organization,
  site,
}: {
  router: PlatformRouter;
  organization: string;
  site: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{router.name}</h2>
        <div>
          <ToneBadge tone={connectivityTones[router.connectivityStatus]}>
            {connectivityLabels[router.connectivityStatus]}
          </ToneBadge>
        </div>
      </div>
      <Facts
        rows={[
          ["Organisation", organization],
          ["Site", site],
          ["Marque", router.vendor ?? "—"],
          ["Modèle", router.model ?? "—"],
          ["État", routerStateLabels[router.lifecycleStatus]],
          [
            "Mise en service",
            <Hint key="s" term={setupHint}>
              {label(setupLabels, router.provisioningStatus)}
            </Hint>,
          ],
          [
            "Dernier signe de vie",
            router.lastSeenAt ? formatDateTime(router.lastSeenAt) : "Jamais",
          ],
          ["Ajouté le", formatDateTime(router.createdAt)],
        ]}
      />
      {router.failureCode ? (
        <p className="rounded-md border border-danger-border bg-danger p-3 text-sm text-danger-foreground">
          La mise en service a rencontré un problème.{" "}
          <Hint term={`Code : ${router.failureCode}`}>
            Voir le code pour l'équipe réseau
          </Hint>
        </p>
      ) : null}
    </div>
  );
}

function SitePanel({
  site,
  organization,
}: {
  site: PlatformSite;
  organization: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <div>
          <ToneBadge tone={organizationStatusTones[site.status]}>
            {siteStatusLabels[site.status]}
          </ToneBadge>
        </div>
      </div>
      <Facts
        rows={[
          ["Organisation", organization],
          ["Ville", site.city],
          ["Créé le", formatDateTime(site.createdAt)],
          ["Modifié le", formatDateTime(site.updatedAt)],
        ]}
      />
    </div>
  );
}

/** Sites et routeurs de toutes les organisations : recherche par nom, filtres, fiche en panneau. */
export function NetworkPage({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const { params, update } = useUrlState();
  const [selected, select] = useSelectedParam("element");
  const { names } = useOrganizationNames(session);

  const resource =
    params.get("ressource") === "routeurs" ? "routeurs" : "sites";
  const page = readPage(params.get("page"));
  const orgParam = params.get("organisation");
  const organizationId = orgParam && UUID.test(orgParam) ? orgParam : null;
  const query = params.get("q") ?? "";
  const siteStatus = readChoice(
    params.get("statut"),
    SITE_CHIPS.map((c) => c.value),
    "ALL",
  );
  const connectivity = readChoice(
    params.get("connexion"),
    LINK_CHIPS.map((c) => c.value),
    "ALL",
  );
  const lifecycle = readChoice(
    params.get("etat"),
    STATE_OPTIONS.map((c) => c.value),
    "ALL",
  );
  const [text, setText] = useState(query);

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => update({ q: text.trim() || null }), 300);
    return () => clearTimeout(timer);
  }, [text, query, update]);

  const sites = usePlatformSites(
    session,
    { organizationId, status: siteStatus, query },
    resource === "sites" ? page : 0,
    PAGE_SIZE,
    resource === "sites",
  );
  const routers = usePlatformRouters(
    session,
    {
      organizationId,
      lifecycleStatus: lifecycle,
      connectivityStatus: connectivity,
      query,
    },
    resource === "routeurs" ? page : 0,
    PAGE_SIZE,
    resource === "routeurs",
  );

  if (!capabilities.canReadNetwork)
    return (
      <>
        <PageHeader title="Réseau" />
        <NoPermission area="Le réseau" />
      </>
    );

  const orgName = (id: string) => names.get(id) ?? "Organisation";
  const list = resource === "sites" ? sites : routers;
  const filtering =
    organizationId !== null ||
    query !== "" ||
    (resource === "sites"
      ? siteStatus !== "ALL"
      : connectivity !== "ALL" || lifecycle !== "ALL");

  const siteGroups: RowCardGroup<PlatformSite>[] = sites.data
    ? [{ key: "sites", label: "Sites", items: sites.data.content }]
    : [];
  const routerGroups: RowCardGroup<PlatformRouter>[] = routers.data
    ? [{ key: "routeurs", label: "Routeurs", items: routers.data.content }]
    : [];
  const selectedSite =
    sites.data?.content.find((s) => s.id === selected) ?? null;
  const selectedRouter =
    routers.data?.content.find((r) => r.id === selected) ?? null;
  const siteNames = new Map(
    (sites.data?.content ?? []).map((s) => [s.id, s.name]),
  );

  const empty = (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>
          {filtering
            ? resource === "sites"
              ? "Aucun site trouvé"
              : "Aucun routeur trouvé"
            : resource === "sites"
              ? "Aucun site"
              : "Aucun routeur"}
        </EmptyTitle>
        <EmptyDescription>
          {filtering
            ? "Essayez un autre nom ou retirez un filtre."
            : "Rien à afficher pour le moment."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  return (
    <>
      <PageHeader
        title="Réseau"
        description="Les sites et les routeurs de toutes les organisations."
      />
      <Tabs
        value={resource}
        onValueChange={(value) => {
          setText("");
          update({
            ressource: value === "routeurs" ? "routeurs" : null,
            q: null,
            statut: null,
            connexion: null,
            etat: null,
            element: null,
          });
        }}
        className="mb-4"
      >
        <TabsList variant="line" aria-label="Type d'élément">
          <TabsTrigger value="sites" className="h-11 md:h-9">
            Sites
          </TabsTrigger>
          <TabsTrigger value="routeurs" className="h-11 md:h-9">
            Routeurs
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <SplitView
        open={selectedSite !== null || selectedRouter !== null}
        onClose={() => select(null)}
        detailLabel={
          resource === "sites" ? "Fiche du site" : "Fiche du routeur"
        }
        list={
          <div className="flex flex-col gap-4">
            <RowCardToolbar
              search={text}
              onSearchChange={setText}
              searchLabel={
                resource === "sites"
                  ? "Rechercher un site par son nom"
                  : "Rechercher un routeur par son nom"
              }
              chips={resource === "sites" ? SITE_CHIPS : LINK_CHIPS}
              chip={resource === "sites" ? siteStatus : connectivity}
              onChipChange={(value) =>
                update(
                  resource === "sites"
                    ? { statut: value === "ALL" ? null : value }
                    : { connexion: value === "ALL" ? null : value },
                )
              }
            />
            <div className="flex flex-wrap gap-3">
              <OrganizationFilter
                session={session}
                value={organizationId}
                onChange={(id) => update({ organisation: id })}
              />
              {resource === "routeurs" ? (
                <FilterSelect
                  label="État du routeur"
                  value={lifecycle}
                  options={STATE_OPTIONS}
                  onChange={(value) =>
                    update({ etat: value === "ALL" ? null : value })
                  }
                />
              ) : null}
            </div>
            {list.isError ? (
              <InlineError
                error={list.error}
                retry={() => void list.refetch()}
                title="La liste n'a pas pu être chargée"
              />
            ) : resource === "sites" ? (
              <RowCardList
                label="Sites"
                groups={siteGroups}
                loading={sites.isPending}
                getKey={(s) => s.id}
                selectedKey={selected}
                onSelect={(s) => select(s.id)}
                empty={empty}
                toRow={(s) => ({
                  title: s.name,
                  meta: `${s.city} · ${orgName(s.organizationId)}`,
                  status: siteStatusLabels[s.status],
                  tone: organizationStatusTones[s.status],
                })}
              />
            ) : (
              <RowCardList
                label="Routeurs"
                groups={routerGroups}
                loading={routers.isPending}
                getKey={(r) => r.id}
                selectedKey={selected}
                onSelect={(r) => select(r.id)}
                empty={empty}
                toRow={(r) => ({
                  title: r.name,
                  meta: `${orgName(r.organizationId)} · ${r.lastSeenAt ? `vu ${formatRelative(r.lastSeenAt)}` : "jamais vu"}`,
                  status: connectivityLabels[r.connectivityStatus],
                  tone: connectivityTones[r.connectivityStatus],
                })}
              />
            )}
            {list.data ? (
              <RowCardPagination
                page={page + 1}
                pageSize={PAGE_SIZE}
                total={list.data.totalElements}
                onPageChange={(next) =>
                  update(
                    { page: next > 1 ? String(next - 1) : null },
                    { keepPage: true },
                  )
                }
              />
            ) : null}
          </div>
        }
        detail={
          selectedSite ? (
            <SitePanel
              site={selectedSite}
              organization={orgName(selectedSite.organizationId)}
            />
          ) : selectedRouter ? (
            <RouterPanel
              router={selectedRouter}
              organization={orgName(selectedRouter.organizationId)}
              site={
                selectedRouter.siteId
                  ? (siteNames.get(selectedRouter.siteId) ??
                    "Rattaché à un site")
                  : "Non rattaché"
              }
            />
          ) : null
        }
      />
    </>
  );
}
