import type { Metadata } from "next";
import { Suspense } from "react";

import { AccessList } from "@/features/access";

export const metadata: Metadata = { title: "Accès" };

export default function Page() {
  return (
    <main className="w-full">
      <Suspense fallback={null}>
        <AccessList />
      </Suspense>
    </main>
  );
}
