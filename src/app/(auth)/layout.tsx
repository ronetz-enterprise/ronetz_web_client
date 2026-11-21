import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Connexion et inscription, copie de Stripe (captures 40 et 41) : le logo en haut à gauche, sans filet, un ruban décoratif en diagonale derrière (émeraude, seule couleur vive de la marque), une
 * carte blanche centrée, et un pied de page discret.
 */
export function AuthShell({
  children,
}: {
  /** Conservé pour compatibilité. */
  align?: "center" | "end";
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -right-1/4 hidden w-[90%] -skew-x-12 sm:block"
        style={{
          background:
            "linear-gradient(115deg, transparent 0%, var(--emerald-50) 20%, var(--emerald-200) 45%, var(--emerald-400) 62%, var(--emerald-600) 78%, var(--emerald-300) 90%, transparent 100%)",
          opacity: 0.55,
        }}
      />
      <header className="relative px-6 py-5 sm:px-10">
        <Link href="/" aria-label="Ronetz, accueil" className="inline-block">
          <Logo />
        </Link>
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:pt-12">
        {children}
      </main>
      <footer className="relative flex gap-4 px-6 pb-6 text-xs text-muted-foreground sm:px-10">
        <span>© Ronetz</span>
        <Link href="/" className="hover:underline">
          Confidentialité et conditions
        </Link>
      </footer>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
