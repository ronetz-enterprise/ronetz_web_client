"use client";

import * as React from "react";

import { Amount } from "@/components/amount";
import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type RowCardGroup,
} from "@/components/patterns/row-card-list";
import { StateDot } from "@/components/patterns/row-card";
import { SplitView, useSelectedParam } from "@/components/patterns/split-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  SAMPLE_ACCESSES,
  STATUS_LABEL,
  STATUS_TONE,
  formatLeft,
  type Access,
  type AccessStatus,
} from "./sample-data";

const PAGE_SIZE = 8;

const CHIPS: { value: string; label: string; status?: AccessStatus }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs", status: "active" },
  { value: "expiring", label: "Expire bientôt", status: "expiring" },
  { value: "expired", label: "Expirés", status: "expired" },
  { value: "suspended", label: "Suspendus", status: "suspended" },
];

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function AccessDemo() {
  const [accesses, setAccesses] = React.useState(SAMPLE_ACCESSES);
  const [selectedId, setSelectedId] = useSelectedParam("acces");
  const [search, setSearch] = React.useState("");
  const [chip, setChip] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [view, setView] = React.useState<"list" | "loading" | "empty">("list");

  const status = CHIPS.find((c) => c.value === chip)?.status;
  const filtered = accesses.filter(
    (x) =>
      (!status || x.status === status) &&
      (!search ||
        normalize(`${x.code} ${x.offer} ${x.site}`).includes(
          normalize(search),
        )),
  );
  const source = view === "empty" ? [] : filtered;
  const pages = Math.max(1, Math.ceil(source.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageItems = source.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  const groups: RowCardGroup<Access>[] = [];
  for (const x of pageItems) {
    let g = groups.find((y) => y.label === x.day);
    if (!g) {
      g = { key: x.day, label: x.day, items: [] };
      groups.push(g);
    }
    g.items.push(x);
  }
  for (const g of groups) {
    // Total du jour sur toute la liste filtrée, pas seulement la page.
    const sum = source
      .filter((x) => x.day === g.label)
      .reduce((n, x) => n + x.price, 0);
    g.total = <Amount value={sum} />;
  }

  const selected = accesses.find((x) => x.id === selectedId) ?? null;
  const close = React.useCallback(() => setSelectedId(null), [setSelectedId]);

  function update(id: string, next: AccessStatus) {
    setAccesses((all) =>
      all.map((x) =>
        x.id === id
          ? {
              ...x,
              status: next,
              minutesLeft: next === "cancelled" ? 0 : x.minutesLeft,
            }
          : x,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Accès</h1>
          <Badge variant="secondary">Données d&apos;exemple</Badge>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          Démonstration des gabarits « carte-ligne » et « liste + panneau ». Les
          codes, sites et prix ci-dessous sont inventés.
        </p>
        <div
          className="flex flex-wrap gap-2 pt-1"
          aria-label="Simuler un état de la liste"
        >
          {(["list", "loading", "empty"] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === "list" ? "Liste" : v === "loading" ? "Chargement" : "Vide"}
            </Button>
          ))}
        </div>
      </header>

      <SplitView
        open={selected !== null}
        onClose={close}
        detailLabel="Détail de l'accès"
        list={
          <div className="flex flex-col gap-4">
            <RowCardToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchLabel="Rechercher un code, une offre ou un site"
              chips={CHIPS.map((c) => ({
                value: c.value,
                label: c.label,
                count: c.status
                  ? accesses.filter((x) => x.status === c.status).length
                  : accesses.length,
              }))}
              chip={chip}
              onChipChange={(v) => {
                setChip(v);
                setPage(1);
              }}
            />
            <RowCardList
              label="Liste des accès"
              loading={view === "loading"}
              groups={groups}
              getKey={(x) => x.id}
              selectedKey={selectedId}
              onSelect={(x) => setSelectedId(x.id)}
              toRow={(x) => ({
                title: <span className="font-mono">{x.code}</span>,
                amount: x.price,
                meta: `${x.offer} · ${formatLeft(x.minutesLeft)} · ${x.site}`,
                status: STATUS_LABEL[x.status],
                tone: STATUS_TONE[x.status],
              })}
              empty={
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyTitle>Aucun accès trouvé</EmptyTitle>
                    <EmptyDescription>
                      Essayez un autre filtre, ou vendez votre premier accès
                      pour le voir apparaître ici.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              }
            />
            {view !== "loading" ? (
              <RowCardPagination
                page={current}
                pageSize={PAGE_SIZE}
                total={source.length}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        }
        detail={
          selected ? (
            <AccessDetail
              key={selected.id}
              access={selected}
              onChange={(s) => update(selected.id, s)}
            />
          ) : null
        }
      />
    </div>
  );
}

function AccessDetail({
  access,
  onChange,
}: {
  access: Access;
  onChange: (s: AccessStatus) => void;
}) {
  const [confirm, setConfirm] = React.useState<"suspend" | "cancel" | null>(
    null,
  );
  const live = access.status === "active" || access.status === "expiring";
  const canCancel = live || access.status === "suspended";

  const rows: [string, React.ReactNode][] = [
    ["Offre", access.offer],
    ["Site", access.site],
    ["Temps restant", formatLeft(access.minutesLeft)],
    ["Prix payé", <Amount key="p" value={access.price} />],
    ["Vendu", access.day],
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-mono text-xl font-semibold">{access.code}</h2>
        <div>
          <StateDot
            label={STATUS_LABEL[access.status]}
            tone={STATUS_TONE[access.status]}
          />
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-border text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-4 py-2.5"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {confirm ? (
        <div
          role="alertdialog"
          aria-labelledby="confirm-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setConfirm(null);
            }
          }}
          className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4"
        >
          <p id="confirm-title" className="text-sm font-medium">
            {confirm === "suspend"
              ? `Suspendre l'accès ${access.code} ?`
              : `Annuler l'accès ${access.code} ?`}
          </p>
          <p className="text-sm text-muted-foreground">
            {confirm === "suspend"
              ? "Le client est déconnecté tout de suite. Vous pourrez réactiver l'accès plus tard."
              : "Le client est déconnecté et l'accès ne peut plus être utilisé. Cette action ne peut pas être défaite."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              autoFocus
              variant={confirm === "cancel" ? "destructive" : "default"}
              className="h-11 sm:h-9"
              onClick={() => {
                onChange(confirm === "suspend" ? "suspended" : "cancelled");
                setConfirm(null);
              }}
            >
              {confirm === "suspend"
                ? "Oui, suspendre"
                : "Oui, annuler l'accès"}
            </Button>
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              onClick={(e) => {
                e.stopPropagation();
                setConfirm(null);
              }}
            >
              Non, garder
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {access.status === "suspended" ? (
            <Button className="h-11 sm:h-9" onClick={() => onChange("active")}>
              Réactiver
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              disabled={!live}
              onClick={() => setConfirm("suspend")}
            >
              Suspendre
            </Button>
          )}
          <Button
            variant="destructive"
            className="h-11 sm:h-9"
            disabled={!canCancel}
            onClick={() => setConfirm("cancel")}
          >
            Annuler
          </Button>
        </div>
      )}
    </>
  );
}
