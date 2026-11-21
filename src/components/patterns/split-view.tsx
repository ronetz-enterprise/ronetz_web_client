"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Élément sélectionné, porté par l'adresse (`?acces=…`) : le lien se partage,
 * le bouton « retour » du navigateur ferme le panneau.
 */
export function useSelectedParam(name: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get(name);

  const set = React.useCallback(
    (next: string | null) => {
      const p = new URLSearchParams(params.toString());
      if (next) p.set(name, next);
      else p.delete(name);
      const qs = p.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      // Ouvrir ajoute une entrée d'historique ; fermer ou changer d'élément la remplace.
      if (next && !value) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [name, params, pathname, router, value],
  );

  return [value, set] as const;
}

/**
 * Liste à gauche, détail poussé à droite (≥ 1024 px : le contenu se décale, pas de voile).
 * Sur téléphone, le détail prend tout l'écran avec un bouton « Retour ».
 * Échap ferme ; le focus passe au panneau à l'ouverture et revient à la ligne à la fermeture.
 */
export function SplitView({
  list,
  detail,
  open,
  onClose,
  detailLabel,
  className,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  open: boolean;
  onClose: () => void;
  /** Nom accessible du panneau, ex. « Détail de l'accès ». */
  detailLabel: string;
  className?: string;
}) {
  const panelRef = React.useRef<HTMLElement>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    if (open && !wasOpen.current) {
      returnTo.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    }
    if (!open && wasOpen.current) {
      const el = returnTo.current;
      if (el && document.contains(el)) el.focus();
      returnTo.current = null;
    }
    wasOpen.current = open;
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Plein écran sur téléphone : la page dessous ne défile pas.
  React.useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const prev = document.body.style.overflow;
    if (mq.matches) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      data-slot="split-view"
      className={cn("flex items-start gap-6", className)}
    >
      <div className="min-w-0 flex-1">{list}</div>
      {open ? (
        <aside
          ref={panelRef}
          tabIndex={-1}
          aria-label={detailLabel}
          className={cn(
            "flex flex-col overflow-y-auto bg-background outline-none",
            "fixed inset-0 z-50",
            "lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:w-[26rem] lg:shrink-0 lg:rounded-xl lg:border lg:border-border xl:w-[30rem]",
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-2 py-1.5">
            <Button
              variant="ghost"
              className="h-11 px-3 lg:hidden"
              onClick={onClose}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden />
              Retour
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto hidden size-9 lg:inline-flex"
              onClick={onClose}
              aria-label="Fermer le panneau"
            >
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden />
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-6 p-4 lg:p-5">{detail}</div>
        </aside>
      ) : null}
    </div>
  );
}
