"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NoAccess } from "@/features/dashboard/components/block-error";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  WITHDRAWALS_ENABLED,
  WITHDRAWALS_UNAVAILABLE_MESSAGE,
} from "../config";
import { canViewFinance } from "../model/finance";
import { useBalance } from "../queries/finance";
import { BalanceSummary, PayoutsAside, WithdrawPanel } from "./balance-cards";
import { MonthOverview } from "./month-overview";
import { MovementsList } from "./movements-list";
import { WithdrawalDialog } from "./withdrawal-dialog";
import { WithdrawalsPanel } from "./withdrawals-panel";

type Tab = "movements" | "withdrawals";

export function parsePage(value: string | null) {
  return /^\d{1,5}$/.test(value ?? "") ? Number(value) : 0;
}

export function FinancePage() {
  const { can } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const balance = useBalance();
  const tab: Tab =
    params.get("onglet") === "retraits" ? "withdrawals" : "movements";
  const page = parsePage(params.get("page"));

  function update(next: { tab?: Tab; page?: number }) {
    const search = new URLSearchParams(params.toString());
    if (next.tab) {
      if (next.tab === "withdrawals") search.set("onglet", "retraits");
      else search.delete("onglet");
      search.delete("page");
    }
    if (next.page !== undefined) {
      if (next.page) search.set("page", String(next.page));
      else search.delete("page");
    }
    const qs = search.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (!canViewFinance(can))
    return (
      <div className="w-full">
        <PageHeader title="Finances" />
        <NoAccess what="L’accès aux finances" />
      </div>
    );

  const withdraw =
    WITHDRAWALS_ENABLED && balance.data ? (
      <WithdrawalDialog balance={balance.data} />
    ) : (
      // Comme Stripe : le bouton reste visible, grisé, et dit pourquoi au survol.
      <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} className="inline-flex" />}>
          <Button variant="outline" disabled className="h-11 sm:h-9">
            Retirer
          </Button>
        </TooltipTrigger>
        <TooltipContent>{WITHDRAWALS_UNAVAILABLE_MESSAGE}</TooltipContent>
      </Tooltip>
    );

  // Composition de « Aujourd'hui » chez Stripe (capture 03) : titre et action, filet ;
  // chiffres et barres du mois à gauche, panneau gris d'action à droite ; deux blocs
  // côte à côte (le mois, les versements) ; puis l'activité récente.
  return (
    <div className="flex w-full flex-col gap-8">
      <header className="border-b border-border pb-4">
        <h1 className="text-[28px] leading-9 font-bold">Finances</h1>
      </header>
      {!WITHDRAWALS_ENABLED ? (
        <p className="-mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={1.8}
            className="size-4 shrink-0"
          />
          {WITHDRAWALS_UNAVAILABLE_MESSAGE}
        </p>
      ) : null}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <MonthOverview balance={balance.data} />
        <WithdrawPanel balance={balance.data} action={withdraw} />
      </div>
      <div className="grid items-start gap-8 border-t border-border pt-8 md:grid-cols-2 md:gap-12">
        <BalanceSummary />
        <PayoutsAside />
      </div>
      <section aria-labelledby="activity" className="flex flex-col gap-4">
        <h2
          id="activity"
          className="border-b border-border pb-2 text-xl font-bold"
        >
          Activité récente
        </h2>
        <Tabs
          value={tab}
          onValueChange={(value) => update({ tab: value as Tab })}
        >
          <TabsList variant="line" aria-label="Activité récente">
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
            <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "movements" ? (
          <MovementsList page={page} onPage={(p) => update({ page: p })} />
        ) : (
          <WithdrawalsPanel page={page} onPage={(p) => update({ page: p })} />
        )}
        <p className="text-xs text-muted-foreground">
          Les ventes manuelles ne sont pas encore comptées dans vos soldes.
        </p>
      </section>
    </div>
  );
}
