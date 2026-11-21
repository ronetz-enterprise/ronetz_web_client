"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Alert02Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/format";
import { toUserMessage } from "@/lib/api-error";
import { useRemoteCredentialDelivery } from "../mutations/remote-credential-delivery";
import type { IssuedCredential } from "../model/manual-access";

/**
 * Identifiant et mot de passe d'un accès qui vient d'être créé, affichés **une seule fois**.
 * Le secret vit dans l'état de ce composant : jamais dans un cache, une adresse ou un stockage.
 * On n'affiche que ce que renvoie l'API, sans présumer de sa longueur.
 */
export function IssuedCredentialPanel({
  credential,
}: {
  credential: IssuedCredential;
}) {
  const [revealed, setRevealed] = useState(true);
  const [message, setMessage] = useState("");
  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${what} copié.`);
    } catch {
      setMessage("Copie impossible : sélectionnez la valeur et recopiez-la.");
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden />
        <AlertTitle>Notez-les maintenant</AlertTitle>
        <AlertDescription>
          Le mot de passe ne sera plus jamais affiché, ni pour vous ni pour
          votre équipe. Remettez-le au client en main propre ou par message
          privé.
        </AlertDescription>
      </Alert>

      <CredentialLine
        label="Identifiant"
        value={credential.username}
        onCopy={() => void copy(credential.username, "Identifiant")}
      />
      <CredentialLine
        label="Mot de passe"
        value={revealed ? credential.clearTextPassword : "••••••••"}
        secret={!revealed}
        onCopy={() => void copy(credential.clearTextPassword, "Mot de passe")}
        extra={
          <Button
            type="button"
            variant="ghost"
            className="h-11 sm:h-9"
            aria-pressed={revealed}
            onClick={() => setRevealed((v) => !v)}
          >
            <HugeiconsIcon
              icon={revealed ? ViewOffIcon : ViewIcon}
              data-icon="inline-start"
              aria-hidden
            />
            {revealed ? "Masquer" : "Afficher"}
          </Button>
        }
      />
      <p className="text-sm text-muted-foreground">
        Le temps de l’accès a commencé à l’émission. Il se termine le{" "}
        {formatDateTime(credential.expiresAt)}.
      </p>
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {message}
      </p>
    </div>
  );
}

function CredentialLine({
  label,
  value,
  secret,
  onCopy,
  extra,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className="rounded-lg bg-muted px-3 py-2.5 font-mono text-lg break-all select-all"
        aria-label={secret ? `${label} masqué` : undefined}
      >
        {value}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-9"
          onClick={onCopy}
          aria-label={`Copier : ${label.toLowerCase()}`}
        >
          <HugeiconsIcon
            icon={Copy01Icon}
            data-icon="inline-start"
            aria-hidden
          />
          Copier
        </Button>
        {extra}
      </div>
    </div>
  );
}

/** Même panneau, pour un site servi par un nœud : le mot de passe arrive après activation. */
export function RemoteCredentialPanel({
  accessGrantId,
  retrievalToken,
}: {
  accessGrantId: string;
  retrievalToken: string;
}) {
  const state = useRemoteCredentialDelivery(accessGrantId, retrievalToken);
  if (state.status === "ready")
    return <IssuedCredentialPanel credential={state.credential} />;
  if (state.status === "waiting")
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 text-sm text-muted-foreground"
      >
        <Spinner aria-hidden />
        Activation de l’accès sur le réseau du site… L’identifiant et le mot de
        passe s’affichent dès qu’il est prêt. Ne fermez pas cette fenêtre.
      </div>
    );
  return (
    <Alert variant="warning">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden />
      <AlertTitle>Le mot de passe ne peut pas être affiché</AlertTitle>
      <AlertDescription>
        {state.status === "expired"
          ? "Le délai d’affichage est dépassé. L’accès reste valable : annulez-le puis créez-en un nouveau si vous n’avez pas noté le mot de passe."
          : `L’accès est créé, mais son activation sur le réseau du site n’est pas confirmée. ${toUserMessage(state.error)} Ouvrez l’accès dans la liste pour suivre son activation.`}
      </AlertDescription>
    </Alert>
  );
}
