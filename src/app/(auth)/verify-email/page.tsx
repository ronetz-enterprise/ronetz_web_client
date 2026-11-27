"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";
import {
  EmailConfirmation,
  EmailPending,
} from "@/features/authentication/components/recovery-forms";

function Inner() {
  const params = useSearchParams();
  const token = params.get("token");
  if (!token)
    return (
      <AuthCard title="Confirmez votre adresse e-mail">
        <EmailPending />
      </AuthCard>
    );
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
      <EmailConfirmation token={token} />
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
