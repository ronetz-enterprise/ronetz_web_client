import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { Amount } from "@/components/amount";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Accueil" };

// Données d'exemple : elles viendront de l'API.
const todo = [
  {
    text: "Le routeur Terrasse ne répond plus depuis 14 h 05.",
    cta: "Voir le routeur",
    href: routes.routers(),
  },
  {
    text: "3 accès expirent ce soir : vos clients devront en racheter un.",
    cta: "Voir les accès",
    href: routes.access(),
  },
] as const;

/** Recettes cumulées de la journée, heure par heure, jusqu'à maintenant (14 h). */
const dayCurve = [
  0, 0, 0, 0, 0, 0, 500, 1500, 3000, 4800, 7200, 9500, 11000, 12000, 12500,
];

/** Courbe en SVG : pleine jusqu'à maintenant, en pointillés pour la fin de journée. */
function DayChart({
  values,
  hours = 24,
}: {
  values: number[];
  hours?: number;
}) {
  const w = 640;
  const h = 150;
  const max = Math.max(...values) * 1.1;
  const x = (i: number) => (i / hours) * w;
  const y = (v: number) => h - 10 - (v / max) * (h - 30);
  const solid = values
    .map(
      (v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
    )
    .join(" ");
  const last = values.length - 1;
  return (
    <svg
      viewBox={`0 0 ${w} ${h + 22}`}
      className="w-full"
      role="img"
      aria-label="Recettes cumulées de la journée : 12 500 FCFA à 14 h"
    >
      <line
        x1="0"
        x2={w}
        y1={h - 10}
        y2={h - 10}
        className="stroke-border"
        strokeWidth="1"
      />
      <path
        d={solid}
        fill="none"
        className="stroke-signal"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={x(last)}
        x2={w}
        y1={y(values[last])}
        y2={y(values[last])}
        className="stroke-signal"
        strokeWidth="2"
        strokeDasharray="4 5"
        opacity="0.6"
      />
      <circle
        cx={x(last)}
        cy={y(values[last])}
        r="4.5"
        className="fill-signal"
      />
      <text x="0" y={h + 14} className="fill-muted-foreground text-[11px]">
        00:00
      </text>
      <text
        x={w}
        y={h + 14}
        textAnchor="end"
        className="fill-muted-foreground text-[11px]"
      >
        24:00
      </text>
    </svg>
  );
}

function MiniLine({ values }: { values: number[] }) {
  const w = 240;
  const h = 56;
  const max = Math.max(...values) * 1.15;
  const d = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - 4 - (v / max) * (h - 12)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
      <path
        d={d}
        fill="none"
        className="stroke-signal"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <Button variant="outline" size="sm" className="font-normal">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-signal">{value}</span>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        strokeWidth={2}
        className="size-3 text-muted-foreground"
      />
    </Button>
  );
}

function Metric({
  title,
  value,
  previous,
  children,
}: {
  title: string;
  value: React.ReactNode;
  previous: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-sm text-muted-foreground tabular-nums">{previous}</p>
      <div className="mt-3 min-h-16">{children}</div>
    </div>
  );
}

/** Accueil du gérant : ce qui s'est passé aujourd'hui, ce qui demande une action, l'activité de la semaine. */
export default function AccueilPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section aria-labelledby="today" className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <h1 id="today" className="text-3xl font-bold tracking-tight">
            Aujourd’hui
          </h1>
          <Button variant="outline" render={<Link href="/gabarits/finances" />}>
            Retirer mes recettes
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <dl className="flex flex-wrap gap-x-12 gap-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Recettes du jour
                </dt>
                <dd className="text-2xl font-semibold tracking-tight tabular-nums">
                  <Amount value={12500} />
                </dd>
                <dd className="text-xs text-muted-foreground">à 14 h</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Hier</dt>
                <dd className="text-2xl font-normal tracking-tight text-muted-foreground tabular-nums">
                  <Amount value={9800} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Disponible au retrait
                </dt>
                <dd className="text-2xl font-normal tracking-tight tabular-nums">
                  <Amount value={48000} />
                </dd>
              </div>
            </dl>
            <DayChart values={dayCurve} />
          </div>

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
                aria-label="Masquer cette liste"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
              </Button>
            </div>
            <ul className="flex flex-col gap-4">
              {todo.map((t) => (
                <li key={t.href} className="flex flex-col gap-1">
                  <p className="text-sm">{t.text}</p>
                  <Link
                    href={t.href}
                    className="w-fit text-sm font-medium text-signal underline-offset-4 hover:underline"
                  >
                    {t.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section aria-labelledby="activity" className="flex flex-col gap-4">
        <h2 id="activity" className="text-2xl font-semibold tracking-tight">
          Votre activité
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Pill label="Période" value="7 derniers jours" />
          <Pill label="Affichage" value="Par jour" />
          <Pill label="Comparer à" value="la semaine d’avant" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            title="Accès vendus"
            value="142"
            previous="118 la semaine d’avant"
          >
            <MiniLine values={[14, 18, 22, 17, 25, 21, 25]} />
          </Metric>
          <Metric
            title="Recettes"
            value={<Amount value={71400} />}
            previous="59 800 FCFA la semaine d’avant"
          >
            <MiniLine values={[7000, 9200, 11000, 8400, 12800, 9800, 12500]} />
          </Metric>
          <Metric
            title="Nouveaux clients"
            value="0"
            previous="0 la semaine d’avant"
          >
            <div className="grid h-16 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Aucune donnée
            </div>
          </Metric>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={1.8}
            className="size-5 shrink-0 text-muted-foreground"
          />
          <p className="flex-1">
            Vos clients peuvent aussi payer au comptoir : créez un accès en
            trois gestes depuis « Vendre un accès ».
          </p>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Masquer ce message"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
          </Button>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">Données d’exemple.</p>
    </div>
  );
}
