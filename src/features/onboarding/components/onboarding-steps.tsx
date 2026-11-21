"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";

const labels = ["Compte", "Organisation", "Prêt"];

/**
 * Progression en haut à droite : une barre fine et « Étape 2 sur 3 ». `current` est l'index (0 à 2)
 * de l'étape en cours.
 */
export function OnboardingProgress({ current }: { current: number }) {
  const total = labels.length;
  const step = Math.min(Math.max(current, 0), total - 1) + 1;
  return (
    <div
      role="progressbar"
      aria-label="Étapes de démarrage"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-valuetext={`Étape ${step} sur ${total} : ${labels[step - 1]}`}
      className="flex items-center"
    >
      <span
        aria-hidden
        className="h-1 w-32 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </span>
    </div>
  );
}

/** Déduit l'étape de l'adresse : l'organisation est la 2e étape, le résultat la 3e. */
export function OnboardingProgressByRoute() {
  const pathname = usePathname();
  if (pathname === routes.onboardingOrg())
    return <OnboardingProgress current={1} />;
  if (pathname === routes.onboardingStatus())
    return <OnboardingProgress current={2} />;
  return null;
}
