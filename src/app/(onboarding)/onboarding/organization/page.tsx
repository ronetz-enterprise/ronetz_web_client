"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CreateOrganizationForm,
  useCreationAttempt,
} from "@/features/onboarding";
import { OnboardingQuestion } from "@/features/onboarding/components/onboarding-frame";
import { routes } from "@/lib/routes";

export default function CreateOrganizationPage() {
  const attempt = useCreationAttempt();
  const router = useRouter();

  useEffect(() => {
    if (attempt.status === "created" || attempt.status === "unknown")
      router.replace(routes.onboardingStatus());
  }, [attempt.status, router]);

  return (
    <CreateOrganizationForm
      heading={
        <OnboardingQuestion title="Présentez votre organisation.">
          Deux réponses suffisent pour commencer à vendre.
        </OnboardingQuestion>
      }
    />
  );
}
