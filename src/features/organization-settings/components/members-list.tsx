"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, UserIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrincipal, type Principal } from "@/features/identity";
import { organizationCapabilities } from "@/features/memberships";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import {
  actionLabel,
  memberActions,
  roleLabel,
  sortMembers,
  statusLabel,
  statusTone,
  type MemberAction,
  type OrgMember,
} from "../model/members";
import { useMemberChange, useOrganizationMembers } from "../queries/members";
import { LocalFailure, SettingsSkeleton } from "./query-feedback";
import { StatusPill } from "./status-pill";

const confirmCopy: Record<
  MemberAction,
  { title: string; body: string; done: string }
> = {
  suspend: {
    title: "Suspendre ce membre ?",
    body: "Il ne pourra plus utiliser l’organisation tant que vous ne l’aurez pas réactivé.",
    done: "Le membre est suspendu.",
  },
  reactivate: {
    title: "Réactiver ce membre ?",
    body: "Il retrouvera l’accès à l’organisation.",
    done: "Le membre est réactivé.",
  },
  revoke: {
    title: "Retirer l’accès de ce membre ?",
    body: "Il n’aura plus accès à l’organisation. Cette action ne peut pas être annulée depuis cet écran.",
    done: "L’accès du membre est retiré.",
  },
};

/** Les autres membres n'ont ni nom ni e-mail exposés : on ne montre jamais leur identifiant technique. */
function memberTitle(member: OrgMember, principal?: Principal) {
  if (principal && member.userId === principal.userId)
    return `${principal.firstName} ${principal.lastName}`.trim() || "Vous";
  return "Membre de l’équipe";
}

export function MembersList() {
  const org = useOrganization();
  const principal = usePrincipal();
  const query = useOrganizationMembers();
  const change = useMemberChange();
  const [pending, setPending] = useState<{
    member: OrgMember;
    action: MemberAction;
  } | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const capabilities = organizationCapabilities(org.membership);

  if (!capabilities.canViewMembers)
    return <LocalFailure error={new ApiError("http", 403)} />;
  if (query.isPending || principal.isPending)
    return <SettingsSkeleton rows={2} />;
  if (query.isError)
    return (
      <LocalFailure error={query.error} retry={() => void query.refetch()} />
    );

  const members = sortMembers(query.data, principal.data?.userId);

  async function confirm() {
    if (!pending) return;
    const { member, action } = pending;
    setFailure(null);
    try {
      await change.mutateAsync({ action, userId: member.userId });
      toast.success(confirmCopy[action].done);
      setPending(null);
    } catch (error) {
      setFailure(error);
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>L’invitation de collaborateurs arrive bientôt</AlertTitle>
        <AlertDescription>
          Pour l’instant, une organisation n’a qu’un propriétaire : vous.
          L’ajout d’autres personnes par e-mail sera disponible prochainement.
        </AlertDescription>
      </Alert>
      <ul
        aria-label="Membres de l’organisation"
        className="divide-y rounded-lg border bg-card"
      >
        {members.map((member) => {
          const actions = memberActions(org.membership, member, query.data);
          const available = (Object.keys(actions) as MemberAction[]).filter(
            (a) => actions[a],
          );
          const isYou = member.userId === principal.data?.userId;
          return (
            <li
              key={member.id}
              className="flex min-h-16 items-center gap-3 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={UserIcon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {memberTitle(member, principal.data)}
                  {isYou ? (
                    <span className="ml-2 text-muted-foreground">(vous)</span>
                  ) : null}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {isYou && principal.data ? `${principal.data.email} · ` : ""}
                  {roleLabel[member.role]} · depuis le{" "}
                  {formatDate(member.createdAt)}
                </p>
              </div>
              <StatusPill
                label={statusLabel[member.status]}
                tone={statusTone[member.status]}
              />
              {available.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 sm:size-9"
                        aria-label={`Actions pour ${memberTitle(member, principal.data)}`}
                      />
                    }
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      strokeWidth={1.75}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {available.map((action) => (
                      <DropdownMenuItem
                        key={action}
                        onClick={() => {
                          setFailure(null);
                          setPending({ member, action });
                        }}
                      >
                        {actionLabel[action]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </li>
          );
        })}
      </ul>
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !change.isPending) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending ? confirmCopy[pending.action].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? confirmCopy[pending.action].body : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <p role="alert" className="text-sm text-destructive">
              {toUserMessage(failure)}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={change.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={change.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              {change.isPending
                ? "En cours…"
                : pending
                  ? actionLabel[pending.action]
                  : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
