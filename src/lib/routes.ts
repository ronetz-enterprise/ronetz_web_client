/**
 * Toutes les adresses de l'application, en un seul endroit.
 *
 * Règles :
 * - Pas d'orgId dans les URLs de la console gérant (l'organisation est en session).
 * - Les fonctions reçoivent des IDs bruts (string) ; la validation UUID appartient aux couches API.
 * - Ce fichier n'importe rien : il est utilisable côté serveur et côté client.
 */
export const routes = {
  // ── Parcours achat public ─────────────────────────────────────────────────
  connect: (siteId: string) => `/connect/${siteId}`,
  connectOffer: (siteId: string, offerId: string) =>
    `/connect/${siteId}/offers/${offerId}`,
  connectPurchase: (siteId: string, purchaseId: string) =>
    `/connect/${siteId}/purchases/${purchaseId}`,

  // ── Pages publiques ───────────────────────────────────────────────────────
  home: () => `/`,
  portal: () => `/portal`,
  forbidden: () => `/forbidden`,

  // ── Authentification ──────────────────────────────────────────────────────
  login: () => `/login`,
  register: () => `/register`,
  sessionExpired: () => `/session-expired`,
  account: () => `/account`,

  // ── Onboarding ────────────────────────────────────────────────────────────
  onboardingOrg: () => `/onboarding/organization`,
  onboardingStatus: () => `/onboarding/status`,
  selectOrg: () => `/organizations/select`,

  // ── Console gérant ────────────────────────────────────────────────────────
  dashboard: () => `/dashboard`,

  sites: () => `/sites`,
  siteNew: () => `/sites/new`,
  site: (siteId: string) => `/sites/${siteId}`,
  siteRouters: (siteId: string) => `/sites/${siteId}/routers`,
  siteSettings: (siteId: string) => `/sites/${siteId}/settings`,
  siteOffers: (siteId: string) => `/sites/${siteId}/offers`,
  siteOfferNew: (siteId: string) => `/sites/${siteId}/offers/new`,

  routers: () => `/routers`,
  routerNew: () => `/routers/new`,
  router: (routerId: string) => `/routers/${routerId}`,
  routerSettings: (routerId: string) => `/routers/${routerId}/settings`,

  access: () => `/access`,
  accessGrant: (accessGrantId: string) => `/access/${accessGrantId}`,

  offers: () => `/offers`,
  offer: (offerId: string) => `/offers/${offerId}`,
  offerPricing: (offerId: string) => `/offers/${offerId}/pricing`,
  offerPresentation: (offerId: string) => `/offers/${offerId}/presentation`,

  finance: () => `/finance`,
  usage: () => `/usage`,
  organization: () => `/organization`,

  settingsGeneral: () => `/settings/general`,
  settingsMembers: () => `/settings/members`,

  // ── Administration plateforme ─────────────────────────────────────────────
  admin: () => `/admin`,
  adminOrgs: () => `/admin/organizations`,
  adminOrg: (orgId: string) => `/admin/organizations/${orgId}`,
  adminNetwork: () => `/admin/network`,
  adminFinance: () => `/admin/finance`,
  adminAudit: () => `/admin/audit`,
} as const;
