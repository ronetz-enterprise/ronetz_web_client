"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDataTransferHorizontalIcon } from "@hugeicons/core-free-icons";

import { Amount } from "@/components/amount";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockError } from "@/features/dashboard/components/block-error";
import { useState, type ReactNode } from "react";
import type { Balance } from "../model/finance";
import { useBalance, useSalesInRange } from "../queries/finance";

/**
 * « Ce mois-ci », sur le modèle du « Détail du paiement » de Stripe (capture 39) : ce que les
 * clients ont payé, la commission Ronetz, puis ce qui vous revient, en gras.
 * Les chiffres viennent du grand livre (ventes du mois en cours).
 */
export function BalanceSummary() {
  const [month] = useState(() => {
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return { from, to };
  });
  const sales = useSalesInRange(month.from, month.to);
  if (sales.isPending)
    return (
      <div
        role="status"
        aria-label="Chargement du mois"
        className="flex flex-col gap-3"
      >
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28" />
      </div>
    );
  if (sales.isError)
    return (
      <BlockError error={sales.error} retry={() => void sales.refetch()} />
    );
  const list = sales.data.sales;
  const gross = list.reduce((n, t) => n + t.grossAmount, 0);
  const commission = list.reduce((n, t) => n + t.commissionAmount, 0);
  const net = list.reduce((n, t) => n + t.netAmount, 0);
  const monthName = month.from.toLocaleDateString("fr-FR", { month: "long" });

  return (
    <section aria-labelledby="month-summary" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
        <h2 id="month-summary" className="text-xl font-bold">
          Ce mois-ci
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {list.length} {list.length > 1 ? "ventes" : "vente"} en {monthName}
          {sales.data.partial ? " (au moins)" : ""}
        </span>
      </div>
      <dl className="flex flex-col text-sm">
        <div className="flex h-11 items-center justify-between gap-4 border-b border-border">
          <dt className="font-semibold">Payé par vos clients</dt>
          <dd className="font-semibold tabular-nums">
            <Amount value={gross} />
          </dd>
        </div>
        <div className="flex h-11 items-center justify-between gap-4 border-b border-border">
          <dt className="text-muted-foreground">Commission Ronetz</dt>
          <dd className="text-muted-foreground tabular-nums">
            − <Amount value={commission} />
          </dd>
        </div>
        <div className="flex h-12 items-center justify-between gap-4">
          <dt className="text-base font-bold">Vos revenus nets</dt>
          <dd className="text-base font-bold tabular-nums">
            <Amount value={net} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Colonne de droite, comme « Virements automatiques » chez Stripe : ce qui est déjà parti. */
export function PayoutsAside() {
  const balance = useBalance();
  return (
    <aside aria-labelledby="payouts" className="flex flex-col gap-3">
      <h2
        id="payouts"
        className="border-b border-border pb-2 text-xl font-bold"
      >
        Retraits
      </h2>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <HugeiconsIcon
            icon={ArrowDataTransferHorizontalIcon}
            strokeWidth={1.8}
            className="size-4"
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">Total retiré</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {balance.data ? <Amount value={balance.data.paidOutAmount} /> : "…"}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Total reçu sur votre compte mobile depuis l’ouverture.
      </p>
      {balance.data && balance.data.reservedAmount > 0 ? (
        <p className="flex items-center gap-2 text-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-state-warn" />
          Retrait en cours :{" "}
          <span className="font-semibold tabular-nums">
            <Amount value={balance.data.reservedAmount} />
          </span>
        </p>
      ) : null}
    </aside>
  );
}

/** Panneau gris à droite, comme « Recommandations » chez Stripe : ce que vous pouvez retirer. */
export function WithdrawPanel({
  balance,
  action,
}: {
  balance: Balance | undefined;
  action: ReactNode;
}) {
  return (
    <aside
      aria-labelledby="withdraw-panel"
      className="flex flex-col gap-3 rounded-xl bg-muted p-5"
    >
      <h2 id="withdraw-panel" className="text-sm font-semibold">
        Effectuer un retrait
      </h2>
      <p className="text-sm text-muted-foreground">
        {balance ? (
          <>
            <span className="font-semibold text-foreground tabular-nums">
              <Amount value={balance.availableAmount} />
            </span>{" "}
            peuvent être envoyés sur votre compte mobile.
          </>
        ) : (
          "Chargement du solde…"
        )}
      </p>
      <div>{action}</div>
    </aside>
  );
}
