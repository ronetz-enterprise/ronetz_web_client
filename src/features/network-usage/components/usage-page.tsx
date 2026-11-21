"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RowCard } from "@/components/patterns/row-card";
import {
  BlockError,
  NoAccess,
} from "@/features/dashboard/components/block-error";
import { formatNumber } from "@/lib/format";
import { lastDaysFilters, previousPeriod } from "../model/network-usage";
import { formatBytes, successRate } from "../model/units";
import {
  useAccessUsageSummary,
  useCanViewUsage,
  useRouterUsage,
  useSitePerformance,
} from "../queries/network-usage";

const PERIODS = [7, 30, 90] as const;

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium">{label}</h3>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-sm text-muted-foreground tabular-nums">{hint}</p>
    </div>
  );
}

export function UsagePage() {
  const allowed = useCanViewUsage();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const filters = useMemo(() => lastDaysFilters(days, null), [days]);
  const summary = useAccessUsageSummary(filters);
  const before = useAccessUsageSummary(previousPeriod(filters));
  const routers = useRouterUsage(0, 20);
  const sites = useSitePerformance();

  if (!allowed)
    return (
      <div className="w-full">
        <PageHeader title="Consommation" />
        <NoAccess what="Ce suivi" />
      </div>
    );
  const s = summary.data;
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Consommation"
        description="Connexions et volume de données sur votre réseau."
        className="pb-0"
      />
      <div role="group" aria-label="Période" className="flex flex-wrap gap-2">
        {PERIODS.map((d) => (
          <Button
            key={d}
            size="sm"
            className="h-11 font-normal sm:h-8"
            variant={days === d ? "secondary" : "outline"}
            aria-pressed={days === d}
            onClick={() => setDays(d)}
          >
            {d} derniers jours
          </Button>
        ))}
      </div>
      {summary.isPending ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : summary.isError ? (
        <BlockError
          error={summary.error}
          retry={() => void summary.refetch()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Connexions"
            value={formatNumber(s!.sessions)}
            hint={`${formatNumber(before.data?.sessions ?? 0)} sur la période d’avant`}
          />
          <Stat
            label="Données échangées"
            value={formatBytes(s!.inputBytes + s!.outputBytes)}
            hint="Envoyées et reçues"
          />
          <Stat
            label="Connexions réussies"
            value={
              successRate(
                s!.authenticationSuccesses,
                s!.authenticationFailures,
              ) ?? "—"
            }
            hint={`${formatNumber(s!.active)} accès en cours`}
          />
        </div>
      )}
      <section aria-labelledby="usage-routers" className="flex flex-col gap-2">
        <h2 id="usage-routers" className="text-lg font-semibold">
          Par routeur
        </h2>
        {routers.isPending ? (
          <Skeleton className="h-14" />
        ) : routers.isError ? (
          <BlockError
            error={routers.error}
            retry={() => void routers.refetch()}
          />
        ) : routers.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun routeur mesuré pour le moment.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {routers.data.map((r) => (
              <RowCard
                key={r.routerId}
                title={r.routerName ?? "Routeur sans nom"}
                value={formatBytes(r.totalInputBytes + r.totalOutputBytes)}
                meta={`${formatNumber(r.totalSessionCount)} connexions`}
                status={r.status === "ONLINE" ? "En ligne" : "Hors ligne"}
                tone={r.status === "ONLINE" ? "success" : "neutral"}
              />
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="usage-sites" className="flex flex-col gap-2">
        <h2 id="usage-sites" className="text-lg font-semibold">
          Par site
        </h2>
        {sites.isPending ? (
          <Skeleton className="h-14" />
        ) : sites.isError ? (
          <BlockError error={sites.error} retry={() => void sites.refetch()} />
        ) : sites.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun site mesuré.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {sites.data.map((x) => (
              <RowCard
                key={x.siteId}
                title={x.siteName ?? "Site sans nom"}
                value={`${x.onlineRouterCount} / ${x.routerCount} routeurs`}
                meta={`${formatNumber(x.accessCount)} accès · ${formatNumber(x.activeOfferCount)} offres actives`}
              />
            ))}
          </div>
        )}
      </section>
      <p className="text-xs text-muted-foreground">
        Les mesures de connexion remontent des routeurs : tant qu’ils n’en
        envoient pas, les totaux restent à zéro.
      </p>
    </div>
  );
}
