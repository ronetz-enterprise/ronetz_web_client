"use client";

import { Suspense, use } from "react";
import { OrganizationsPage } from "@/features/platform-admin/components/organizations";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";

export default function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = use(params);
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <OrganizationsPage session={session} selectedId={organizationId} />
    </Suspense>
  );
}
