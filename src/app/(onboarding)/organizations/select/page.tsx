"use client";

import Link from "next/link";
import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { OrganizationSelection } from "@/features/organizations";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function SelectOrganizationPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Mes organisations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez l'organisation à gérer.
        </p>
      </div>
      <OrganizationSelection />
      <Button
        variant="outline"
        className="h-11 w-full"
        render={<Link href={routes.onboardingOrg()} />}
      >
        <HugeiconsIcon
          icon={Add01Icon}
          strokeWidth={1.75}
          data-icon="inline-start"
        />
        Créer une organisation
      </Button>
    </>
  );
}
