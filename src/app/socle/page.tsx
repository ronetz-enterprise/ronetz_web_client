import { notFound } from "next/navigation";
import { config } from "@/config/environment";
import { SocleCheck } from "./socle-check";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnostic du socle" };

// Page de diagnostic (hors production) : prouve que le serveur Next.js et le navigateur
// atteignent bien le backend, côté serveur directement et côté navigateur par le relais /api.
export default async function SoclePage() {
  if (config.appEnv === "production") notFound();
  const target = (
    process.env.API_PROXY_TARGET ?? "http://localhost:8080"
  ).replace(/\/+$/, "");
  let server: { ok: boolean; detail: string };
  try {
    const res = await fetch(`${target}/actuator/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    server = { ok: res.ok, detail: `HTTP ${res.status}` };
  } catch {
    server = {
      ok: false,
      detail: "backend injoignable depuis le serveur Next.js",
    };
  }
  return (
    <main
      style={{
        padding: "3rem 1.5rem",
        maxWidth: 720,
        margin: "0 auto",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <h1>Diagnostic du socle</h1>
      <section>
        <h2>Serveur Next.js vers le backend</h2>
        <p data-testid="server-status">
          {server.ok ? "Joignable" : "Injoignable"} · {server.detail}
        </p>
      </section>
      <SocleCheck />
    </main>
  );
}
