"use client";

import { FinancePage } from "@/features/platform-admin/components/finance";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";
import { Suspense } from "react";

export default function Page() {
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <FinancePage session={session} />
    </Suspense>
  );
}
