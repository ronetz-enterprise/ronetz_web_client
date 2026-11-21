"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  InlineError,
  LinkButton,
  PageSkeleton,
} from "@/features/site/components/feedback";
import { useSites } from "@/features/site/queries/sites";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { zodResolver } from "@/lib/form-utils";
import { routes } from "@/lib/routes";
import {
  OTHER_MODEL,
  routerCapabilities,
  routerCreateSchema,
  routerModels,
  supportedVendor,
  type RouterCreateValues,
} from "../model/router";
import { sendRouterAction, useRouterChange } from "../queries/routers";

function Choice({
  id,
  label,
  help,
  error,
  value,
  display,
  placeholder,
  onChange,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  value: string;
  display?: ReactNode;
  placeholder: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {help ? (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      ) : null}
      <Select
        value={value || null}
        onValueChange={(v) => onChange(String(v ?? ""))}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-invalid={!!error}
          aria-describedby={
            [help && `${id}-help`, error && `${id}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className="h-11 w-full md:h-9"
        >
          <SelectValue placeholder={placeholder}>{display}</SelectValue>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Ajout d'un routeur. Un routeur appartient toujours à un site : sans site actif, on propose
 * d'abord d'en créer un. Une fois le routeur créé, la préparation du script démarre aussitôt.
 */
export function RouterCreateScreen() {
  const sites = useSites();
  const { membership } = useOrganization();
  const presetSite = useSearchParams().get("site") ?? "";

  if (!routerCapabilities(membership).canCreateRouter)
    return <InlineError error={new ApiError("http", 403)} />;
  if (sites.isPending) return <PageSkeleton />;
  if (sites.isError)
    return (
      <InlineError error={sites.error} retry={() => void sites.refetch()} />
    );

  const active = sites.data.filter((s) => s.status === "ACTIVE");
  if (active.length === 0)
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Location01Icon} aria-hidden />
          </EmptyMedia>
          <EmptyTitle>
            {sites.data.length === 0
              ? "Créez d'abord votre site"
              : "Aucun site actif pour l'instant"}
          </EmptyTitle>
          <EmptyDescription>
            {sites.data.length === 0
              ? "Un routeur est toujours rattaché à un site : l'endroit où se trouve votre Wi-Fi. Créez le site, puis revenez ajouter votre routeur."
              : "Un routeur doit être rattaché à un site actif. Réactivez l'un de vos sites ou créez-en un nouveau."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton href={routes.siteNew()}>Créer mon site</LinkButton>
          {sites.data.length > 0 ? (
            <LinkButton href={routes.sites()} variant="outline">
              Voir mes sites
            </LinkButton>
          ) : null}
        </EmptyContent>
      </Empty>
    );

  const initial =
    active.find((s) => s.id === presetSite)?.id ??
    (active.length === 1 ? active[0].id : "");
  return (
    <CreateForm
      sites={active.map((s) => ({ id: s.id, name: s.name, city: s.city }))}
      initialSite={initial}
    />
  );
}

function CreateForm({
  sites,
  initialSite,
}: {
  sites: { id: string; name: string; city: string }[];
  initialSite: string;
}) {
  const nav = useRouter();
  const { request } = useAuth();
  const { organizationId } = useOrganization();
  const mutation = useRouterChange();
  const [otherModel, setOtherModel] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = useForm<RouterCreateValues>({
    resolver: zodResolver(routerCreateSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      vendor: supportedVendor,
      model: "",
      siteId: initialSite,
    },
  });
  const errors = form.formState.errors;
  const siteId = form.watch("siteId");
  const model = form.watch("model");
  const pending = busy || mutation.isPending;

  async function save(values: RouterCreateValues) {
    setBusy(true);
    try {
      const created = await mutation.mutateAsync({ action: "create", values });
      // Le script se prépare tout de suite ; s'il échoue, la page du routeur propose de réessayer.
      try {
        await sendRouterAction(
          request,
          organizationId,
          created,
          "provision",
          crypto.randomUUID(),
        );
      } catch {
        /* repris sur la page du routeur */
      }
      toast.success("Routeur ajouté. Votre script est en préparation.");
      nav.push(routes.router(created.id));
    } catch (error) {
      setBusy(false);
      if (error instanceof ApiError && error.status === 409)
        form.setError("siteId", {
          message: "Ce site n'est plus actif. Choisissez-en un autre.",
        });
      else if (error instanceof ApiError && error.problem?.errors)
        for (const { field, message } of error.problem.errors)
          if (["name", "model", "siteId"].includes(field))
            form.setError(field as keyof RouterCreateValues, { message });
    }
  }

  const failure =
    mutation.isError &&
    !(
      mutation.error instanceof ApiError &&
      (mutation.error.status === 409 || mutation.error.problem?.errors?.length)
    )
      ? mutation.error
      : null;

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-5"
      onSubmit={(e) => void form.handleSubmit(save)(e)}
    >
      <Choice
        id="router-site"
        label="Site"
        help="L'endroit où ce routeur diffusera votre Wi-Fi."
        placeholder="Choisir un site"
        value={siteId}
        display={sites.find((s) => s.id === siteId)?.name}
        error={errors.siteId?.message}
        onChange={(v) =>
          form.setValue("siteId", v, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      >
        {sites.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name} · {s.city}
          </SelectItem>
        ))}
      </Choice>

      <Choice
        id="router-model"
        label="Modèle de votre routeur"
        help={`Ronetz fonctionne avec les routeurs ${supportedVendor}.`}
        placeholder="Choisir un modèle"
        value={otherModel ? OTHER_MODEL : model}
        display={
          otherModel ? `Autre modèle ${supportedVendor}` : model || undefined
        }
        error={otherModel ? undefined : errors.model?.message}
        onChange={(v) => {
          const other = v === OTHER_MODEL;
          setOtherModel(other);
          form.setValue("model", other ? "" : v, {
            shouldDirty: true,
            shouldValidate: !other,
          });
          if (other) form.clearErrors("model");
        }}
      >
        {routerModels.map((m) => (
          <SelectItem key={m} value={m}>
            {m}
          </SelectItem>
        ))}
        <SelectItem value={OTHER_MODEL}>
          Autre modèle {supportedVendor}
        </SelectItem>
      </Choice>
      {otherModel ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="router-model-exact" className="text-sm font-medium">
            Modèle exact
          </label>
          <p
            id="router-model-exact-help"
            className="text-sm text-muted-foreground"
          >
            Il est écrit sous le routeur, sur l&apos;étiquette.
          </p>
          <Input
            id="router-model-exact"
            className="h-11 md:h-9"
            aria-invalid={!!errors.model}
            aria-describedby="router-model-exact-help"
            {...form.register("model")}
          />
          {errors.model?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.model.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="router-name" className="text-sm font-medium">
          Nom du routeur
        </label>
        <p id="router-name-help" className="text-sm text-muted-foreground">
          Pour le reconnaître facilement. Exemple : « Accueil » ou « Salle du
          fond ».
        </p>
        <Input
          id="router-name"
          className="h-11 md:h-9"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={`router-name-help${errors.name ? " router-name-error" : ""}`}
          disabled={pending}
          {...form.register("name")}
        />
        {errors.name?.message ? (
          <p
            id="router-name-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        Ensuite, Ronetz prépare un script à installer sur votre routeur. Comptez
        environ 20 minutes en tout, une seule fois.
      </p>

      {failure ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {toUserMessage(failure)} Le routeur a peut-être été ajouté :
            vérifiez la liste avant de réessayer.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <LinkButton href={routes.routers()} variant="ghost">
          Annuler
        </LinkButton>
        <Button type="submit" className="h-11 md:h-9" disabled={pending}>
          {pending ? "Ajout en cours…" : "Ajouter le routeur"}
        </Button>
      </div>
    </form>
  );
}
