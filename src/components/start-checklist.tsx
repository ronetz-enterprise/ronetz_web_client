import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChecklistStep = {
  label: string;
  /** Une phrase qui dit ce qu'il faut faire. Affichée seulement sur l'étape en cours. */
  hint?: string;
  done?: boolean;
  /** Adresse de l'étape en cours : fait apparaître le bouton « Continuer ». */
  href?: string;
};

/**
 * Liste de démarrage : les étapes pour vendre un premier accès, toutes visibles. Une seule est
 * en avant (la prochaine), le reste reste discret. Elle disparaît quand tout est fait.
 */
export function StartChecklist({
  title,
  steps,
  action,
}: {
  title: string;
  steps: ChecklistStep[];
  action?: React.ReactNode;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  if (doneCount === steps.length) return null;
  return (
    <section aria-labelledby="start-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="start-title" className="text-base font-semibold">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            {doneCount} sur {steps.length}
          </p>
          {action}
        </div>
      </div>
      <ol className="flex flex-col divide-y divide-border border-y border-border">
        {steps.map((step, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3",
                isCurrent ? "min-h-20 py-4" : "min-h-12 py-2",
              )}
            >
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center text-sm tabular-nums"
              >
                {step.done ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    className="size-5 text-signal"
                  />
                ) : (
                  <span
                    className={cn(
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    step.done && "text-muted-foreground",
                    isCurrent && "font-medium",
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {step.done
                      ? " : fait"
                      : isCurrent
                        ? " : à faire maintenant"
                        : " : à venir"}
                  </span>
                </p>
                {isCurrent && step.hint ? (
                  <p className="text-sm text-muted-foreground">{step.hint}</p>
                ) : null}
              </div>
              {isCurrent && step.href ? (
                <Button render={<Link href={step.href} />} nativeButton={false}>
                  Continuer
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    data-icon="inline-end"
                  />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
