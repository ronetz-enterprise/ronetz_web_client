import {
  formatDuration,
  formatQuota,
  formatRate,
} from "@/features/offer/formatters/offer";
import type { PublicOffer } from "@/features/offer/queries/public-offers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { ApiError } from "@/lib/api-error";
import { toUserMessage } from "./purchase-error";

const purchaseSteps = ["Offre", "Paiement", "Connexion"];

/** Avancement de l'achat, mobile d'abord : étape courante et barre de progression. */
export function PurchaseSteps({ current }: { current: number }) {
  return (
    <Progress
      value={((current + 1) / purchaseSteps.length) * 100}
      className="gap-2"
    >
      <ProgressLabel className="text-xs">
        Étape {current + 1} sur {purchaseSteps.length} ·{" "}
        {purchaseSteps[current]}
      </ProgressLabel>
      <ProgressValue className="text-xs">
        {() => purchaseSteps.slice(current + 1).join(" → ") || "Terminé"}
      </ProgressValue>
    </Progress>
  );
}

export function OfferChips({ offer }: { offer: PublicOffer }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">
        {formatDuration(offer.accessPolicy.validitySeconds)}
      </Badge>
      <Badge variant="secondary">
        {formatQuota(offer.accessPolicy.dataAllowanceBytes)}
      </Badge>
      {offer.accessPolicy.downloadLimitBps && (
        <Badge variant="outline">
          {formatRate(offer.accessPolicy.downloadLimitBps)}
        </Badge>
      )}
    </div>
  );
}

/** Conditions de l'offre dans les mots du client. */
export function OfferConditions({ offer }: { offer: PublicOffer }) {
  const p = offer.accessPolicy;
  const rows = [
    ["Durée", formatDuration(p.validitySeconds)],
    ["Volume de données", formatQuota(p.dataAllowanceBytes)],
    ["Vitesse de téléchargement", formatRate(p.downloadLimitBps)],
    ["Vitesse d'envoi", formatRate(p.uploadLimitBps)],
    ["Appareils connectés en même temps", p.maxConcurrentSessions],
  ];
  return (
    <dl className="divide-y text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PublicFailure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  if (error instanceof ApiError && [400, 403, 404].includes(error.status))
    return (
      <div className="rounded-xl border p-5">
        <p className="font-semibold">Offre indisponible</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce lien ne permet pas de consulter cette offre. Revenez aux offres
          disponibles ou utilisez le lien fourni sur le portail Wi-Fi.
        </p>
      </div>
    );
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {toUserMessage(error)}{" "}
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={retry}
        >
          Réessayer
        </button>
      </AlertDescription>
    </Alert>
  );
}
