"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime } from "@/lib/format";
import { usePlatformAudit } from "../api/platform";
import {
  auditActionLabels,
  auditActorLabels,
  auditActorOptions,
  auditResultLabels,
  auditResultTones,
  auditSeverityLabels,
  auditSeverityOptions,
  auditSourceLabels,
  auditSourceOptions,
  label,
  platformCapabilities,
  type AuditEntry,
  type PlatformSession,
} from "../model/platform";
import {
  FilterSelect,
  OrganizationFilter,
  useOrganizationNames,
} from "./filters";
import { Facts, Hint, InlineError, NoPermission, ToneBadge } from "./parts";
import { readChoice, readPage, useUrlState } from "./use-url-state";
import { useId } from "react";

const PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESULT_CHIPS = [
  { value: "ALL", label: "Tous" },
  { value: "SUCCESS", label: "Réussis" },
  { value: "FAILURE", label: "Échoués" },
  { value: "DENIED", label: "Refusés" },
];

/** Début ou fin de journée en UTC : le backend lit des instants. */
export function dayBoundary(day: string, end: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const date = new Date(`${day}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function DayField({
  label: text,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {text}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        className="h-11 md:h-9"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function EntryPanel({
  entry,
  organization,
}: {
  entry: AuditEntry;
  organization: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          <Hint term={`Code : ${entry.action}`}>
            {label(auditActionLabels, entry.action)}
          </Hint>
        </h2>
        <div>
          <ToneBadge tone={auditResultTones[entry.result] ?? "neutral"}>
            {label(auditResultLabels, entry.result)}
          </ToneBadge>
        </div>
      </div>
      <Facts
        rows={[
          ["Quand", formatDateTime(entry.occurredAt)],
          [
            "Par",
            `${label(auditActorLabels, entry.actor.type)}${entry.actor.displayNameSnapshot ? ` · ${entry.actor.displayNameSnapshot}` : ""}`,
          ],
          ["Domaine", label(auditSourceLabels, entry.source)],
          ["Gravité", label(auditSeverityLabels, entry.severity)],
          ...(organization
            ? ([["Organisation", organization]] as [string, string][])
            : []),
          ...(entry.target.displayNameSnapshot
            ? ([["Concerné", entry.target.displayNameSnapshot]] as [
                string,
                string,
              ][])
            : []),
        ]}
      />
      {entry.reason ? (
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-medium">Motif</p>
          <p className="text-muted-foreground">{entry.reason}</p>
        </div>
      ) : null}
      {entry.correlationId ? (
        <p className="text-xs text-muted-foreground">
          Référence pour l'équipe technique :{" "}
          <code className="break-all select-all">{entry.correlationId}</code>
        </p>
      ) : null}
    </div>
  );
}

export function AuditPage({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const { params, update } = useUrlState();
  const [selected, select] = useSelectedParam("evenement");
  const { names } = useOrganizationNames(session);

  const page = readPage(params.get("page"));
  const orgParam = params.get("organisation");
  const organizationId = orgParam && UUID.test(orgParam) ? orgParam : null;
  const actorType = readChoice(
    params.get("auteur"),
    ["ALL", ...auditActorOptions],
    "ALL",
  );
  const result = readChoice(
    params.get("resultat"),
    RESULT_CHIPS.map((c) => c.value),
    "ALL",
  );
  const severity = readChoice(
    params.get("gravite"),
    ["ALL", ...auditSeverityOptions],
    "ALL",
  );
  const source = readChoice(
    params.get("domaine"),
    ["ALL", ...auditSourceOptions],
    "ALL",
  );
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.get("du") ?? "")
    ? (params.get("du") as string)
    : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.get("au") ?? "")
    ? (params.get("au") as string)
    : "";

  const entries = usePlatformAudit(
    session,
    {
      organizationId,
      actorType,
      result,
      severity,
      source,
      from: dayBoundary(from, false),
      to: dayBoundary(to, true),
    },
    page,
    PAGE_SIZE,
  );

  if (!capabilities.canReadAudit)
    return (
      <>
        <PageHeader title="Audit" />
        <NoPermission area="Le journal d'audit" />
      </>
    );

  const filtering =
    organizationId !== null ||
    actorType !== "ALL" ||
    result !== "ALL" ||
    severity !== "ALL" ||
    source !== "ALL" ||
    from !== "" ||
    to !== "";

  const groups: RowCardGroup<AuditEntry>[] = [];
  for (const entry of entries.data?.content ?? []) {
    const day = formatDate(entry.occurredAt);
    let group = groups.find((g) => g.key === day);
    if (!group) {
      group = { key: day, label: day, items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }
  const current = entries.data?.content.find((e) => e.id === selected) ?? null;

  return (
    <>
      <PageHeader
        title="Audit"
        description="Le journal des actions de la plateforme, du plus récent au plus ancien. On ne peut ni le modifier ni en effacer une ligne."
      />
      <SplitView
        open={current !== null}
        onClose={() => select(null)}
        detailLabel="Détail de l'événement"
        list={
          <div className="flex flex-col gap-4">
            <RowCardToolbar
              search=""
              onSearchChange={() => {}}
              searchLabel=""
              chips={RESULT_CHIPS}
              chip={result}
              onChipChange={(value) =>
                update({ resultat: value === "ALL" ? null : value })
              }
              className="[&>div:first-child]:hidden"
            />
            <div className="flex flex-wrap gap-3">
              <OrganizationFilter
                session={session}
                value={organizationId}
                onChange={(id) => update({ organisation: id })}
              />
              <FilterSelect
                label="Fait par"
                value={actorType}
                options={[
                  { value: "ALL", label: "Tout le monde" },
                  ...auditActorOptions.map((v) => ({
                    value: v,
                    label: auditActorLabels[v],
                  })),
                ]}
                onChange={(value) =>
                  update({ auteur: value === "ALL" ? null : value })
                }
              />
              <FilterSelect
                label="Domaine"
                value={source}
                options={[
                  { value: "ALL", label: "Tous les domaines" },
                  ...auditSourceOptions.map((v) => ({
                    value: v,
                    label: auditSourceLabels[v],
                  })),
                ]}
                onChange={(value) =>
                  update({ domaine: value === "ALL" ? null : value })
                }
              />
              <FilterSelect
                label="Gravité"
                value={severity}
                options={[
                  { value: "ALL", label: "Toutes" },
                  ...auditSeverityOptions.map((v) => ({
                    value: v,
                    label: auditSeverityLabels[v],
                  })),
                ]}
                onChange={(value) =>
                  update({ gravite: value === "ALL" ? null : value })
                }
              />
              <DayField
                label="Du"
                value={from}
                onChange={(value) => update({ du: value || null })}
              />
              <DayField
                label="Au"
                value={to}
                onChange={(value) => update({ au: value || null })}
              />
            </div>
            {entries.isError ? (
              <InlineError
                error={entries.error}
                retry={() => void entries.refetch()}
                title="Le journal n'a pas pu être chargé"
              />
            ) : (
              <>
                <RowCardList
                  label="Événements"
                  groups={groups}
                  loading={entries.isPending}
                  getKey={(e) => e.id}
                  selectedKey={selected}
                  onSelect={(e) => select(e.id)}
                  toRow={(e) => ({
                    title: label(auditActionLabels, e.action),
                    meta: `${label(auditActorLabels, e.actor.type)}${e.actor.displayNameSnapshot ? ` · ${e.actor.displayNameSnapshot}` : ""} · ${label(auditSourceLabels, e.source)}`,
                    status: label(auditResultLabels, e.result),
                    tone: auditResultTones[e.result] ?? "neutral",
                  })}
                  empty={
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyTitle>Aucun événement</EmptyTitle>
                        <EmptyDescription>
                          {filtering
                            ? "Aucun événement ne correspond à ces filtres."
                            : "Rien n'a encore été enregistré."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {filtering ? (
                        <Button
                          variant="outline"
                          className="h-11 md:h-9"
                          onClick={() =>
                            update({
                              organisation: null,
                              auteur: null,
                              resultat: null,
                              gravite: null,
                              domaine: null,
                              du: null,
                              au: null,
                            })
                          }
                        >
                          Effacer les filtres
                        </Button>
                      ) : null}
                    </Empty>
                  }
                />
                {entries.data ? (
                  <RowCardPagination
                    page={page + 1}
                    pageSize={PAGE_SIZE}
                    total={entries.data.totalElements}
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
            <EntryPanel
              entry={current}
              organization={
                current.organizationId
                  ? (names.get(current.organizationId) ?? null)
                  : null
              }
            />
          ) : null
        }
      />
    </>
  );
}
