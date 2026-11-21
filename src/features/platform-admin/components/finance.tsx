"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Amount } from "@/components/amount";
import { PageHeader } from "@/components/page-header";
import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type RowCardGroup,
} from "@/components/patterns/row-card-list";
import { SplitView, useSelectedParam } from "@/components/patterns/split-view";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import {
  usePaymentAnomalies,
  usePlatformWithdrawals,
  useAnomalyAction,
  WITHDRAWAL_PAGE_SIZE,
} from "../api/platform";
import {
  anomalyCodeLabels,
  anomalyStatusLabels,
  anomalyStatusTones,
  currencyLabel,
  label,
  networkLabels,
  platformCapabilities,
  withdrawalStatusLabels,
  withdrawalStatusOptions,
  withdrawalStatusTones,
  WITHDRAWAL_DECISIONS_ENABLED,
  type AnomalyAction,
  type PaymentAnomaly,
  type PlatformSession,
  type PlatformWithdrawal,
} from "../model/platform";
import { DecisionPanel } from "./decision-panel";
import { useOrganizationNames } from "./filters";
import { Facts, InlineError, NoPermission, ToneBadge } from "./parts";
import { readChoice, readPage, useUrlState } from "./use-url-state";

const STATUS_CHIPS = withdrawalStatusOptions.map((value) => ({
  value,
  label: withdrawalStatusLabels[value],
}));

function WithdrawalPanel({
  withdrawal,
  organization,
}: {
  withdrawal: PlatformWithdrawal;
  organization: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          <Amount
            value={withdrawal.amount}
            currency={currencyLabel(withdrawal.currency)}
          />
        </h2>
        <div>
          <ToneBadge
            tone={withdrawalStatusTones[withdrawal.status] ?? "neutral"}
          >
            {label(withdrawalStatusLabels, withdrawal.status)}
          </ToneBadge>
        </div>
      </div>
      <Facts
        rows={[
          ["Organisation", organization],
          ["Bénéficiaire", withdrawal.recipientName],
          [
            "Numéro",
            `${label(networkLabels, withdrawal.network)} · ${withdrawal.maskedMsisdn}`,
          ],
          ["Demandé le", formatDateTime(withdrawal.requestedAt)],
          ...(withdrawal.decidedAt
            ? ([["Décidé le", formatDateTime(withdrawal.decidedAt)]] as [
                string,
                string,
              ][])
            : []),
          ...(withdrawal.completedAt
            ? ([["Effectué le", formatDateTime(withdrawal.completedAt)]] as [
                string,
                string,
              ][])
            : []),
        ]}
      />
      {withdrawal.decisionReason ? (
        <p className="text-sm text-muted-foreground">
          Motif : {withdrawal.decisionReason}
        </p>
      ) : null}
      {withdrawal.failureReason ? (
        <p className="rounded-md border border-danger-border bg-danger p-3 text-sm text-danger-foreground">
          {withdrawal.failureReason}
        </p>
      ) : null}
      {withdrawal.status === "PENDING_APPROVAL" &&
      !WITHDRAWAL_DECISIONS_ENABLED ? (
        <p
          role="note"
          className="rounded-md border border-border bg-muted p-3 text-sm"
        >
          Les retraits seront bientôt disponibles. Cette demande reste en
          attente : aucune décision ne peut encore être prise ici.
        </p>
      ) : null}
    </div>
  );
}

