"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";
import {
  RowCardList,
  RowCardToolbar,
  type FilterChip,
  StatusPill,
} from "@/components/patterns/row-card-list";
import { SplitView, useSelectedParam } from "@/components/patterns/split-view";
import { StateDot } from "@/components/patterns/row-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { useRouterList } from "@/features/router/queries/routers";
import { routerState } from "@/features/router/model/router";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  siteCapabilities,
  siteLocation,
  siteStatusLabels,
  siteTone,
  type Site,
} from "../model/site";
import { useSites } from "../queries/sites";
import { Facts, InlineError, LinkButton } from "./feedback";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const CHIPS = [
  { value: "all", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "SUSPENDED", label: "Suspendus" },
] as const;

function routerSummary(count: number | undefined) {
  if (count === undefined) return "";
  return count === 0
    ? "Aucun routeur"
    : `${count} routeur${count > 1 ? "s" : ""}`;
}

export function SitesView() {
  const { membership } = useOrganization();
  const canCreate = siteCapabilities(membership).canCreateSite;
  const sites = useSites();
  const routers = useRouterList(0);
  const [selectedId, setSelectedId] = useSelectedParam("site");
  // Stripe : une ligne ouvre la page de l’élément (pas de panneau latéral).
  const nav = useRouter();
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");

  const bySite = useMemo(() => {
    const m = new Map<string, { total: number; online: number }>();
    for (const r of routers.data?.content ?? []) {
      if (!r.siteId || r.lifecycleStatus === "REVOKED") continue;
      const cur = m.get(r.siteId) ?? { total: 0, online: 0 };
      cur.total += 1;
      if (routerState(r).kind === "online") cur.online += 1;
      m.set(r.siteId, cur);
    }
    return m;
  }, [routers.data]);

  if (sites.isError)
    return (
      <InlineError error={sites.error} retry={() => void sites.refetch()} />
    );

  const all = (sites.data ?? []).filter((s) => s.status !== "CLOSED");
  const filtered = all.filter(
    (s) =>
      (chip === "all" || s.status === chip) &&
      (!search ||
        normalize(`${s.name} ${s.city} ${s.district ?? ""}`).includes(
          normalize(search),
        )),
  );
  const chips: FilterChip[] = CHIPS.map((c) => ({
    value: c.value,
    label: c.label,
    count:
      c.value === "all"
        ? all.length
        : all.filter((s) => s.status === c.value).length,
  }));
  const selected = all.find((s) => s.id === selectedId) ?? null;
  const countOf = (s: Site) =>
    routers.data ? (bySite.get(s.id)?.total ?? 0) : undefined;

  const empty =
    all.length === 0 ? (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Location01Icon} aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Aucun site pour l&apos;instant</EmptyTitle>
          <EmptyDescription>
            Un site est l&apos;endroit où se trouve votre Wi-Fi : un cybercafé,
            une boutique, un hôtel. Créez le premier pour continuer.
          </EmptyDescription>
        </EmptyHeader>
        {canCreate ? (
          <EmptyContent>
            <LinkButton href={routes.siteNew()}>Créer mon site</LinkButton>
          </EmptyContent>
        ) : null}
      </Empty>
    ) : undefined;

  return (
    <SplitView
      open={selected !== null}
      onClose={() => setSelectedId(null)}
      detailLabel="Détail du site"
      list={
        <div className="flex flex-col gap-4">
          {all.length > 0 ? (
            <RowCardToolbar
              search={search}
              onSearchChange={setSearch}
              searchLabel="Rechercher un site"
              chips={chips}
              chip={chip}
              onChipChange={setChip}
            />
          ) : null}
          <RowCardList
            label="Mes sites"
            loading={sites.isPending}
            groups={[
              {
                key: "all",
                label: `${filtered.length} site${filtered.length > 1 ? "s" : ""}`,
                items: filtered,
              },
            ]}
            getKey={(s) => s.id}
            selectedKey={selectedId}
            onSelect={(s) => nav.push(routes.site(s.id))}
            empty={empty}
            columns={[
              {
                key: "name",
                header: "Site",
                cell: (s) => <span className="font-medium">{s.name}</span>,
              },
              {
                key: "status",
                header: "État",
                cell: (s) => (
                  <StatusPill
                    label={siteStatusLabels[s.status]}
                    tone={siteTone(s.status)}
                  />
                ),
              },
              {
                key: "city",
                header: "Ville",
                cell: (s) => (
                  <span className="text-muted-foreground">
                    {siteLocation(s) || "—"}
                  </span>
                ),
              },
              {
                key: "routers",
                header: "Routeurs",
                align: "end",
                cell: (s) => routerSummary(countOf(s)) || "—",
              },
            ]}
            toRow={(s) => ({
              title: s.name,
              meta: [siteLocation(s), routerSummary(countOf(s))]
                .filter(Boolean)
                .join(" · "),
              status: siteStatusLabels[s.status],
              tone: siteTone(s.status),
            })}
          />
        </div>
      }
      detail={
        selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold break-words">
                {selected.name}
              </h2>
              <div>
                <StateDot
                  label={siteStatusLabels[selected.status]}
                  tone={siteTone(selected.status)}
                />
              </div>
            </div>
            <Facts
              items={[
                { label: "Ville", value: siteLocation(selected) },
                {
                  label: "Routeurs",
                  value: bySite.get(selected.id)
                    ? `${bySite.get(selected.id)!.online} en ligne sur ${bySite.get(selected.id)!.total}`
                    : routers.data
                      ? "Aucun routeur"
                      : "…",
                },
                { label: "Créé le", value: formatDate(selected.createdAt) },
              ]}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <LinkButton href={routes.site(selected.id)}>
                Ouvrir le site
              </LinkButton>
              {selected.status === "ACTIVE" && canCreate ? (
                <LinkButton
                  href={`${routes.routerNew()}?site=${selected.id}`}
                  variant="outline"
                >
                  Ajouter un routeur
                </LinkButton>
              ) : null}
            </div>
          </div>
        ) : null
      }
    />
  );
}
