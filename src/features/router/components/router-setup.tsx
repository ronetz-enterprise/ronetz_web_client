"use client";

import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Site } from "@/features/site/model/site";
import { InlineError } from "@/features/site/components/feedback";
import { toUserMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  artifactFileName,
  importCommand,
  routerCapabilities,
  routerOsMinimum,
  setupSteps,
  type Router,
  type SetupStage,
} from "../model/router";
import { useRouterScriptDownload } from "../queries/routers";
import { useRouterCommands } from "./router-commands";
import { useOrganization } from "@/features/organizations/hooks/organization-context";

/**
 * Mise en service façon guide de démarrage Stripe (captures 03 et 17) : une fine barre de
 * progression, puis la liste des étapes. Faite : coche pleine ; en cours : en gras et dépliée
 * (son contenu dessous, sur fond gris) ; à venir : cercle pointillé, texte grisé.
 */
/** Avancement court, posé à droite du titre de la section (comme l'en-tête du guide Stripe). */
export function SetupProgressBadge({ current }: { current: number }) {
  const total = setupSteps.length;
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
      {current + 1} sur {total}
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label="Avancement de l'installation"
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-signal transition-[width] duration-300"
          style={{ width: `${((current + 0.5) / total) * 100}%` }}
        />
      </span>
    </span>
  );
}

