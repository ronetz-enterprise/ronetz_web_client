import type { Metadata } from "next";
import { Suspense } from "react";
import { FinancePage } from "@/features/finance/components/finance-page";

export const metadata: Metadata = { title: "Finances" };

export default function Page() {
  return (
    <Suspense>
      <FinancePage />
    </Suspense>
  );
}
