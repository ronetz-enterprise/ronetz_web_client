"use client";

import { AuditPage } from "@/features/platform-admin/components/audit";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";
import { Suspense } from "react";

export default function Page() {
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <AuditPage session={session} />
    </Suspense>
  );
}