export function SetupSteps({
  current,
  title,
  children,
}: {
  current: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <ol aria-label="Étapes de l'installation" className="flex flex-col">
        {setupSteps.map((label, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li
              key={label}
              aria-current={now ? "step" : undefined}
              className="flex flex-col"
            >
              <div className="flex h-10 items-center gap-3 text-sm">
                {done ? (
                  <span
                    aria-hidden
                    className="grid size-4 shrink-0 place-items-center rounded-full bg-signal text-white"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={3}
                      className="size-2.5"
                    />
                  </span>
                ) : now ? (
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full border-[5px] border-foreground"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/60"
                  />
                )}
                <span
                  className={cn(
                    now
                      ? "font-semibold text-foreground"
                      : done
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                <span className="sr-only">
                  {done ? " (terminée)" : now ? " (en cours)" : " (à venir)"}
                </span>
              </div>
              {now ? (
                <div className="mb-2 ml-7 flex flex-col gap-4 rounded-lg bg-muted/60 p-4">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <div className="flex flex-col gap-4 text-sm">{children}</div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Step({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="w-4 shrink-0 pt-px text-right text-sm font-semibold text-muted-foreground tabular-nums"
      >
        {index}.
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-sm">{children}</div>
    </li>
  );
}

function CopyLine({ value }: { value: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("failed");
    }
  }
  return (
    <div className="space-y-2">
      <code className="block rounded-md border bg-background px-3 py-2 font-mono text-xs break-all select-all">
        {value}
      </code>
      <Button
        variant="outline"
        className="h-11 w-full sm:w-auto md:h-9"
        onClick={() => void copy()}
      >
        {state === "done" ? "Ligne copiée" : "Copier la ligne"}
      </Button>
      <p role="status" className="text-xs text-muted-foreground">
        {state === "failed"
          ? "Copie impossible : sélectionnez la ligne et copiez-la à la main."
          : ""}
      </p>
    </div>
  );
}

/**
 * Installation du routeur sans technicien : une seule action principale à la fois, et chaque
 * état en cours se termine par une consigne claire.
 */
export function RouterSetupGuide({
  router,
  stage,
  site,
  onRefresh,
  refreshing,
}: {
  router: Router;
  stage: SetupStage;
  site: Site | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { membership } = useOrganization();
  const caps = routerCapabilities(membership, router, site);
  const siteActive = site?.status === "ACTIVE";
  const commands = useRouterCommands(router);
  const script = useRouterScriptDownload(router);
  const [downloaded, setDownloaded] = useState(false);

  const refresh = (
    <Button
      variant="outline"
      className="h-11 md:h-9"
      onClick={onRefresh}
      disabled={refreshing}
    >
      {refreshing ? "Vérification…" : "Vérifier maintenant"}
    </Button>
  );

  let title: string;
  let body: ReactNode;

  if (stage.step === 1 && stage.state === "running") {
    title = "Votre script est en préparation";
    body = (
      <>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          Cela prend quelques instants. Cette page se met à jour toute seule.
        </p>
        <p className="font-medium">
          Patientez : rien à faire pour l&apos;instant.
        </p>
        {refresh}
      </>
    );
  } else if (stage.step === 1) {
    const failed = stage.state === "failed";
    title = failed ? "La préparation n'a pas abouti" : "Préparez votre script";
    body = (
      <>
        <p className="text-muted-foreground">
          {failed
            ? "Vous pouvez réessayer. Si cela se répète, écrivez-nous depuis la page d'aide."
            : `Ronetz prépare un script propre à votre ${router.vendor} ${router.model}. Vous le copierez ensuite sur le routeur, une seule fois.`}
        </p>
        {caps.provision ? (
          <Button
            className="h-11 w-full sm:w-auto md:h-9"
            disabled={commands.pending}
            onClick={() => void commands.send("provision")}
          >
            {commands.pending
              ? "Envoi…"
              : failed
                ? "Réessayer"
                : "Préparer mon script"}
          </Button>
        ) : (
          <p className="text-muted-foreground">
            {siteActive
              ? "Une autre demande est en cours. Patientez un instant."
              : "Le site de ce routeur doit être actif pour continuer."}
          </p>
        )}
        {commands.isError ? (
          <InlineError
            error={commands.error}
            title="La demande n'a pas pu être envoyée"
          />
        ) : null}
      </>
    );
  } else if (stage.step === 2) {
    title = "Installez le script sur votre routeur";
    const file = artifactFileName(router);
    body = (
      <>
        {script.expired ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Le code a expiré</AlertTitle>
            <AlertDescription>
              <p>
                Un script n&apos;est valable que 15 minutes. Préparez-en un
                nouveau pour continuer.
              </p>
              {caps.artifact ? (
                <Button
                  className="mt-3 h-11 md:h-9"
                  disabled={commands.pending}
                  onClick={async () => {
                    if (await commands.send("artifact")) {
                      script.reset();
                      setDownloaded(false);
                    }
                  }}
                >
                  {commands.pending ? "Envoi…" : "Préparer un nouveau script"}
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <ol className="space-y-4">
          <Step index={1}>
            <p>
              Téléchargez votre script. Il reste valable 15 minutes et ne se
              partage avec personne.
            </p>
            {caps.download ? (
              <Button
                className="h-11 w-full sm:w-auto md:h-9"
                disabled={script.pending}
                onClick={async () => setDownloaded(await script.download())}
              >
                {script.pending
                  ? "Téléchargement…"
                  : downloaded
                    ? "Télécharger à nouveau"
                    : "Télécharger le script"}
              </Button>
            ) : null}
            {script.error && !script.expired ? (
              <p role="alert" className="text-destructive">
                {toUserMessage(script.error)}
              </p>
            ) : null}
          </Step>
          <Step index={2}>
            <p>
              Branchez votre téléphone ou votre ordinateur au routeur (par câble
              ou par le Wi-Fi du routeur). Ouvrez l&apos;application{" "}
              <strong className="font-medium">WinBox</strong>, puis
              connectez-vous au routeur avec son identifiant et son mot de
              passe.
            </p>
          </Step>
          <Step index={3}>
            <p>
              Dans WinBox, ouvrez <strong className="font-medium">Files</strong>{" "}
              et déposez-y le fichier{" "}
              <code className="font-mono text-xs break-all">{file}</code>.
            </p>
          </Step>
          <Step index={4}>
            <p>
              Dans WinBox, ouvrez la fenêtre de commande (le bouton{" "}
              <strong className="font-medium">« New Terminal »</strong>, dans le
              menu de gauche). Collez la ligne ci-dessous, puis appuyez sur
              Entrée.
            </p>
            <CopyLine value={importCommand(router)} />
          </Step>
          <Step index={5}>
            <p>
              Revenez ici et attendez : la suite s&apos;affiche toute seule dès
              que votre routeur répond.
            </p>
            {refresh}
          </Step>
        </ol>
        <p className="text-xs text-muted-foreground">
          Votre routeur doit avoir la version {routerOsMinimum} ou plus récente
          de son logiciel. Si vous ne connaissez pas son mot de passe,
          demandez-le à la personne qui l&apos;a installé : sans lui,
          l&apos;installation ne peut pas continuer. N&apos;effacez pas la
          configuration du routeur.
        </p>
      </>
    );
  } else {
    title = "En attente du premier signal";
    body = (
      <>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          Le script est installé. Ronetz attend que votre routeur se manifeste.
        </p>
        <p className="font-medium">
          Vérifiez que le routeur est allumé et relié à Internet : il passera «
          En ligne » tout seul.
        </p>
        {refresh}
      </>
    );
  }

  return (
    <SetupSteps current={stage.step} title={title}>
      {body}
    </SetupSteps>
  );
}
