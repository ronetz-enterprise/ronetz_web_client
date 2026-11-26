import Link from "next/link";
import { Logo } from "@/components/logo";
import { routes } from "@/lib/routes";
import { PriceLine } from "@/features/pricing";
import {
  statusActionClass,
  statusSecondaryClass,
} from "@/features/organization-settings/components/status-screen";

/** Accueil public : la marque, une promesse, deux actions. Rien de plus que ce que le produit tient. */
export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-5">
          <Link
            href={routes.pricing()}
            className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Tarifs
          </Link>
          <Link
            href={routes.login()}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Se connecter
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 pb-24">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Votre Wi-Fi, vos revenus, en clair.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Ronetz aide les gérants de Wi-Fi au Cameroun à suivre leurs ventes
            d’accès et leurs revenus, au même endroit.
          </p>
          <PriceLine className="text-sm text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={routes.register()} className={statusActionClass}>
            Créer mon compte
          </Link>
          <Link href={routes.login()} className={statusSecondaryClass}>
            Se connecter
          </Link>
        </div>
      </main>
    </div>
  );
}