function Withdrawals({ session }: { session: PlatformSession }) {
  const { params, update } = useUrlState();
  const [selected, select] = useSelectedParam("retrait");
  const { names } = useOrganizationNames(session);
  const status = readChoice(
    params.get("statut"),
    withdrawalStatusOptions,
    "PENDING_APPROVAL",
  );
  const page = readPage(params.get("page"));
  const query = usePlatformWithdrawals(session, status, page);
  const current = query.data?.content.find((w) => w.id === selected) ?? null;
  const groups: RowCardGroup<PlatformWithdrawal>[] = query.data
    ? [{ key: "retraits", label: "Retraits", items: query.data.content }]
    : [];
  return (
    <SplitView
      open={current !== null}
      onClose={() => select(null)}
      detailLabel="Détail du retrait"
      list={
        <div className="flex flex-col gap-4">
          <RowCardToolbar
            search=""
            onSearchChange={() => {}}
            searchLabel=""
            chips={STATUS_CHIPS}
            chip={status}
            onChipChange={(value) =>
              update({
                statut: value === "PENDING_APPROVAL" ? null : value,
                retrait: null,
              })
            }
            className="[&>div:first-child]:hidden"
          />
          {query.isError ? (
            <InlineError
              error={query.error}
              retry={() => void query.refetch()}
              title="Les retraits n'ont pas pu être chargés"
            />
          ) : (
            <>
              <RowCardList
                label="Retraits"
                groups={groups}
                loading={query.isPending}
                getKey={(w) => w.id}
                selectedKey={selected}
                onSelect={(w) => select(w.id)}
                toRow={(w) => ({
                  title: w.recipientName,
                  amount: w.amount,
                  meta: `${names.get(w.organizationId) ?? "Organisation"} · demandé ${formatRelative(w.requestedAt)}`,
                  status: label(withdrawalStatusLabels, w.status),
                  tone: withdrawalStatusTones[w.status] ?? "neutral",
                })}
                empty={
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyTitle>
                        {status === "PENDING_APPROVAL"
                          ? "Aucun retrait à décider"
                          : "Aucun retrait dans cet état"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {status === "PENDING_APPROVAL"
                          ? "Les demandes des organisations apparaîtront ici."
                          : "Choisissez un autre état pour consulter l'historique."}
                      </EmptyDescription>
                    </EmptyHeader>
                    {status !== "PENDING_APPROVAL" ? (
                      <Button
                        variant="outline"
                        className="h-11 md:h-9"
                        onClick={() => update({ statut: null })}
                      >
                        Voir les retraits à décider
                      </Button>
                    ) : null}
                  </Empty>
                }
              />
              {query.data ? (
                <RowCardPagination
                  page={page + 1}
                  pageSize={WITHDRAWAL_PAGE_SIZE}
                  total={query.data.totalElements}
                  onPageChange={(next) =>
                    update(
                      { page: next > 1 ? String(next - 1) : null },
                      { keepPage: true },
                    )
                  }
                />
              ) : null}
            </>
          )}
        </div>
      }
      detail={
        current ? (
          <WithdrawalPanel
            withdrawal={current}
            organization={names.get(current.organizationId) ?? "Organisation"}
          />
        ) : null
      }
    />
  );
}

function anomalyTitle(anomaly: PaymentAnomaly) {
  return label(anomalyCodeLabels, anomaly.code);
}

const ANOMALY_COPY: Record<
  AnomalyAction,
  { title: string; submit: string; consequences: string[] }
> = {
  review: {
    title: "Prendre en charge ce paiement",
    submit: "Prendre en charge",
    consequences: [
      "L'anomalie passe à « Prise en charge » : l'équipe sait que quelqu'un s'en occupe.",
      "Le motif est inscrit au journal.",
    ],
  },
  resolve: {
    title: "Marquer ce paiement comme résolu",
    submit: "Marquer comme résolu",
    consequences: [
      "L'anomalie sort de la liste à traiter.",
      "Le motif explique ce qui a été vérifié ; il est inscrit au journal.",
    ],
  },
};

function AnomalyPanel({
  session,
  anomaly,
}: {
  session: PlatformSession;
  anomaly: PaymentAnomaly;
}) {
  const canAct = platformCapabilities(session).canReconcilePayments;
  const mutation = useAnomalyAction();
  const [pending, setPending] = useState<AnomalyAction | null>(null);
  const steps: [string, string | null][] = [
    ["Détectée", anomaly.occurredAt],
    ["Prise en charge", anomaly.reviewedAt],
    ["Résolue", anomaly.resolvedAt],
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{anomalyTitle(anomaly)}</h2>
        <div>
          <ToneBadge tone={anomalyStatusTones[anomaly.status] ?? "neutral"}>
            {label(anomalyStatusLabels, anomaly.status)}
          </ToneBadge>
        </div>
      </div>
      <ol aria-label="Avancement" className="flex flex-col gap-2 text-sm">
        {steps.map(([name, at]) => (
          <li key={name} className="flex items-baseline justify-between gap-3">
            <span className={at ? "font-medium" : "text-muted-foreground"}>
              {name}
            </span>
            <span className="text-muted-foreground">
              {at ? formatDateTime(at) : "À venir"}
            </span>
          </li>
        ))}
      </ol>
      {anomaly.resolution ? (
        <p className="text-sm text-muted-foreground">
          Résolution : {anomaly.resolution}
        </p>
      ) : null}
      {pending ? (
        <DecisionPanel
          title={ANOMALY_COPY[pending].title}
          consequences={ANOMALY_COPY[pending].consequences}
          submitLabel={ANOMALY_COPY[pending].submit}
          busy={mutation.isPending}
          error={mutation.error}
          onCancel={() => {
            mutation.reset();
            setPending(null);
          }}
          onSubmit={(reason) =>
            mutation.mutate(
              { eventId: anomaly.eventId, action: pending, reason },
              {
                onSuccess: () => {
                  toast.success(
                    pending === "review"
                      ? "Paiement pris en charge."
                      : "Paiement marqué comme résolu.",
                  );
                  setPending(null);
                },
              },
            )
          }
        />
      ) : canAct && anomaly.status !== "RESOLVED" ? (
        <div className="flex flex-wrap gap-2">
          {!anomaly.reviewedAt ? (
            <Button
              variant="outline"
              className="h-11 md:h-9"
              onClick={() => setPending("review")}
            >
              Prendre en charge
            </Button>
          ) : null}
          <Button className="h-11 md:h-9" onClick={() => setPending("resolve")}>
            Marquer comme résolu
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Anomalies({ session }: { session: PlatformSession }) {
  const [selected, select] = useSelectedParam("anomalie");
  const query = usePaymentAnomalies(session);
  const current = query.data?.find((a) => a.eventId === selected) ?? null;
  const groups: RowCardGroup<PaymentAnomaly>[] = query.data
    ? [{ key: "anomalies", label: "Paiements à vérifier", items: query.data }]
    : [];
  return (
    <SplitView
      open={current !== null}
      onClose={() => select(null)}
      detailLabel="Détail du paiement à vérifier"
      list={
        query.isError ? (
          <InlineError
            error={query.error}
            retry={() => void query.refetch()}
            title="La liste n'a pas pu être chargée"
          />
        ) : (
          <RowCardList
            label="Paiements à vérifier"
            groups={groups}
            loading={query.isPending}
            getKey={(a) => a.eventId}
            selectedKey={selected}
            onSelect={(a) => select(a.eventId)}
            toRow={(a) => ({
              title: anomalyTitle(a),
              meta: `Détectée le ${formatDate(a.occurredAt)}`,
              status: label(anomalyStatusLabels, a.status),
              tone: anomalyStatusTones[a.status] ?? "neutral",
            })}
            empty={
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>Aucun paiement à vérifier</EmptyTitle>
                  <EmptyDescription>
                    Les paiements sont cohérents avec l'opérateur.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        )
      }
      detail={
        current ? <AnomalyPanel session={session} anomaly={current} /> : null
      }
    />
  );
}

export function FinancePage({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const { params, update } = useUrlState();
  const tab = params.get("onglet") === "anomalies" ? "anomalies" : "retraits";
  if (!capabilities.canViewPlatform)
    return (
      <>
        <PageHeader title="Finances" />
        <NoPermission area="Les finances" />
      </>
    );
  return (
    <>
      <PageHeader
        title="Finances"
        description="Les retraits demandés par les organisations et les paiements à vérifier."
      />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          update({
            onglet: value === "anomalies" ? "anomalies" : null,
            statut: null,
            page: null,
            retrait: null,
            anomalie: null,
          })
        }
        className="mb-4"
      >
        <TabsList variant="line" aria-label="Rubrique">
          <TabsTrigger value="retraits" className="h-11 md:h-9">
            Retraits
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="h-11 md:h-9">
            Paiements à vérifier
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "retraits" ? (
        <Withdrawals session={session} />
      ) : (
        <Anomalies session={session} />
      )}
    </>
  );
}
