"use client";

import { Suspense } from "react";
import { OrganizationsPage } from "@/features/platform-admin/components/organizations";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";

export default function Page() {
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <OrganizationsPage session={session} selectedId={null} />
    </Suspense>
  );
}
