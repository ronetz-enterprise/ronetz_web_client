import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { OnboardingGate } from "@/features/onboarding/components/onboarding-gate";
import { OnboardingProgressByRoute } from "@/features/onboarding/components/onboarding-steps";

// Ces pages utilisent des hooks d'authentification qui requièrent
// une session côté client ; le pré-rendu statique n'a pas de sens.
export const dynamic = "force-dynamic";

/**
 * Démarrage, copie de la fenêtre d'accueil Stripe : un voile bleuté plein écran, une grande carte
 * blanche presque pleine page ; logo en haut à gauche, barre de progression fine en haut à droite,
 * la question au centre, et le pied (Retour à gauche, Passer / Continuer à droite) posé en bas.
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-overlay sm:p-6 lg:px-12 lg:py-12">
      <div className="flex min-h-svh flex-col bg-background shadow-[var(--shadow-float)] sm:min-h-[calc(100svh-3rem)] sm:rounded-xl lg:min-h-[calc(100svh-6rem)]">
        <header className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <Link href="/" aria-label="Ronetz, accueil">
            <Logo />
          </Link>
          <OnboardingProgressByRoute />
        </header>
        <main className="flex flex-1 flex-col">
          <OnboardingGate>{children}</OnboardingGate>
        </main>
      </div>
    </div>
  );
}
