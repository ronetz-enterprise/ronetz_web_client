"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { useAuth } from "../hooks/auth-provider";
import { usePrincipal } from "@/features/identity";

export function SessionMenu() {
  const auth = useAuth();
  const principal = usePrincipal();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-w-0 space-y-2 text-sm group-data-[collapsible=icon]:hidden">
      <p className="break-all">{principal.data?.email ?? auth.loginEmail}</p>
      <Link className="block underline" href={routes.account()}>
        Mon compte
      </Link>
      <Button
        variant="outline"
        className="text-foreground"
        disabled={busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          void auth
            .logout()
            .then((result) =>
              router.replace(routes.login() + "?logout=" + result.server),
            );
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}
