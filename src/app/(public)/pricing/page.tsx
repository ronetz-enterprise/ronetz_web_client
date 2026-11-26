import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { routes } from "@/lib/routes";
import { PricingDetails } from "@/features/pricing";
import { statusActionClass } from "@/features/organization-settings/components/status-screen";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Ce que Ronetz prend sur vos ventes d’accès Wi-Fi, avec un exemple chiffré.",
};

/** Page publique « Tarifs » (fiche 011) : lisible sans compte, avant l'inscription. */
export default function PublicPricingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href={routes.home()} aria-label="Ronetz, accueil">
          <Logo />
        </Link>
        <Link
          href={routes.login()}
          className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Se connecter
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">
        <h1 className="pt-4 pb-2 text-3xl font-bold tracking-tight">Tarifs</h1>
        <p className="pb-6 text-muted-foreground">
          Vous ne payez que quand vous vendez.
        </p>
        <PricingDetails />
        <div className="pt-8">
          <Link href={routes.register()} className={statusActionClass}>
            Créer mon compte
          </Link>
        </div>
      </main>
    </div>
  );
}
