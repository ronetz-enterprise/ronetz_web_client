"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Amount } from "@/components/amount";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent } from "@/lib/format";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  dailySales,
  describeChange,
  sum,
  type SalesDay,
} from "../model/sales-report";
import { useSalesReport } from "../queries/dashboard";
import { BlockError } from "./block-error";
import { MiniLine } from "./day-chart";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

function Metric({
  title,
  value,
  change,
  previous,
  children,
}: {
  title: string;
  value: React.ReactNode;
  change?: string | null;
  previous: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="font-figure text-[28px] leading-9">
        {value}
        {change ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {change}
          </span>
        ) : null}
      </p>
      <p className="text-sm text-muted-foreground tabular-nums">{previous}</p>
      <div className="mt-3 min-h-16">{children}</div>
    </div>
  );
}

function NoData({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-16 place-items-center rounded-lg border border-dashed border-border px-2 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Metrics({ period, now }: { period: Period; now: Date }) {
  // Une seule demande sur deux périodes : les `period` derniers jours et les `period` d'avant.
  const report = useSalesReport(period * 2, now);
  if (report.isPending)
    return (
      <div
        className="grid gap-4 md:grid-cols-3"
        role="status"
        aria-label="Chargement"
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  if (report.isError)
    return (
      <BlockError error={report.error} retry={() => void report.refetch()} />
    );

  const days = dailySales(report.data?.series ?? [], now, period * 2);
  const before: SalesDay[] = days.slice(0, period);
  const current: SalesDay[] = days.slice(period);
  const sold = sum(current, "count");
  const earned = sum(current, "net");
  const soldBefore = sum(before, "count");
  const earnedBefore = sum(before, "net");
  const label = `les ${period} jours d’avant`;
  // Taux de paiements réussis : le rapport ne le donne que sur la période entière demandée.
  const confirmed = report.data?.confirmedPayments ?? 0;
  const failedPayments = report.data?.failedPayments ?? 0;
  const attempts = confirmed + failedPayments;
  const empty = !sold && !soldBefore;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric
        title="Accès vendus"
        value={formatNumber(sold)}
        change={describeChange(sold, soldBefore)}
        previous={`${formatNumber(soldBefore)} ${label}`}
      >
        {empty ? (
          <NoData>Aucune vente sur cette période</NoData>
        ) : (
          <MiniLine values={current.map((d) => d.count)} />
        )}
      </Metric>
      <Metric
        title="Revenus"
        value={<Amount value={earned} />}
        change={describeChange(earned, earnedBefore)}
        previous={`${formatNumber(earnedBefore)} FCFA ${label}`}
      >
        {empty ? (
          <NoData>Aucun revenu sur cette période</NoData>
        ) : (
          <MiniLine values={current.map((d) => d.net)} />
        )}
      </Metric>
      <Metric
        title="Paiements réussis"
        value={attempts ? formatPercent(confirmed / attempts) : "—"}
        previous={`${formatNumber(confirmed)} réussis · ${formatNumber(failedPayments)} échoués (${period * 2} jours)`}
      >
        {attempts ? null : <NoData>Aucun paiement</NoData>}
      </Metric>
    </div>
  );
}

/** « Votre activité » : puces de période et cartes de métriques comparées à la période d'avant. */
export function ActivitySection({ now }: { now: Date }) {
  const { can, organizationId } = useOrganization();
  const [period, setPeriod] = useState<Period>(7);
  const key = `ronetz.dashboard-note-hidden.${organizationId}`;
  const [noteHidden, setNoteHidden] = useState(() => {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  if (!can("FINANCE_READ")) return null;
  return (
    <section aria-labelledby="activity" className="flex flex-col gap-4">
      <h2 id="activity" className="text-2xl font-semibold tracking-tight">
        Votre activité
      </h2>
      <div
        role="group"
        aria-label="Période"
        className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-1"
      >
        {PERIODS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
            className={
              period === value
                ? "h-10 shrink-0 rounded-md bg-background px-3 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)] outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:h-7"
                : "h-10 shrink-0 rounded-md px-3 text-[13px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 md:h-7"
            }
          >
            {value} derniers jours
          </button>
        ))}
      </div>
      <Metrics period={period} now={now} />
      {noteHidden ? null : (
        <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={1.8}
            className="size-5 shrink-0 text-muted-foreground"
          />
          <p className="flex-1">
            Ces chiffres comptent les ventes payées en ligne. Les ventes
            manuelles n’y sont pas encore incluses.
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Masquer ce message"
            onClick={() => {
              setNoteHidden(true);
              try {
                window.localStorage.setItem(key, "1");
              } catch {
                /* préférence locale seulement */
              }
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
          </Button>
        </div>
      )}
    </section>
  );
}
