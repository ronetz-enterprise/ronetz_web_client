"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOfferChange } from "../hooks/use-offers";
import { offerErrorMessage } from "../model/errors";
import {
  actionImpacts,
  actionLabels,
  type AdminOffer,
  type OfferAction,
} from "../model/admin";

/** Mettre en vente / en pause / remettre en vente (action principale) ; archiver passe par « ⋯ ». */
export function OfferActions({
  offer,
  allowed,
}: {
  offer: AdminOffer;
  allowed: Record<OfferAction, boolean>;
}) {
  const [action, setAction] = useState<OfferAction | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const mutation = useOfferChange();
  const available = (Object.keys(actionLabels) as OfferAction[]).filter(
    (a) => allowed[a],
  );
  if (!available.length) return null;
  const primary = available.find((a) => a !== "archive");
  const others = available.filter((a) => a !== primary);

  function open(next: OfferAction) {
    setFailure(null);
    setAction(next);
  }
  async function confirm() {
    if (!action) return;
    try {
      await mutation.mutateAsync({ action, offer });
      setAction(null);
      toast.success("Offre mise à jour");
    } catch (error) {
      setFailure(offerErrorMessage(error));
    }
  }
  return (
    <>
      {primary ? (
        <Button
          variant={primary === "suspend" ? "outline" : "default"}
          className="h-11 sm:h-9"
          disabled={mutation.isPending}
          onClick={() => open(primary)}
        >
          {actionLabels[primary]}
        </Button>
      ) : null}
      {others.length ? (
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
            {others.map((a) => (
              <DropdownMenuItem
                key={a}
                variant={a === "archive" ? "destructive" : undefined}
                onClick={() => open(a)}
              >
                {actionLabels[a]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <AlertDialog
        open={!!action}
        onOpenChange={(o) => {
          if (!o && !mutation.isPending) setAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action ? `${actionLabels[action]} : ${offer.name}` : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action ? actionImpacts[action] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirm();
              }}
            >
              {mutation.isPending
                ? "En cours…"
                : action
                  ? actionLabels[action]
                  : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
