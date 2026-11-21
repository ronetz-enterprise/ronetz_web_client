"use client";

import { useState } from "react";
import { Amount } from "@/components/amount";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { RowCardList } from "@/components/patterns/row-card-list";
import { BlockError } from "@/features/dashboard/components/block-error";
import { toUserMessage } from "@/lib/api-error";
import { dayLabel, groupByDay } from "../model/days";
import {
  networkLabels,
  withdrawalStatusLabels,
  type Withdrawal,
} from "../model/finance";
import { useCancelWithdrawal, useWithdrawals } from "../queries/finance";
import { Pager } from "./pager";

export function toWithdrawalRow(w: Withdrawal) {
  const status = withdrawalStatusLabels[w.status] ?? {
    label: w.status,
    tone: "neutral" as const,
  };
  const extra =
    w.status === "REJECTED" && w.decisionReason
      ? ` · ${w.decisionReason}`
      : w.status === "FAILED"
        ? " · le montant est de nouveau disponible"
        : "";
  return {
    title: w.recipientName,
    amount: w.amount,
    meta: `${networkLabels[w.network] ?? w.network} · ${w.maskedMsisdn}${extra}`,
    status: status.label,
    tone: status.tone,
  };
}

export function WithdrawalsPanel({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const withdrawals = useWithdrawals(page);
  const cancel = useCancelWithdrawal();
  const [toCancel, setToCancel] = useState<Withdrawal | null>(null);

  if (withdrawals.isError)
    return (
      <BlockError
        error={withdrawals.error}
        retry={() => void withdrawals.refetch()}
      />
    );
  const data = withdrawals.data;
  const groups = data
    ? groupByDay(
        data.content.map((w) => ({ ...w, createdAt: w.requestedAt })),
      ).map((g) => ({
        key: g.day,
        label: dayLabel(g.day),
        items: g.items as Withdrawal[],
      }))
    : [];
  const pending = data?.content.filter((w) => w.status === "PENDING_APPROVAL");

  return (
    <div className="flex flex-col gap-4">
      <RowCardList
        label="Retraits"
        loading={withdrawals.isPending}
        groups={groups}
        getKey={(w) => w.id}
        toRow={toWithdrawalRow}
        empty={
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Aucun retrait</EmptyTitle>
              <EmptyDescription>
                Vos retraits et leur avancement apparaîtront ici.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
      {pending?.length ? (
        <ul className="flex flex-col gap-2" aria-label="Retraits à annuler">
          {pending.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-sm"
            >
              <span>
                Retrait de <Amount value={w.amount} /> en attente d’accord.
              </span>
              <Button
                variant="outline"
                className="h-11 sm:h-8"
                onClick={() => setToCancel(w)}
              >
                Annuler ce retrait
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {data ? (
        <Pager
          page={page}
          totalPages={data.totalPages}
          busy={withdrawals.isFetching}
          onChange={onPage}
        />
      ) : null}
      <AlertDialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && !cancel.isPending && setToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce retrait ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel
                ? `${toCancel.amount.toLocaleString("fr-FR")} FCFA redeviennent disponibles tout de suite.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancel.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {toUserMessage(cancel.error)}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>
              Garder le retrait
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!toCancel) return;
                cancel.mutate(toCancel.id, {
                  onSuccess: () => setToCancel(null),
                });
              }}
            >
              {cancel.isPending ? "Annulation…" : "Annuler le retrait"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
