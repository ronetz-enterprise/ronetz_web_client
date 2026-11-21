"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { usePublicOffer } from "@/features/offer/queries/public-offers";
import { formatPrice } from "@/features/offer/formatters/offer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  useDeliveredCredential,
  usePaymentChannels,
  usePurchaseProgress,
  usePurchaseSession,
  useRetryPayment,
  useVerifyPayment,
} from "../hooks/use-purchase";
import { maskNumber } from "../model/mobile-money";
import { channelLabel } from "../model/payment-channel";
import type { PurchaseStage } from "../model/purchase-progress";
import { hotspotLogin, type PurchaseSession } from "../model/purchase-session";
import { DeliveredCredentialCard } from "./delivered-credential";
import { PaymentForm } from "./payment-form";
import { PurchaseSteps } from "./purchase-shared";
import { purchaseErrorMessage } from "./purchase-error";

/** Type du `Stepper` simplifié — sans dépendance sur le composant de l'ancien projet. */
type StepState = "complete" | "running" | "upcoming";
type Step = { id: string; title: string; state: StepState };

function Stepper({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol aria-label={label} className="text-sm">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 ${step.state === "complete" ? "bg-primary" : "bg-border"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                step.state === "complete"
                  ? "bg-primary text-primary-foreground"
                  : step.state === "running"
                    ? "bg-background text-primary ring-2 ring-primary ring-inset"
                    : "bg-background text-muted-foreground ring-1 ring-border ring-inset"
              }`}
            >
              {step.state === "complete" ? (
                "✓"
              ) : step.state === "running" ? (
                <Spinner className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <p
              className={`min-w-0 flex-1 pt-0.5 leading-5 font-medium ${step.state === "upcoming" ? "text-muted-foreground" : ""}`}
            >
              {step.title}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function SuccessMoment({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section
      role="status"
      className="flex flex-col items-start gap-4 rounded-xl border bg-primary/5 p-5 sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:fade-in motion-safe:duration-300"
      >
        ✓
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-heading text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

function useElapsed(since: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(since).getTime()) / 1000),
  );
  return {
    seconds,
    label: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
  };
}

function progressSteps(stage: PurchaseStage["kind"]): Step[] {
  const order = ["approval", "preparing", "ready"];
  const position = order.indexOf(stage);
  const state = (index: number): StepState =>
    position > index
      ? "complete"
      : position === index
        ? stage === "ready"
          ? "complete"
          : "running"
        : "upcoming";
  return [
    { id: "request", title: "Demande de paiement envoyée", state: "complete" },
    {
      id: "approval",
      title: "Validation sur votre téléphone",
      state: state(0),
    },
    {
      id: "preparing",
      title: "Activation de votre accès Wi-Fi",
      state: state(1),
    },
    { id: "ready", title: "Identifiants prêts", state: state(2) },
  ];
}

function Receipt({ session }: { session: PurchaseSession }) {
  const offer = usePublicOffer(session.siteId, session.offerId);
  const channels = usePaymentChannels();
  const rows: [string, string][] = [
    ["Offre", offer.data?.name ?? "…"],
    [
      "Montant",
      offer.data
        ? formatPrice(offer.data.price.amount, offer.data.price.currencyCode)
        : "…",
    ],
    [
      "Payé avec",
      `${channelLabel(channels, session.channelId ?? session.network)} · ${maskNumber(session.phone)}`,
    ],
    ["Référence", session.purchaseId.slice(0, 8).toUpperCase()],
    ["Date", formatDateTime(session.createdAt)],
  ];
  return (
    <section
      aria-label="Récapitulatif de l'achat"
      className="rounded-xl border bg-card p-4 sm:p-5"
    >
      <h2 className="mb-3 text-sm font-medium">Récapitulatif</h2>
      <dl className="divide-y text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Approval({
  session,
  stage,
}: {
  session: PurchaseSession;
  stage: Extract<PurchaseStage, { kind: "approval" }>;
}) {
  const elapsed = useElapsed(stage.payment.createdAt);
  const channels = usePaymentChannels();
  const verify = useVerifyPayment(session);
  const [changing, setChanging] = useState(false);
  const retry = useRetryPayment(session);
  const redirect =
    stage.payment.actionType === "redirect_url"
      ? stage.payment.actionUrl
      : null;
  const amount = formatPrice(stage.payment.amount, stage.payment.currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-surface px-4 py-8 text-center">
        <span className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-ping"
          />
          <HugeiconsIcon
            icon={SmartPhone01Icon}
            strokeWidth={1.75}
            className="relative size-6"
            aria-hidden="true"
          />
        </span>
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {redirect
              ? "Validez le paiement"
              : "Validez le paiement sur votre téléphone"}
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {redirect
              ? `Ouvrez la page de validation de ${channelLabel(channels, session.channelId ?? session.network)} pour confirmer le paiement de ${amount}.`
              : `Une demande de ${amount} a été envoyée au ${maskNumber(session.phone)} (${channelLabel(channels, session.channelId ?? session.network)}). Ouvrez-la et saisissez votre code secret pour confirmer.`}
          </p>
        </div>
        {redirect && (
          <Button
            className="min-h-11"
            render={
              <a
                href={redirect}
                rel="noopener noreferrer"
                aria-label="Ouvrir la page de validation du paiement"
              />
            }
          >
            <HugeiconsIcon
              icon={LinkSquare02Icon}
              strokeWidth={1.75}
              data-icon="inline-start"
              aria-hidden="true"
            />
            Ouvrir la page de validation
          </Button>
        )}
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner />
          En attente de votre validation ·{" "}
          <span className="tabular-nums">{elapsed.label}</span>
        </p>
      </div>
      <Stepper
        steps={progressSteps("approval")}
        label="Avancement de l'achat"
      />
      {elapsed.seconds >= 30 && !changing && (
        <section
          aria-label="Aide"
          className="space-y-3 rounded-xl border p-4 sm:p-5"
        >
          <h2 className="text-sm font-medium">
            Vous ne voyez pas la demande ?
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Vérifiez que votre téléphone a du réseau et que le compte a assez
              de crédit.
            </li>
            <li>La demande peut mettre une à deux minutes à arriver.</li>
            <li>Une fois validée, cette page se met à jour toute seule.</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={verify.isPending}
              onClick={() => verify.mutate(stage.payment)}
            >
              {verify.isPending ? "Vérification…" : "J'ai validé, vérifier"}
            </Button>
            <Button variant="ghost" onClick={() => setChanging(true)}>
              Changer de numéro
            </Button>
          </div>
          {verify.isSuccess && verify.data === null && (
            <p role="status" className="text-sm text-muted-foreground">
              Une vérification est déjà en cours. Le résultat s'affichera ici
              dans un instant.
            </p>
          )}
        </section>
      )}
      {changing && (
        <section
          aria-label="Changer de numéro"
          className="space-y-4 rounded-xl border p-4 sm:p-5"
        >
          <h2 className="text-sm font-medium">Payer avec un autre numéro</h2>
          <p className="text-sm text-muted-foreground">
            La demande en cours sera ignorée si vous ne la validez pas.
          </p>
          <PaymentForm
            withEmail={false}
            submitLabel={`Envoyer une nouvelle demande de ${amount}`}
            pending={retry.isPending}
            error={retry.isError ? purchaseErrorMessage(retry.error) : null}
            defaultValues={{
              channelId: session.channelId ?? session.network,
              phone: session.phone,
            }}
            onSubmit={(values) =>
              retry.mutate(values, { onSuccess: () => setChanging(false) })
            }
          />
        </section>
      )}
    </div>
  );
}

function Retry({
  session,
  title,
  description,
}: {
  session: PurchaseSession;
  title: string;
  description: string;
}) {
  const retry = useRetryPayment(session);
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      <section aria-label="Réessayer le paiement" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Réessayer le paiement
        </h2>
        <PaymentForm
          withEmail={false}
          submitLabel="Envoyer une nouvelle demande"
          pending={retry.isPending}
          error={retry.isError ? purchaseErrorMessage(retry.error) : null}
          defaultValues={{
            channelId: session.channelId ?? session.network,
            phone: session.phone,
          }}
          onSubmit={(values) => retry.mutate(values)}
        />
      </section>
    </div>
  );
}

function Ready({
  session,
  accessGrantId,
  deliverable,
}: {
  session: PurchaseSession;
  accessGrantId: string;
  deliverable: boolean;
}) {
  const credential = useDeliveredCredential(
    session,
    accessGrantId,
    deliverable,
  );
  const alreadyDelivered =
    (!deliverable && credential.data === undefined) ||
    (credential.error instanceof Error &&
      "status" in credential.error &&
      (credential.error as { status?: number }).status === 403);

  if (alreadyDelivered)
    return (
      <div className="space-y-6">
        <SuccessMoment
          title="Votre accès est actif"
          description="Le paiement est reçu et l'accès fonctionne sur le Wi-Fi."
        />
        <Alert>
          <AlertTitle>Identifiants déjà remis</AlertTitle>
          <AlertDescription>
            Pour votre sécurité, les identifiants ne sont affichés que pendant
            quelques minutes après l'achat. Si vous ne les avez pas notés,
            adressez-vous au responsable du point de connexion avec la référence
            ci-dessous.
          </AlertDescription>
        </Alert>
      </div>
    );

  if (credential.isPending)
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner /> Récupération de vos identifiants…
      </p>
    );

  if (credential.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Identifiants momentanément indisponibles</AlertTitle>
        <AlertDescription>
          Votre accès est actif. Rechargez la page dans un instant pour afficher
          vos identifiants.
        </AlertDescription>
      </Alert>
    );

  return (
    <div className="space-y-6">
      <SuccessMoment
        title="Paiement reçu, votre accès est prêt"
        description="Connectez-vous au Wi-Fi avec les identifiants ci-dessous."
      />
      <DeliveredCredentialCard
        credential={credential.data}
        hotspotLogin={hotspotLogin(session.siteId)}
      />
    </div>
  );
}

/** Au-delà de ce délai sans activation, le client reçoit une consigne au lieu d'une attente sans fin. */
const ACTIVATION_PATIENCE_SECONDS = 180;

function Preparing({ session }: { session: PurchaseSession }) {
  // Le décompte part de l'arrivée sur cet état : le paiement vient d'être confirmé.
  const [since] = useState(() => new Date().toISOString());
  const { seconds } = useElapsed(since);
  const late = seconds >= ACTIVATION_PATIENCE_SECONDS;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Paiement reçu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nous activons votre accès sur le Wi-Fi. Cela prend en général quelques
          secondes : gardez cette page ouverte.
        </p>
      </div>
      {late ? (
        <Alert role="status">
          <AlertDescription className="space-y-2">
            <p className="font-medium text-foreground">
              L’activation prend plus de temps que prévu.
            </p>
            <p>
              Votre paiement est bien reçu, vous ne serez pas débité une
              deuxième fois. Gardez cette page ouverte : elle se met à jour
              seule. Si rien ne change, montrez la référence{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {session.purchaseId.slice(0, 8).toUpperCase()}
              </span>{" "}
              au responsable du point Wi-Fi.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner /> Activation en cours…
        </p>
      )}
      <Stepper
        steps={progressSteps("preparing")}
        label="Avancement de l'achat"
      />
    </div>
  );
}

function Tracking({ session }: { session: PurchaseSession }) {
  const progress = usePurchaseProgress(session);

  const restart = (
    <Button
      variant="outline"
      className="min-h-11"
      render={<Link href={routes.connect(session.siteId)} />}
    >
      Choisir une offre
    </Button>
  );

  if (progress.loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );

  if (progress.error && !progress.payment && !progress.access)
    return (
      <Alert variant="destructive">
        <AlertTitle>Impossible de suivre l'achat</AlertTitle>
        <AlertDescription>
          Une erreur est survenue. Réessayez.{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => void progress.refetch()}
          >
            Réessayer
          </button>
        </AlertDescription>
      </Alert>
    );

  const { stage } = progress;

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-32 sm:pb-0">
      <PurchaseSteps current={stage.kind === "ready" ? 2 : 1} />
      {stage.kind === "approval" && (
        <Approval session={session} stage={stage} />
      )}
      {stage.kind === "preparing" && <Preparing session={session} />}
      {stage.kind === "ready" && (
        <Ready
          session={session}
          accessGrantId={stage.accessGrantId}
          deliverable={stage.deliverable}
        />
      )}
      {stage.kind === "failed" && (
        <Retry
          session={session}
          title="Le paiement n'a pas abouti"
          description="La demande a été refusée ou n'a pas été validée à temps. Une demande refusée n'est pas prélevée ; vous pouvez réessayer, avec ce numéro ou un autre."
        />
      )}
      {stage.kind === "unpaid" && (
        <Retry
          session={session}
          title="Le paiement n'a pas pu être lancé"
          description="La demande n'est pas partie vers votre téléphone. Vérifiez le numéro et l'opérateur, puis réessayez."
        />
      )}
      {stage.kind === "expired" && (
        <div className="rounded-xl border p-5">
          <p className="font-semibold">Le délai de paiement est dépassé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Un achat doit être payé dans les 20 minutes. Aucun montant n'a été
            prélevé : choisissez de nouveau votre offre pour recommencer.
          </p>
          <div className="mt-4">{restart}</div>
        </div>
      )}
      {stage.kind === "closed" && (
        <div className="rounded-xl border p-5">
          <p className="font-semibold">Cet achat n'est plus valable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Il a été annulé ou a expiré. Choisissez de nouveau votre offre pour
            recommencer.
          </p>
          <div className="mt-4">{restart}</div>
        </div>
      )}
      <Receipt session={session} />
    </div>
  );
}

/**
 * Étape 3 : suivi de l'achat, de la validation sur le téléphone jusqu'aux identifiants.
 * Le suivi n'est possible que sur l'appareil qui a payé.
 */
export function PurchaseTracking({
  siteId,
  purchaseId,
}: {
  siteId: string;
  purchaseId: string;
}) {
  const { session, ready } = usePurchaseSession(purchaseId);

  if (!ready)
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );

  if (!session || session.siteId !== siteId)
    return (
      <div className="rounded-xl border p-5">
        <p className="font-semibold">Suivi indisponible sur cet appareil</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Le suivi d'un achat n'est possible que sur le téléphone qui a payé,
          dans le même onglet. Si vous avez payé, vos identifiants restent
          valables : adressez-vous au responsable du point de connexion.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          render={<Link href={routes.connect(siteId)} />}
        >
          Voir les offres
        </Button>
      </div>
    );

  return <Tracking session={session} />;
}
