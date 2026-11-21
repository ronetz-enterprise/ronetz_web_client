import type { Metadata } from "next";
import { AccountOverview } from "@/features/authentication";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Mon compte
        </h1>
      </div>
      <AccountOverview />
    </>
  );
}
