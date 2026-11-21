"use client";

import { useState, type ReactNode } from "react";

import { Amount, formatNumber } from "@/components/amount";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockError } from "@/features/dashboard/components/block-error";
import type { Balance, LedgerTransaction } from "../model/finance";
import { useSalesInRange } from "../queries/finance";

/** Bornes du mois en cours, figées au premier rendu. */
export function useMonth() {
  const [month] = useState(() => {
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return { from, to, today: new Date().getDate() };
  });
  return month;
}

/**
 * Haut de Finances, d'après « Aujourd'hui » de Stripe (capture 03) : les chiffres clés côte à
 * côte, puis une barre par jour du mois (recettes nettes), le jour courant en couleur.
 */
export function MonthOverview({ balance }: { balance: Balance | undefined }) {
  const month = useMonth();
  const sales = useSalesInRange(month.from, month.to);
  if (sales.isError)
    return (
      <BlockError error={sales.error} retry={() => void sales.refetch()} />
    );
  const list = sales.data?.sales ?? [];
  const net = list.reduce((n, t) => n + t.netAmount, 0);
  const days = new Date(
    month.from.getFullYear(),
    month.from.getMonth() + 1,
    0,
  ).getDate();
  const perDay = dailyNet(list, days);
  const monthName = month.from.toLocaleDateString("fr-FR", { month: "long" });

  return (
    <section aria-label="Vue du mois" className="flex min-w-0 flex-col gap-6">
      <dl className="flex flex-wrap gap-x-12 gap-y-4">
        <Figure label="Disponible" strong>
          {balance ? <Amount value={balance.availableAmount} /> : "…"}
        </Figure>
        <Figure label={`Revenus nets en ${monthName}`}>
          {sales.isPending ? "…" : <Amount value={net} />}
        </Figure>
        <Figure label="Ventes">{sales.isPending ? "…" : list.length}</Figure>
      </dl>
      {sales.isPending ? (
        <Skeleton className="h-36" />
      ) : (
        <MonthBars values={perDay} today={month.today} monthName={monthName} />
      )}
    </section>
  );
}

function Figure({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          strong
            ? "text-[28px] leading-9 font-semibold tabular-nums"
            : "text-[28px] leading-9 text-muted-foreground tabular-nums"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function dailyNet(list: LedgerTransaction[], days: number) {
  const out = Array.from({ length: days }, () => 0);
  for (const t of list) {
    const d = new Date(t.createdAt).getDate();
    if (d >= 1 && d <= days) out[d - 1] += t.netAmount;
  }
  return out;
}

/** Une barre par jour ; les jours à venir restent vides, le jour courant est mis en avant. */
function MonthBars({
  values,
  today,
  monthName,
}: {
  values: number[];
  today: number;
  monthName: string;
}) {
  const max = Math.max(...values, 1);
  const best = values.indexOf(Math.max(...values));
  return (
    <figure className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`Revenus nets par jour en ${monthName}, meilleur jour : le ${best + 1} avec ${formatNumber(values[best] ?? 0)} FCFA`}
        className="flex h-36 items-end gap-[3px] border-b border-border"
      >
        {values.map((v, i) => {
          const day = i + 1;
          const future = day > today;
          return (
            <span
              key={day}
              title={
                future
                  ? undefined
                  : `${day} ${monthName} : ${formatNumber(v)} FCFA`
              }
              className={
                future
                  ? "h-px flex-1 rounded-t-sm bg-border"
                  : day === today
                    ? "flex-1 rounded-t-sm bg-signal"
                    : "flex-1 rounded-t-sm bg-signal/35"
              }
              style={
                future
                  ? undefined
                  : { height: `${Math.max(2, (v / max) * 100)}%` }
              }
            />
          );
        })}
      </div>
      <figcaption className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>1 {monthName}</span>
        <span>
          {values.length} {monthName}
        </span>
      </figcaption>
    </figure>
  );
}
