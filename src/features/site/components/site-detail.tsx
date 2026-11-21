"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/patterns/row-card-list";
import { DetailHeader } from "@/components/patterns/settings-page";
import {
  RecordNotice,
  RecordPage,
  RecordSection,
} from "@/components/patterns/record-page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { RoutersView } from "@/features/router/components/router-list";
import { useRouterList } from "@/features/router/queries/routers";
import { routerState } from "@/features/router/model/router";
import { formatDate, formatRelative } from "@/lib/format";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAccessOffers,
  useSiteAccessGrants,
} from "@/features/access/queries/access-grants";
import { formatPrice } from "@/features/offer/formatters/offer";
import { routes } from "@/lib/routes";
import {
  siteCapabilities,
  siteLocation,
  siteStatusLabels,
  siteTone,
  type Site,
  type SiteAction,
} from "../model/site";
import { useSite, useSiteChange } from "../queries/sites";
import { InlineError, LinkButton, PageSkeleton } from "./feedback";
import { SiteForm } from "./site-form";
import {
  downloadText,
  hotspotLoginHtml,
  walledGardenScript,
} from "../lib/hotspot-files";

/**
 * Coque des pages d'un site. La fiche se lit d'une traite ; les réglages et la liste complète
 * des routeurs sont des sous-pages, ouvertes depuis « ⋯ » ou depuis la fiche.
 */
