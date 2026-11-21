import type { Metadata } from "next";
import { Suspense } from "react";

import { AccessDemo } from "./access-demo";

export const metadata: Metadata = { title: "Gabarit · Accès" };

export default function Page() {
  return (
    <main className="w-full">
      <Suspense fallback={null}>
        <AccessDemo />
      </Suspense>
    </main>
  );
}
