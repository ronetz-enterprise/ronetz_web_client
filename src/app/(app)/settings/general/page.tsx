import type { Metadata } from "next";
import { OrganizationForm } from "@/features/organization-settings/components/organization-form";

export const metadata: Metadata = { title: "Réglages généraux" };

export default function GeneralSettingsPage() {
  return <OrganizationForm />;
}
