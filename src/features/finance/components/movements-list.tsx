"use client";

import { Amount } from "@/components/amount";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  RowCardList,
  type RowCardGroup,
} from "@/components/patterns/row-card-list";
import { BlockError } from "@/features/dashboard/components/block-error";
import { dayBalanceEffect, dayLabel, groupByDay } from "../model/days";
import {
  balanceEffect,
  ledgerTypeLabels,
  type LedgerTransaction,
} from "../model/finance";
import { useLedger } from "../queries/finance";
import { Pager } from "./pager";

const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

/** Groupes par jour ; le total d'un jour coupé entre deux pages n'est pas affiché (il serait faux). */
export function buildGroups(
  content: LedgerTransaction[],
  page: number,
  totalPages: number,
  now = new Date(),
): RowCardGroup<LedgerTransaction>[] {
  const days = groupByDay(content);
  return days.map((group, index) => {
    const cutAtStart = index === 0 && page > 0;
    const cutAtEnd = index === days.length - 1 && page + 1 < totalPages;
    const complete = !cutAtStart && !cutAtEnd;
    const total = dayBalanceEffect(group.items, balanceEffect);
    return {
      key: group.day,
      label: dayLabel(group.day, now),
      total: complete ? (
        <span className="inline-flex items-baseline gap-1">
          <span className="text-muted-foreground">Total du jour</span>
          <Amount value={total} />
        </span>
      ) : undefined,
      items: group.items,
    };
  });
}

export function toMovementRow(tx: LedgerTransaction) {
  const meta = ledgerTypeLabels[tx.type] ?? {
    label: tx.type,
    sign: 0 as const,
  };
  const effect = balanceEffect(tx);
  const at = new Date(tx.createdAt);
  const when = Number.isNaN(at.getTime()) ? "" : time.format(at);
  const commission =
    tx.type === "SALE" && tx.commissionAmount > 0
      ? ` · commission ${tx.commissionAmount.toLocaleString("fr-FR")} ${tx.currency === "XAF" ? "FCFA" : tx.currency}`
      : "";
  return {
    title: meta.label,
    amount: effect ?? tx.netAmount,
    meta: `${when}${commission}`,
    status: effect === null ? "Sans effet sur le solde" : undefined,
    tone: "neutral" as const,
  };
}

export function MovementsList({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const ledger = useLedger(page);
  if (ledger.isError)
    return (
      <BlockError error={ledger.error} retry={() => void ledger.refetch()} />
    );
  const data = ledger.data;
  const empty = (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Aucun mouvement pour le moment</EmptyTitle>
        <EmptyDescription>
          Les ventes payées, retraits et remboursements apparaîtront ici dès le
          premier paiement d’un client.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
  return (
    <div>
      <RowCardList
        label="Mouvements"
        loading={ledger.isPending}
        groups={data ? buildGroups(data.content, page, data.totalPages) : []}
        getKey={(tx) => tx.id}
        columns={[
          {
            key: "amount",
            header: "Montant",
            cell: (tx) => {
              const e = balanceEffect(tx);
              return (
                <Amount value={e ?? tx.netAmount} className="font-semibold" />
              );
            },
          },
          {
            key: "type",
            header: "Type",
            cell: (tx) => ledgerTypeLabels[tx.type]?.label ?? tx.type,
          },
          {
            key: "commission",
            header: "Commission",
            wide: true,
            cell: (tx) =>
              tx.type === "SALE" && tx.commissionAmount > 0 ? (
                <Amount
                  value={tx.commissionAmount}
                  className="text-muted-foreground"
                />
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: "time",
            header: "Heure",
            align: "end",
            cell: (tx) => {
              const at = new Date(tx.createdAt);
              return (
                <span className="text-muted-foreground">
                  {Number.isNaN(at.getTime()) ? "" : time.format(at)}
                </span>
              );
            },
          },
        ]}
        toRow={toMovementRow}
        empty={empty}
      />
      {data ? (
        <Pager
          page={page}
          totalPages={data.totalPages}
          busy={ledger.isFetching}
          onChange={onPage}
        />
      ) : null}
    </div>
  );
}
