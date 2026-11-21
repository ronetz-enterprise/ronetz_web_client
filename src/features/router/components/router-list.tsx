"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Router01Icon } from "@hugeicons/core-free-icons";
import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type FilterChip,
  StatusPill,
} from "@/components/patterns/row-card-list";
import { SplitView, useSelectedParam } from "@/components/patterns/split-view";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { InlineError, LinkButton } from "@/features/site/components/feedback";
import { useSites } from "@/features/site/queries/sites";
import type { Site } from "@/features/site/model/site";
import { routes } from "@/lib/routes";
import { routerCapabilities, routerState, type Router } from "../model/router";
import { useRouterList } from "../queries/routers";
import { RouterPanel } from "./router-panel";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const CHIPS = [
  { value: "all", label: "Tous" },
  { value: "online", label: "En ligne" },
  { value: "offline", label: "Hors ligne" },
  { value: "setup", label: "À installer" },
  { value: "suspended", label: "Suspendus" },
] as const;

const chipOf = (r: Router) => {
  const k = routerState(r).kind;
  return k === "failed" ? "setup" : k;
};

/** Routeurs de l'organisation (ou d'un seul site) en cartes-lignes, détail rapide dans un panneau. */
export function RoutersView({ siteId }: { siteId?: string }) {
  const { membership } = useOrganization();
  const canCreate = routerCapabilities(membership).canCreateRouter;
  const [page, setPage] = useState(0);
  const routers = useRouterList(page);
  const sites = useSites();
  const [selectedId, setSelectedId] = useSelectedParam("routeur");
  // Stripe : une ligne ouvre la page de l’élément (pas de panneau latéral).
  const nav = useRouter();
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");

  const siteById = useMemo(() => {
    const m = new Map<string, Site>();
    for (const s of sites.data ?? []) m.set(s.id, s);
    return m;
  }, [sites.data]);

  const all = useMemo(
    () =>
      (routers.data?.content ?? []).filter(
        (r) => !siteId || r.siteId === siteId,
      ),
    [routers.data, siteId],
  );
  const filtered = all.filter(
    (r) =>
      (chip === "all" || chipOf(r) === chip) &&
      (!search ||
        normalize(
          `${r.name} ${r.model} ${siteById.get(r.siteId ?? "")?.name ?? ""}`,
        ).includes(normalize(search))),
  );
  const chips: FilterChip[] = CHIPS.map((c) => ({
    value: c.value,
    label: c.label,
    count:
      c.value === "all"
        ? all.length
        : all.filter((r) => chipOf(r) === c.value).length,
  }));
  const selected = all.find((r) => r.id === selectedId) ?? null;
  const addHref = siteId
    ? `${routes.routerNew()}?site=${siteId}`
    : routes.routerNew();

  if (routers.isError)
    return (
      <InlineError error={routers.error} retry={() => void routers.refetch()} />
    );

  const empty =
    all.length === 0 ? (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Router01Icon} aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Aucun routeur pour l&apos;instant</EmptyTitle>
          <EmptyDescription>
            Le routeur est la boîte qui diffuse votre Wi-Fi. Ajoutez le vôtre
            pour pouvoir vendre des accès.
          </EmptyDescription>
        </EmptyHeader>
        {canCreate ? (
          <EmptyContent>
            <LinkButton href={addHref}>Ajouter un routeur</LinkButton>
          </EmptyContent>
        ) : null}
      </Empty>
    ) : undefined;

  return (
    <SplitView
      open={selected !== null}
      onClose={() => setSelectedId(null)}
      detailLabel="Détail du routeur"
      list={
        <div className="flex flex-col gap-4">
          {all.length > 0 ? (
            <RowCardToolbar
              search={search}
              onSearchChange={setSearch}
              searchLabel="Rechercher un routeur"
              chips={chips}
              chip={chip}
              onChipChange={setChip}
            />
          ) : null}
          <RowCardList
            label="Mes routeurs"
            loading={routers.isPending}
            groups={[
              {
                key: "all",
                label: `${filtered.length} routeur${filtered.length > 1 ? "s" : ""}`,
                items: filtered,
              },
            ]}
            getKey={(r) => r.id}
            selectedKey={selectedId}
            onSelect={(r) => nav.push(routes.router(r.id))}
            empty={empty}
            columns={[
              {
                key: "name",
                header: "Routeur",
                cell: (r) => <span className="font-medium">{r.name}</span>,
              },
              {
                key: "state",
                header: "État",
                cell: (r) => {
                  const s = routerState(
                    r,
                    new Date(),
                    siteById.get(r.siteId ?? "")?.timezone,
                  );
                  return <StatusPill label={s.label} tone={s.tone} />;
                },
              },
              {
                key: "site",
                header: "Site",
                cell: (r) => (
                  <span className="text-muted-foreground">
                    {siteById.get(r.siteId ?? "")?.name ?? "—"}
                  </span>
                ),
              },
              {
                key: "model",
                header: "Modèle",
                wide: true,
                cell: (r) => (
                  <span className="text-muted-foreground">
                    {r.vendor} {r.model}
                  </span>
                ),
              },
            ]}
            toRow={(r) => {
              const s = routerState(
                r,
                new Date(),
                siteById.get(r.siteId ?? "")?.timezone,
              );
              const site = siteById.get(r.siteId ?? "");
              return {
                title: r.name,
                meta: [site?.name, `${r.vendor} ${r.model}`]
                  .filter(Boolean)
                  .join(" · "),
                status: s.label,
                tone: s.tone,
              };
            }}
          />
          {routers.data && routers.data.totalElements > routers.data.size ? (
            <RowCardPagination
              page={page + 1}
              pageSize={routers.data.size}
              total={routers.data.totalElements}
              onPageChange={(p) => setPage(p - 1)}
            />
          ) : null}
          {routers.isFetching && !routers.isPending ? (
            <span className="sr-only" role="status">
              Mise à jour…
            </span>
          ) : null}
        </div>
      }
      detail={
        selected ? (
          <RouterPanel
            router={selected}
            site={siteById.get(selected.siteId ?? "")}
          />
        ) : null
      }
    />
  );
}
