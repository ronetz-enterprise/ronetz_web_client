"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";
import { EmailConfirmation } from "@/features/authentication/components/recovery-forms";

function Inner() {
  const params = useSearchParams();
  return (
    <AuthCard
      title="Confirmation de votre adresse"
      footer={
        <Link
          href={routes.login()}
          className="font-medium text-signal hover:underline"
        >
          Retour à la connexion
        </Link>
      }
    >
      <EmailConfirmation token={params.get("token")} />
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
