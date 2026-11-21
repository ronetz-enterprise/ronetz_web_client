"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { InlineError, PageSkeleton } from "@/features/site/components/feedback";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { zodResolver } from "@/lib/form-utils";
import { routes } from "@/lib/routes";
import {
  routerCapabilities,
  routerNameSchema,
  type Router,
  type RouterAction,
} from "../model/router";
import { useRouter, useRouterChange, useRouterSite } from "../queries/routers";
import { BackLink } from "./router-detail";
import { useRouterCommands } from "./router-commands";

const ACTIONS: Record<
  Exclude<RouterAction, "provision">,
  { title: string; text: string; button: string; confirm: string; done: string }
> = {
  artifact: {
    title: "Nouveau script d'installation",
    text: "Remplace le script actuel. Le nouveau reste valable 15 minutes.",
    button: "Préparer un nouveau script",
    confirm:
      "Le script précédent ne fonctionnera plus. Vous pourrez télécharger le nouveau dès qu'il est prêt.",
    done: "Votre nouveau script est en préparation.",
  },
  suspend: {
    title: "Suspendre le routeur",
    text: "Vos clients ne pourront plus se connecter par ce routeur. Vous pourrez le réactiver.",
    button: "Suspendre",
    confirm:
      "Vos clients ne pourront plus se connecter par ce routeur tant qu'il est suspendu.",
    done: "Suspension demandée.",
  },
  resume: {
    title: "Réactiver le routeur",
    text: "Le routeur pourra de nouveau servir vos clients.",
    button: "Réactiver",
    confirm:
      "Le routeur servira de nouveau vos clients dès que la réactivation est confirmée.",
    done: "Réactivation demandée.",
  },
  revoke: {
    title: "Retirer le routeur",
    text: "Le routeur est retiré définitivement de votre organisation. On ne peut pas revenir en arrière.",
    button: "Retirer",
    confirm:
      "Cette action est définitive : le routeur ne pourra plus être utilisé avec Ronetz.",
    done: "Retrait demandé.",
  },
};

function RenameForm({
  router,
  editable,
}: {
  router: Router;
  editable: boolean;
}) {
  const mutation = useRouterChange();
  const form = useForm<z.infer<typeof routerNameSchema>>({
    resolver: zodResolver(routerNameSchema),
    defaultValues: { name: router.name },
  });
  const error = form.formState.errors.name?.message;
  async function save(values: z.infer<typeof routerNameSchema>) {
    try {
      await mutation.mutateAsync({
        action: "rename",
        router,
        name: values.name,
      });
      form.reset({ name: values.name });
      toast.success("Nom enregistré.");
    } catch (e) {
      if (e instanceof ApiError && e.problem?.errors?.[0])
        form.setError("name", { message: e.problem.errors[0].message });
    }
  }
  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-2"
      onSubmit={(e) => void form.handleSubmit(save)(e)}
    >
      <label htmlFor="router-rename" className="text-sm font-medium">
        Nom du routeur
      </label>
      <Input
        id="router-rename"
        className="h-11 md:h-9"
        readOnly={!editable}
        disabled={mutation.isPending}
        aria-invalid={!!error}
        aria-describedby={error ? "router-rename-error" : undefined}
        {...form.register("name")}
      />
      {error ? (
        <p
          id="router-rename-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {mutation.isError && !error ? (
        <p role="alert" className="text-sm text-destructive">
          {toUserMessage(mutation.error)}
        </p>
      ) : null}
      {editable ? (
        <div>
          <Button
            type="submit"
            variant="secondary"
            className="h-11 md:h-9"
            disabled={!form.formState.isDirty || mutation.isPending}
          >
            {mutation.isPending ? "Enregistrement…" : "Enregistrer le nom"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function RouterSettingsScreen({ routerId }: { routerId: string }) {
  const query = useRouter(routerId);
  const site = useRouterSite(query.data);
  const { membership } = useOrganization();
  const [selection, setSelection] = useState<Exclude<
    RouterAction,
    "provision"
  > | null>(null);
  const commands = useRouterCommands(
    query.data ?? ({ id: routerId } as Router),
  );

  if (query.isPending) return <PageSkeleton />;
  if (query.isError)
    return (
      <InlineError error={query.error} retry={() => void query.refetch()} />
    );

  const router = query.data;
  const caps = routerCapabilities(membership, router, site.data ?? null);
  const available = (
    ["artifact", "resume", "suspend", "revoke"] as const
  ).filter((a) => caps[a]);

  async function confirm() {
    if (!selection) return;
    const done = ACTIONS[selection].done;
    if (await commands.send(selection)) {
      toast.success(done);
      setSelection(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="pb-0"
        title="Réglages du routeur"
        description={router.name}
        back={
          <BackLink href={routes.router(router.id)}>Retour au routeur</BackLink>
        }
      />
      {!caps.canCreateRouter ? (
        <Alert>
          <AlertTitle>Lecture seule</AlertTitle>
          <AlertDescription>
            Seul le propriétaire de l&apos;organisation peut modifier ce
            routeur.
          </AlertDescription>
        </Alert>
      ) : null}
      {router.lifecycleStatus === "REVOKED" ? (
        <Alert>
          <AlertTitle>Ce routeur est retiré</AlertTitle>
          <AlertDescription>Il ne peut plus être modifié.</AlertDescription>
        </Alert>
      ) : null}

      <RenameForm router={router} editable={caps.canEditRouter} />

      {router.pendingAction ? (
        <Alert>
          <AlertTitle>Une demande est en cours</AlertTitle>
          <AlertDescription>
            Patientez : les actions reviennent dès qu&apos;elle est terminée.
          </AlertDescription>
        </Alert>
      ) : null}

      {available.length > 0 ? (
        <section
          aria-labelledby="router-manage"
          className="flex flex-col gap-3"
        >
          <h2 id="router-manage" className="text-base font-semibold">
            Gérer le routeur
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {available.map((a) => (
              <li
                key={a}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ACTIONS[a].title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ACTIONS[a].text}
                  </p>
                </div>
                <Button
                  variant={a === "revoke" ? "destructive" : "outline"}
                  className="h-11 shrink-0 md:h-9"
                  disabled={commands.pending}
                  onClick={() => {
                    commands.reset();
                    setSelection(a);
                  }}
                >
                  {ACTIONS[a].button}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {commands.receipt && !selection ? (
        <Alert>
          <AlertTitle>Dernière demande sans réponse</AlertTitle>
          <AlertDescription>
            <p>
              Le service n&apos;a pas confirmé votre dernière demande. Vous
              pouvez la renvoyer sans risque de doublon.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-11 md:h-9"
              disabled={
                commands.pending ||
                (!!router.pendingAction &&
                  router.pendingAction !==
                    commands.receipt.action.toUpperCase())
              }
              onClick={() => {
                const a = commands.receipt!.action;
                if (a !== "provision") setSelection(a);
              }}
            >
              Renvoyer la demande
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !commands.pending) setSelection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection ? ACTIONS[selection].title : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {router.name}. {selection ? ACTIONS[selection].confirm : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {commands.isError ? (
            <InlineError
              error={commands.error}
              title="La demande n'a pas abouti"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={commands.pending}>
              Annuler
            </AlertDialogCancel>
            <Button
              variant={selection === "revoke" ? "destructive" : "default"}
              className="h-11 md:h-9"
              disabled={commands.pending}
              onClick={() => void confirm()}
            >
              {commands.pending
                ? "Envoi…"
                : selection
                  ? ACTIONS[selection].button
                  : "Confirmer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
