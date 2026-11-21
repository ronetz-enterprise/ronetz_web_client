import { cn } from "@/lib/utils";
import { formatPrice, formatQuota, formatRate } from "../formatters/offer";
import { describeDuration, devicesLabel } from "../model/units";

export type PreviewData = {
  name: string;
  description: string;
  /** Prix tel que saisi (texte) ; invalide ou vide → « — ». */
  amount: string;
  currency: string;
  validitySeconds: string | null;
  devices: string | null;
  dataAllowanceBytes: string | null;
  downloadLimitBps: string | null;
};

function safePrice(amount: string, currency: string) {
  try {
    return /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/.test(amount)
      ? formatPrice(amount, currency)
      : "—";
  } catch {
    return "—";
  }
}

/**
 * L'offre telle qu'elle apparaît sur la page d'achat du client : nom, volume, durée, prix.
 * Purement illustratif (rien ne s'achète ici), utilisable avec une saisie en cours.
 */
export function OfferTicketPreview({
  data,
  siteName,
  note,
}: {
  data: PreviewData;
  siteName: string;
  note?: string;
}) {
  const quota = formatQuota(data.dataAllowanceBytes);
  const details = [
    data.validitySeconds ? describeDuration(data.validitySeconds) : null,
    data.devices ? devicesLabel(data.devices) : null,
    data.downloadLimitBps ? formatRate(data.downloadLimitBps) : null,
  ].filter(Boolean);
  const price = safePrice(data.amount, data.currency);
  return (
    <figure className="flex flex-col gap-2" aria-label="Aperçu pour le client">
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
        <div className="border-b border-border bg-muted px-4 py-2.5">
          <p className="truncate text-sm font-semibold">{siteName}</p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p
            className={cn(
              "text-xs font-semibold tracking-wide text-primary uppercase break-words",
              !data.name && "text-muted-foreground",
            )}
          >
            {data.name || "Nom de l’offre"}
          </p>
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {quota}
          </p>
          <p className="text-sm text-muted-foreground">
            {details.length ? details.join(" · ") : "Durée et appareils"}
          </p>
          {data.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground break-words">
              {data.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-3">
            <span className="tnum text-lg font-semibold">{price}</span>
            <span
              aria-hidden="true"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Acheter
            </span>
          </div>
        </div>
      </div>
      {note ? (
        <figcaption className="text-xs text-muted-foreground">
          {note}
        </figcaption>
      ) : null}
    </figure>
  );
}
