"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { fetchPublicPricing } from "../api/pricing-api";
import { LAUNCH_OFFER, isPublishableRate, netFor } from "../model/pricing";

export function usePublicPricing() {
  return useQuery({
    queryKey: ["public-pricing"],
    queryFn: ({ signal }) => fetchPublicPricing(signal),
    staleTime: 10 * 60 * 1000,
  });
}

/** Une ligne de prix pour l'accueil et l'inscription. Rien tant que le taux n'est pas connu. */
export function PriceLine({ className }: { className?: string }) {
  const { data } = usePublicPricing();
  if (!data || !isPublishableRate(data.commissionRate)) return null;
  return (
    <p className={className}>
      Gratuit à l’inscription. Ronetz prend{" "}
      <strong className="font-semibold text-foreground">
        {formatPercent(data.commissionRate, 1)}
      </strong>{" "}
      sur chaque vente d’accès.
    </p>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-4 sm:flex-row sm:gap-6">
      <dt className="text-sm font-semibold sm:w-48 sm:shrink-0">{label}</dt>
      <dd className="text-sm text-muted-foreground">{children}</dd>
    </div>
  );
}

/** Contenu de la page « Tarifs », publique ou dans les réglages (fiche 011, critère 3). */
export function PricingDetails() {
  const query = usePublicPricing();

  if (query.isPending)
    return (
      <div aria-busy className="space-y-3" role="status">
        <span className="sr-only">Chargement des tarifs…</span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
    );

  if (query.isError || !isPublishableRate(query.data.commissionRate))
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border border-border p-4 text-sm"
      >
        <p className="font-semibold">
          Les tarifs ne peuvent pas être affichés pour le moment.
        </p>
        <p className="text-muted-foreground">
          {typeof navigator !== "undefined" && !navigator.onLine
            ? "Vous êtes hors ligne. Reconnectez-vous puis réessayez."
            : "Réessayez dans un instant. Rien n’est prélevé tant que vous n’avez rien vendu."}
        </p>
        <Button
          variant="outline"
          className="h-11 sm:h-9"
          onClick={() => query.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );

  const {
    commissionRate: rate,
    currency,
    effectiveFrom,
    withdrawal,
  } = query.data;
  const pct = formatPercent(rate, 1);
  const money = (v: number) => formatMoney(v, currency);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-5">
        <p className="text-3xl font-semibold tracking-tight">{pct}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          par vente d’accès. Pas d’abonnement, pas de frais d’inscription.
        </p>
        <p className="mt-3 text-sm font-medium">{LAUNCH_OFFER}</p>
      </div>
      <dl>
        <Row label="Exemple">
          Sur une vente de {money(500)}, vous recevez{" "}
          <strong className="font-semibold text-foreground">
            {money(netFor(500, rate, currency))}
          </strong>
          . Sur {money(2500)}, vous recevez{" "}
          {money(netFor(2500, rate, currency))}.
        </Row>
        <Row label="Ce qui est inclus">
          La page d’achat pour vos clients, le paiement Mobile Money,
          l’activation des accès sur vos routeurs, le suivi des ventes et des
          revenus, autant de sites et d’offres que vous voulez.
        </Row>
        <Row label="Ventes au comptoir">
          Les accès que vous vendez vous-même en espèces : leur traitement sera
          annoncé avant leur ouverture.
        </Row>
        <Row label="Frais de retrait">
          {withdrawal?.enabled
            ? `Retrait possible à partir de ${money(withdrawal.minimumAmount)}.`
            : "Annoncés avant l’ouverture des retraits."}
        </Row>
        <Row label="Plus tard">
          Gérer plusieurs organisations pourra devenir un abonnement. Il sera
          annoncé à l’avance et restera facultatif.
        </Row>
      </dl>
      <p className="text-xs text-muted-foreground">
        {effectiveFrom
          ? `Taux en vigueur depuis le ${formatDate(effectiveFrom)}. `
          : ""}
        Un changement de taux ne touche jamais les ventes déjà faites.
      </p>
    </div>
  );
}
