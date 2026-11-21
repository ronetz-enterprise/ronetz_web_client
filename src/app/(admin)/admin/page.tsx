"use client";

import { PlatformDashboardPage } from "@/features/platform-admin/components/dashboard";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";
import { Suspense } from "react";

export default function Page() {
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <PlatformDashboardPage session={session} />
    </Suspense>
  );
}