export function SiteShell({
  siteId,
  sub,
  children,
}: {
  siteId: string;
  /** Sous-page : titre affiché après le nom du site dans le fil d'Ariane. */
  sub?: string;
  children: (site: Site) => ReactNode;
}) {
  const query = useSite(siteId);
  const { membership } = useOrganization();
  if (query.isPending) return <PageSkeleton />;
  if (query.isError)
    return (
      <>
        <PageHeader
          title="Site"
          back={
            <LinkButton href={routes.sites()} variant="ghost">
              ← Mes sites
            </LinkButton>
          }
        />
        <InlineError error={query.error} retry={() => void query.refetch()} />
      </>
    );
  const site = query.data;
  const caps = siteCapabilities(membership, site);
  // La fiche elle-même porte son en-tête (modèle Stripe) ; les sous-pages gardent celui-ci.
  if (!sub) return <>{children(site)}</>;
  return (
    <div className="flex flex-col gap-8">
      <DetailHeader
        back={
          sub
            ? { href: routes.site(site.id), label: site.name }
            : { href: routes.sites(), label: "Sites" }
        }
        title={sub ?? site.name}
        actions={
          sub ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-9"
                    aria-label="Autres actions"
                  />
                }
              >
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={<Link href={routes.siteSettings(site.id)} />}
                >
                  {caps.canEditSite ? "Modifier ou suspendre" : "Réglages"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href={routes.connect(site.id)} />}
                >
                  Voir la page de vente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold break-words">
            {sub ? `${sub} · ${site.name}` : site.name}
          </h1>
          <StatusPill
            label={siteStatusLabels[site.status]}
            tone={siteTone(site.status)}
          />
        </div>
        {siteLocation(site) ? (
          <p className="text-sm text-muted-foreground">{siteLocation(site)}</p>
        ) : null}
      </div>
      {site.status === "SUSPENDED" ? (
        <Alert>
          <AlertTitle>Ce site est suspendu</AlertTitle>
          <AlertDescription>
            Vos clients ne peuvent plus acheter d&apos;accès ici. Réactivez-le
            dans les réglages.
          </AlertDescription>
        </Alert>
      ) : null}
      {children(site)}
    </div>
  );
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

/**
 * Fiche d'un site, une seule colonne : d'abord ce qui se lit chaque jour (chiffres, routeurs,
 * offres), en dernier ce qui ne sert qu'une fois (l'installation, repliée).
 */
export function SiteOverview({ site }: { site: Site }) {
  const routers = useRouterList(0);
  const grants = useSiteAccessGrants(site.id);
  const offers = useAccessOffers(site.id);
  const mine = (routers.data?.content ?? []).filter(
    (r) => r.siteId === site.id && r.lifecycleStatus !== "REVOKED",
  );
  const online = mine.filter((r) => routerState(r).kind === "online").length;
  const canAdd = site.status === "ACTIVE";
  const list = grants.data ?? [];
  // Référence de temps prise au moment de la lecture des accès, pas à chaque rendu.
  const now = grants.dataUpdatedAt;
  const active = list.filter((g) => g.status === "ACTIVE").length;
  const week = list.filter(
    (g) => now - new Date(g.issuedAt).getTime() < WEEK_MS,
  ).length;
  const last = list[0]?.issuedAt;
  const wait = (q: { isPending: boolean; isError: boolean }, v: ReactNode) =>
    q.isPending ? "…" : q.isError ? "—" : v;

  const { membership } = useOrganization();
  const caps = siteCapabilities(membership, site);

  return (
    <RecordPage
      back={{ href: routes.sites(), label: "Sites" }}
      title={site.name}
      status={
        <StatusPill
          label={siteStatusLabels[site.status]}
          tone={siteTone(site.status)}
        />
      }
      subtitle={siteLocation(site) || undefined}
      actions={
        <>
          {canAdd ? (
            <LinkButton
              variant="outline"
              href={`${routes.routerNew()}?site=${site.id}`}
            >
              Ajouter un routeur
            </LinkButton>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 sm:size-9"
                  aria-label="Autres actions"
                />
              }
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                strokeWidth={1.75}
                aria-hidden
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link href={routes.siteSettings(site.id)} />}
              >
                {caps.canEditSite ? "Modifier ou suspendre" : "Réglages"}
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href={routes.connect(site.id)} />}
              >
                Voir la page de vente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
      notice={
        site.status === "SUSPENDED" ? (
          <RecordNotice tone="danger" title="Ce site est suspendu">
            Vos clients ne peuvent plus acheter d’accès ici. Réactivez-le dans
            les réglages.
          </RecordNotice>
        ) : undefined
      }
      details={[
        { label: "Ville", value: siteLocation(site) || "—" },
        {
          label: "Routeurs en ligne",
          value: wait(routers, `${online} sur ${mine.length}`),
        },
        { label: "Accès actifs", value: wait(grants, active) },
        { label: "Vendus sur 7 jours", value: wait(grants, week) },
        {
          label: "Dernière vente",
          value: wait(grants, last ? formatRelative(last) : "Aucune"),
        },
        { label: "Créé le", value: formatDate(site.createdAt) },
      ]}
    >
      <RecordSection
        title="Routeurs"
        action={
          canAdd ? (
            <Link
              href={`${routes.routerNew()}?site=${site.id}`}
              aria-label="Ajouter un routeur"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            </Link>
          ) : null
        }
      >
        {routers.isPending ? (
          <Skeleton className="h-20" />
        ) : mine.length === 0 ? (
          <RecordEmpty>Aucun routeur</RecordEmpty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="h-8 text-left text-xs font-semibold">Routeur</th>
                <th className="h-8 text-left text-xs font-semibold">État</th>
                <th className="hidden h-8 text-right text-xs font-semibold sm:table-cell">
                  Dernier signal
                </th>
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => {
                const st = routerState(r, new Date(), site.timezone);
                return (
                  <tr key={r.id} className="border-b border-border">
                    <td className="h-11">
                      <Link
                        href={routes.router(r.id)}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="h-11">
                      <StatusPill label={st.label} tone={st.tone} />
                    </td>
                    <td className="hidden h-11 text-right text-muted-foreground sm:table-cell">
                      {r.lastSeenAt ? formatRelative(r.lastSeenAt) : "Aucun"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </RecordSection>

      <RecordSection
        title="Offres en vente"
        action={
          <Link
            href={routes.siteOffers(site.id)}
            className="text-sm font-medium text-signal hover:underline"
          >
            Gérer les offres
          </Link>
        }
      >
        {offers.isPending ? (
          <Skeleton className="h-10" />
        ) : !offers.data?.length ? (
          <RecordEmpty>Aucune offre en vente</RecordEmpty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="h-8 text-left text-xs font-semibold">Offre</th>
                <th className="h-8 text-right text-xs font-semibold">Prix</th>
              </tr>
            </thead>
            <tbody>
              {offers.data.map((o) => (
                <tr key={o.offerId} className="border-b border-border">
                  <td className="h-11 font-medium">{o.name}</td>
                  <td className="h-11 text-right font-medium tabular-nums">
                    {formatPrice(String(o.price.amount), o.price.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RecordSection>

      {site.status === "ACTIVE" ? (
        <RecordSection title="Page de vente">
          <p className="text-sm text-muted-foreground">
            Partagez ce lien : vos clients y achètent leur accès par Mobile
            Money.
          </p>
          <PortalLink siteId={site.id} />
        </RecordSection>
      ) : null}

      <RecordSection title="Page de connexion du Wi-Fi">
        <HotspotKit site={site} />
      </RecordSection>
    </RecordPage>
  );
}

/** Vide : cadre en pointillés, comme « Aucun abonnement » chez Stripe. */
function RecordEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-20 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Fichiers à poser sur le routeur : la page de connexion (logo, identifiant, bouton « Acheter un
 * accès » vers la page de vente du site) et le script qui ouvre le site Ronetz avant connexion.
 */
function HotspotKit({ site }: { site: Site }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        Remplacez la page de connexion de votre routeur par celle de Ronetz :
        vos clients y saisissent leur identifiant, ou achètent un accès en un
        clic. Le script laisse vos clients ouvrir la page d’achat avant d’être
        connectés.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="h-11 sm:h-9"
          onClick={() =>
            downloadText("login.html", hotspotLoginHtml(site), "text/html")
          }
        >
          Télécharger la page de connexion
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-9"
          onClick={() =>
            downloadText(
              "ronetz-walled-garden.rsc",
              walledGardenScript(site),
              "text/plain",
            )
          }
        >
          Télécharger le script d’accès au site
        </Button>
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-muted-foreground">
        <li>
          Dans WinBox, ouvrez <strong>Files</strong> et déposez{" "}
          <code className="font-mono text-foreground">login.html</code> dans le
          dossier <code className="font-mono text-foreground">hotspot</code>, en
          remplaçant l’ancien fichier.
        </li>
        <li>
          Déposez aussi{" "}
          <code className="font-mono text-foreground">
            ronetz-walled-garden.rsc
          </code>
          , puis dans <strong>New Terminal</strong> tapez{" "}
          <code className="font-mono text-foreground">
            /import file-name=ronetz-walled-garden.rsc
          </code>
          .
        </li>
        <li>
          Connectez un téléphone au Wi-Fi : la page Ronetz s’affiche, et le
          bouton « Acheter un accès » ouvre la page de vente.
        </li>
      </ol>
    </div>
  );
}

function PortalLink({ siteId }: { siteId: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const url =
    typeof window === "undefined"
      ? routes.connect(siteId)
      : `${window.location.origin}${routes.connect(siteId)}`;
  return (
    <div className="flex flex-col gap-2">
      <code className="block rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all select-all">
        {url}
      </code>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="h-11 md:h-9"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setState("done");
            } catch {
              setState("failed");
            }
          }}
        >
          {state === "done" ? "Lien copié" : "Copier le lien"}
        </Button>
        <LinkButton href={routes.connect(siteId)} variant="ghost">
          Voir la page
        </LinkButton>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {state === "failed"
          ? "Copie impossible : sélectionnez le lien et copiez-le à la main."
          : ""}
      </p>
    </div>
  );
}

export function SiteRoutersTab({ site }: { site: Site }) {
  return <RoutersView siteId={site.id} />;
}

const ACTION_COPY: Record<
  SiteAction,
  { title: string; text: string; button: string; done: string }
> = {
  suspend: {
    title: "Suspendre le site",
    text: "Vos clients ne pourront plus acheter d'accès ici. Vous pourrez le réactiver.",
    button: "Suspendre",
    done: "Site suspendu.",
  },
  reactivate: {
    title: "Réactiver le site",
    text: "Vos clients pourront de nouveau acheter des accès ici.",
    button: "Réactiver",
    done: "Site réactivé.",
  },
  close: {
    title: "Fermer le site",
    text: "Le site est fermé définitivement. On ne peut pas revenir en arrière.",
    button: "Fermer le site",
    done: "Site fermé.",
  },
};

export function SiteSettings({ site }: { site: Site }) {
  const { membership } = useOrganization();
  const caps = siteCapabilities(membership, site);
  const mutation = useSiteChange();
  const [selection, setSelection] = useState<SiteAction | null>(null);
  const available = (["suspend", "reactivate", "close"] as const).filter(
    (a) => caps[a],
  );

  async function confirm() {
    if (!selection) return;
    const done = ACTION_COPY[selection].done;
    try {
      await mutation.mutateAsync({ action: selection, site });
      toast.success(done);
      setSelection(null);
    } catch {
      /* l'erreur s'affiche dans la fenêtre */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {caps.canEditSite ? (
        <section aria-labelledby="site-infos" className="flex flex-col gap-4">
          <h2 id="site-infos" className="text-base font-semibold">
            Informations du site
          </h2>
          <SiteForm
            site={site}
            submitLabel="Enregistrer"
            onDone={() => toast.success("Site mis à jour.")}
          />
        </section>
      ) : (
        <Alert>
          <AlertTitle>Lecture seule</AlertTitle>
          <AlertDescription>
            {site.status === "CLOSED"
              ? "Ce site est fermé : il ne peut plus être modifié."
              : "Seul le propriétaire de l'organisation peut modifier ce site."}
          </AlertDescription>
        </Alert>
      )}

      {available.length > 0 ? (
        <section aria-labelledby="site-manage" className="flex flex-col gap-3">
          <h2 id="site-manage" className="text-base font-semibold">
            Gérer le site
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {available.map((a) => (
              <li
                key={a}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ACTION_COPY[a].title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ACTION_COPY[a].text}
                  </p>
                </div>
                <Button
                  variant={a === "close" ? "destructive" : "outline"}
                  className="h-11 shrink-0 md:h-9"
                  onClick={() => {
                    mutation.reset();
                    setSelection(a);
                  }}
                >
                  {ACTION_COPY[a].button}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setSelection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection ? ACTION_COPY[selection].title : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {site.name}. {selection ? ACTION_COPY[selection].text : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mutation.isError ? (
            <InlineError
              error={mutation.error}
              title="La demande n'a pas abouti"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              variant={selection === "close" ? "destructive" : "default"}
              className="h-11 md:h-9"
              disabled={mutation.isPending}
              onClick={() => void confirm()}
            >
              {mutation.isPending
                ? "Envoi…"
                : selection
                  ? ACTION_COPY[selection].button
                  : "Confirmer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Écran complet d'un site, côté client : la page serveur ne passe qu'un identifiant et un onglet. */
export function SiteScreen({
  siteId,
  tab,
}: {
  siteId: string;
  tab: "overview" | "routers" | "settings";
}) {
  return (
    <SiteShell
      siteId={siteId}
      sub={
        tab === "routers"
          ? "Routeurs"
          : tab === "settings"
            ? "Réglages"
            : undefined
      }
    >
      {(site) =>
        tab === "routers" ? (
          <SiteRoutersTab site={site} />
        ) : tab === "settings" ? (
          <SiteSettings site={site} />
        ) : (
          <SiteOverview site={site} />
        )
      }
    </SiteShell>
  );
}
