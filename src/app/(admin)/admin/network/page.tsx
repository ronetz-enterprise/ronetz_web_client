"use client";

import { NetworkPage } from "@/features/platform-admin/components/network";
import { useAdminSession } from "@/features/platform-admin/components/admin-session";
import { Suspense } from "react";

export default function Page() {
  const session = useAdminSession();
  return (
    <Suspense fallback={null}>
      <NetworkPage session={session} />
    </Suspense>
  );
}
