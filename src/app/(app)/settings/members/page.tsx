import type { Metadata } from "next";
import { MembersList } from "@/features/organization-settings/components/members-list";

export const metadata: Metadata = { title: "Membres" };

export default function MembersSettingsPage() {
  return <MembersList />;
}
