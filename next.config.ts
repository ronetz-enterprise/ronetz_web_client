import type { NextConfig } from "next";

// Cible du relais /api : variable serveur uniquement (jamais NEXT_PUBLIC_*).
// Le navigateur appelle /api sur ce domaine ; Next.js relaie vers le backend, ce qui garde
// les cookies de session (SameSite, XSRF) en first-party, comme le proxy de l'ancien front.
const apiTarget = (
  process.env.API_PROXY_TARGET ?? "http://localhost:8080"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Permet de construire ailleurs que dans .next sans gêner un serveur de développement ouvert.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
};

export default nextConfig;
