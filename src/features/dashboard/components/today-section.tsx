"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Amount, formatNumber } from "@/components/amount";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addDays,
  cumulativeByHour,
  salesNet,
  startOfDay,
} from "@/features/finance/model/days";
import {
  useBalance,
  useSalesInRange,
} from "@/features/finance/queries/finance";
import { routes } from "@/lib/routes";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { accessTodos, clock, routerTodos, type TodoItem } from "../model/todo";
import { useAccessForTodo, useRoutersForTodo } from "../queries/dashboard";
import { BlockError, NoAccess } from "./block-error";
import { DayChart } from "./day-chart";

function endOfDay(date: Date) {
  const end = startOfDay(addDays(date, 1));
  return new Date(end.getTime() - 1);
}

function Figure({
  label,
  hint,
  children,
  strong,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          strong
            ? "font-figure text-[34px] leading-10"
            : "font-figure text-[22px] leading-10 font-semibold text-muted-foreground"
        }
      >
        {children}
      </dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}

function TodayFigures({ now }: { now: Date }) {
  const todayFrom = useMemo(() => startOfDay(now), [now]);
  const today = useSalesInRange(todayFrom, endOfDay(now));
  const yesterday = useSalesInRange(
    startOfDay(addDays(now, -1)),
    new Date(todayFrom.getTime() - 1),
  );
  const balance = useBalance();
  const curve = useMemo(
    () => (today.data ? cumulativeByHour(today.data.sales, now) : null),
    [today.data, now],
  );

  if (today.isPending)
    return (
      <div
        className="flex flex-col gap-4"
        role="status"
        aria-label="Chargement"
      >
        <Skeleton className="h-16 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (today.isError)
    return (
      <BlockError error={today.error} retry={() => void today.refetch()} />
    );

  const total = salesNet(today.data.sales);
  const atLeast = today.data.partial ? "au moins " : "";
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <dl className="flex flex-wrap items-start gap-x-10 gap-y-3 divide-border sm:divide-x [&>div]:sm:pr-10 [&>div:last-child]:pr-0">
        <Figure
          strong
          label="Revenus du jour"
          hint={`à ${clock(now)}, après commission`}
        >
          {atLeast}
          <Amount value={total} />
        </Figure>
        <Figure label="Hier">
          {yesterday.isPending ? (
            <Skeleton className="mt-1 h-7 w-28" />
          ) : yesterday.isError ? (
            <span className="text-base">Indisponible</span>
          ) : (
            <>
              {yesterday.data.partial ? "au moins " : ""}
              <Amount value={salesNet(yesterday.data.sales)} />
            </>
          )}
        </Figure>
        <Figure label="Solde disponible">
          {balance.isPending ? (
            <Skeleton className="mt-1 h-7 w-28" />
          ) : balance.isError ? (
            <span className="text-base">Indisponible</span>
          ) : (
            <Amount value={balance.data.availableAmount} />
          )}
        </Figure>
      </dl>
      {curve ? (
        <>
          <DayChart
            values={curve}
            minutes={now.getMinutes()}
            label={`Revenus cumulés de la journée : ${formatNumber(total)} FCFA à ${clock(now)}`}
          />
          {today.data.sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune vente payée pour l’instant aujourd’hui.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function hrefFor(item: TodoItem) {
  if (item.target === "router" && item.id) return routes.router(item.id);
  if (item.target === "routers") return routes.routers();
  return routes.access();
}

function TodoPanel({ now }: { now: Date }) {
  const { organizationId, membership } = useOrganization();
  const routers = useRoutersForTodo();
  const access = useAccessForTodo();
  const storageKey = `ronetz.todo-hidden.${organizationId}.${now.toDateString()}`;
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });
  if (membership.role !== "OWNER" || hidden) return null;

  const items: TodoItem[] = [
    ...(routers.data ? routerTodos(routers.data.routers, now) : []),
    ...(access.data
      ? accessTodos(access.data.accesses, now, access.data.partial)
      : []),
  ];
  const loading = routers.isPending || access.isPending;
  const failed = routers.isError ? routers : access.isError ? access : null;

  return (
    <aside
      aria-labelledby="todo"
      className="flex flex-col gap-4 self-start rounded-xl bg-muted p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="todo" className="text-base font-semibold">
          À faire maintenant
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Masquer cette liste pour aujourd’hui"
          onClick={() => {
            setHidden(true);
            try {
              window.localStorage.setItem(storageKey, "1");
            } catch {
              /* préférence locale seulement */
            }
          }}
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
        </Button>
      </div>
      {loading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <>
          {items.length ? (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.key} className="flex flex-col gap-1">
                  <p className="text-sm">{item.text}</p>
                  <Link
                    href={hrefFor(item)}
                    className="w-fit py-1 text-sm font-medium text-signal underline-offset-4 hover:underline"
                  >
                    {item.cta}
                  </Link>
                </li>
              ))}
            </ul>
          ) : !failed ? (
            <p className="text-sm text-muted-foreground">
              Rien à faire pour le moment : vos routeurs répondent et aucun
              accès n’expire ce soir.
            </p>
          ) : null}
          {failed ? (
            <BlockError
              className="flex flex-col gap-2 text-sm"
              error={failed.error}
              retry={() => void failed.refetch()}
            />
          ) : null}
        </>
      )}
    </aside>
  );
}

/** « Aujourd'hui » : recettes du jour, hier, solde, courbe heure par heure et liste « À faire maintenant ». */
export function TodaySection({ now }: { now: Date }) {
  const { can } = useOrganization();
  const allowed = can("FINANCE_READ");
  return (
    <section aria-labelledby="today" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <h1
          id="today"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Aujourd’hui
        </h1>
        {allowed ? (
          <Button
            variant="outline"
            className="h-11 sm:h-9"
            render={<Link href={routes.finance()} />}
            nativeButton={false}
          >
            Voir mes finances
          </Button>
        ) : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {allowed ? <TodayFigures now={now} /> : <NoAccess what="Ce tableau" />}
        <TodoPanel now={now} />
      </div>
    </section>
  );
}
