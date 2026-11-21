"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeAuthDestination, useAuth } from "@/features/authentication";
import { routes } from "@/lib/routes";

function SessionExpiredPageInner() {
  const params = useSearchParams();
  const auth = useAuth();
  const router = useRouter();
  const destination = safeAuthDestination(params.get("returnTo"));

  useEffect(() => {
    if (auth.status === "authenticated" || auth.status === "refreshing")
      router.replace(destination);
  }, [auth.status, destination, router]);

  return (
    <>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Session terminée
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La session n'est plus disponible. Reconnectez-vous pour continuer.
        </p>
      </div>
      <Button
        className="h-11 w-full"
        render={
          <Link
            href={
              routes.login() + "?returnTo=" + encodeURIComponent(destination)
            }
          />
        }
      >
        Se reconnecter
      </Button>
    </>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense>
      <SessionExpiredPageInner />
    </Suspense>
  );
}
