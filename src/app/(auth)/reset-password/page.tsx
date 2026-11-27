"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";
import { ResetPasswordForm } from "@/features/authentication/components/recovery-forms";

function Inner() {
  const params = useSearchParams();
  return (
    <AuthCard
      title="Choisissez un nouveau mot de passe"
      footer={
        <Link
          href={routes.login()}
          className="font-medium text-signal hover:underline"
        >
          Retour à la connexion
        </Link>
      }
    >
      <ResetPasswordForm token={params.get("token")} />
    </AuthCard>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
