import type { ReactNode } from "react";
import { QueryClientWrapper } from "@/features/purchase/components/query-client-wrapper";
import { PurchaseHeader } from "@/features/purchase/components/purchase-header";

export default async function ConnectLayout({
  children,
  params,
}: {
  children: ReactNode;
  // Next.js 15 génère params comme Promise<unknown> ; on caste après await.
  params: Promise<unknown>;
}) {
  const { siteId } = (await params) as { siteId: string };
  return (
    <QueryClientWrapper>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <a
          href="#purchase-content"
          className="sr-only focus:not-sr-only focus:p-4"
        >
          Aller aux offres
        </a>
        <PurchaseHeader siteId={siteId} />
        <main
          id="purchase-content"
          className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8"
        >
          {children}
        </main>
        <footer className="space-y-1 px-4 py-6 text-center text-xs text-muted-foreground">
          <p>
            Un souci de paiement ou de connexion ? Adressez-vous au responsable
            du point Wi-Fi.
          </p>
          <p>
            Propulsé par{" "}
            <span className="font-semibold text-foreground/80">ronetz</span>
          </p>
        </footer>
      </div>
    </QueryClientWrapper>
  );
}
