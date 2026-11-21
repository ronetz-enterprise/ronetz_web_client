"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePublicOffers } from "@/features/offer/queries/public-offers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { rememberHotspotLogin } from "../model/purchase-session";
import { OfferTicket } from "./offer-ticket";
import { PublicFailure } from "./purchase-shared";
import { routes } from "@/lib/routes";

/**
 * Étape 1 : choix de l'offre. Le portail du hotspot peut passer sa page de connexion en
 * `?login=` : elle est retenue pour y renvoyer le client une fois ses identifiants reçus.
 */
export function PublicOffers({ siteId }: { siteId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const login = params.get("login");

  useEffect(() => rememberHotspotLogin(siteId, login), [siteId, login]);

  const raw = params.get("page") ?? "0";
  const page =
    /^\d{1,10}$/.test(raw) && Number(raw) <= 2147483647 ? Number(raw) : 0;

  const query = usePublicOffers(siteId, page);

  if (query.isPending)
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[4.75rem] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (query.isError)
    return (
      <PublicFailure error={query.error} retry={() => void query.refetch()} />
    );

  const total = BigInt(query.data.totalElements),
    pages = (total + 19n) / 20n;
  const offers = query.data.content;

  function setPage(next: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(next));
    router.push(`?${sp.toString()}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Choisissez votre accès Internet
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payez par Mobile Money et connectez-vous en quelques minutes.
        </p>
      </div>
      {query.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Actualisation des offres…
        </p>
      )}
      {offers.length ? (
        <ul aria-label="Offres disponibles" className="space-y-2.5">
          {offers.map((offer) => (
            <li key={offer.offerId}>
              <OfferTicket
                offer={offer}
                href={routes.connectOffer(siteId, offer.offerId)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border p-5">
          <p className="font-semibold">Aucune offre disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucune offre ne peut être proposée avec ce lien pour le moment.
            Réessayez plus tard ou adressez-vous au responsable du point de
            connexion.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Actualiser
          </Button>
        </div>
      )}
      {pages > 1n && (
        <nav
          aria-label="Pages d'offres"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Précédente
          </Button>
          <span className="text-sm">
            Page {page + 1} / {String(pages || 1n)}
          </span>
          <Button
            variant="outline"
            disabled={
              BigInt(page + 1) >= pages ||
              page === 2147483647 ||
              query.isFetching
            }
            onClick={() => setPage(page + 1)}
          >
            Suivante
          </Button>
        </nav>
      )}
      {page > 0 && !query.data.content.length && (
        <Button onClick={() => setPage(0)}>Première page</Button>
      )}
    </div>
  );
}
