"use client";

import { Suspense } from "react";
import Link from "next/link";

import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";
import { ForgotPasswordForm } from "@/features/authentication/components/recovery-forms";

function Inner() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      footer={
        <Link
          href={routes.login()}
          className="font-medium text-signal hover:underline"
        >
          Retour à la connexion
        </Link>
      }
    >
      <ForgotPasswordForm />
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
