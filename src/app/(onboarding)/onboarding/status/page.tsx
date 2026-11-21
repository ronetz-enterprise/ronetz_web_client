"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CreationResult, useCreationAttempt } from "@/features/onboarding";
import { OnboardingBody } from "@/features/onboarding/components/onboarding-frame";
import { routes } from "@/lib/routes";

export default function OnboardingStatusPage() {
  const attempt = useCreationAttempt();
  const router = useRouter();

  useEffect(() => {
    if (
      attempt.status !== "created" &&
      attempt.status !== "unknown" &&
      attempt.status !== "creating"
    )
      router.replace(routes.onboardingOrg());
  }, [attempt.status, router]);

  return (
    <OnboardingBody>
      <CreationResult />
    </OnboardingBody>
  );
}
