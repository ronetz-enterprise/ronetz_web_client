"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm, safeAuthDestination } from "@/features/authentication";
import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const logout = params.get("logout");
  const returnTo = safeAuthDestination(params.get("returnTo"));
  const registerHref =
    routes.register() +
    (params.get("returnTo") ? "?returnTo=" + encodeURIComponent(returnTo) : "");

  return (
    <AuthCard
      title="Connectez-vous à votre compte"
      footer={
        <>
          Nouveau sur Ronetz ?{" "}
          <Link
            href={registerHref}
            className="font-medium text-signal hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      {logout === "revoked" && (
        <p role="status" className="text-sm text-muted-foreground">
          Vous êtes déconnecté.
        </p>
      )}
      {logout === "unconfirmed" && (
        <p role="alert" className="text-sm text-muted-foreground">
          Vous êtes déconnecté de cet appareil. La fermeture de la session sur
          nos serveurs n’a pas pu être confirmée.
        </p>
      )}
      {params.get("registered") ? (
        <p
          role="status"
          className="rounded-md bg-success px-3 py-2 text-sm text-success-foreground"
        >
          Votre compte est créé. Connectez-vous pour continuer.
        </p>
      ) : null}
      <LoginForm onSuccess={() => router.replace(returnTo)} />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
