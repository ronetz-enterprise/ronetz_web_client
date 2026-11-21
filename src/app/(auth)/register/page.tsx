"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm, safeAuthDestination } from "@/features/authentication";
import { routes } from "@/lib/routes";
import { AuthCard } from "@/features/authentication/components/auth-card";

function RegisterPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeAuthDestination(params.get("returnTo"));
  const loginHref =
    routes.login() + "?returnTo=" + encodeURIComponent(returnTo);

  return (
    <AuthCard
      title="Créez votre compte Ronetz"
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link
            href={loginHref}
            className="font-medium text-signal hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm
        onSuccess={() => router.replace(loginHref + "&registered=1")}
      />
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
