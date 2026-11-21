"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { usePublicOffer } from "@/features/offer/queries/public-offers";
import {
  formatPrice,
  formatDuration,
  formatQuota,
  formatRate,
} from "@/features/offer/formatters/offer";
import type { PublicOffer } from "@/features/offer/queries/public-offers";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { useStartPurchase, usePaymentChannels } from "../hooks/use-purchase";
import { findChannel } from "../model/payment-channel";
import { ChannelList, ChannelLogo, PaymentForm } from "./payment-form";
import { OfferConditions, PublicFailure } from "./purchase-shared";
import { purchaseErrorMessage } from "./purchase-error";

function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      className="-ml-2.5 rounded-full"
      render={<Link href={href} />}
      nativeButton={false}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </Button>
  );
}

function PurchaseDetails({ offer }: { offer: PublicOffer }) {
  return (
    <Collapsible className="border-y">
      <CollapsibleTrigger className="group flex min-h-14 w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Détail de mon achat</span>
          <span className="block truncate text-xs text-muted-foreground">
            {offer.name}
          </span>
        </span>
        <span className="font-heading font-semibold tabular-nums">
          {formatPrice(offer.price.amount, offer.price.currencyCode)}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pb-4">
        {offer.description && (
          <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {offer.description}
          </p>
        )}
        <OfferConditions offer={offer} />
        <p className="text-xs text-muted-foreground">
          La durée démarre dès que votre accès est activé, juste après le
          paiement.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Étape 2 : paiement. D'abord le moyen de paiement (liste), puis le numéro à débiter ; le moyen
 * choisi est dans l'URL (`?moyen=`), donc le retour du navigateur revient à la liste.
 */
export function PurchaseReview({
  siteId,
  offerId,
}: {
  siteId: string;
  offerId: string;
}) {
  const query = usePublicOffer(siteId, offerId);
  const start = useStartPurchase(siteId, offerId);
  const router = useRouter();
  const channels = usePaymentChannels();
  const params = useSearchParams();
  const channel = findChannel(channels, params.get("moyen"));

  const offersPath = routes.connect(siteId);
  const reviewPath = routes.connectOffer(siteId, offerId);

  if (query.isPending)
    return (
      <div className="mx-auto max-w-md space-y-6">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );

  if (query.isError)
    return (
      <div className="mx-auto max-w-md space-y-6">
        <BackButton href={offersPath} label="Retour aux offres" />
        <PublicFailure error={query.error} retry={() => void query.refetch()} />
      </div>
    );

  const offer = query.data;
  const price = formatPrice(offer.price.amount, offer.price.currencyCode);

  function setMoyen(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("moyen", id);
    router.push(`${reviewPath}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-md pb-32 sm:pb-0">
      <div className="space-y-6">
        <div className="space-y-3">
          {channel ? (
            <BackButton
              href={reviewPath}
              label="Changer de moyen de paiement"
            />
          ) : (
            <BackButton href={offersPath} label="Retour aux offres" />
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {channel ? "Votre numéro" : "Comment voulez-vous payer ?"}
          </h1>
        </div>
        <PurchaseDetails offer={offer} />
        {channel ? (
          <section aria-label="Numéro à débiter" className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
              <ChannelLogo channel={channel} className="size-8" />
              <span className="min-w-0 flex-1 font-medium">
                {channel.label}
              </span>
              <Link
                href={reviewPath}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Changer
              </Link>
            </div>
            <PaymentForm
              channelId={channel.id}
              submitLabel={`Payer ${price}`}
              pending={start.isPending}
              error={start.isError ? purchaseErrorMessage(start.error) : null}
              onSubmit={(values) => start.mutate(values)}
            />
          </section>
        ) : (
          <section aria-label="Moyen de paiement">
            <ChannelList onSelect={(id) => setMoyen(id)} />
          </section>
        )}
      </div>
    </div>
  );
}
