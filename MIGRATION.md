# Migration React Router → Next.js — Phase 0

_Rédigé le 2026-11-16. Ce document fait autorité sur les adresses et l'ordre de migration jusqu'à la bascule._

---

## 1. Décisions structurelles

| Sujet | Décision |
|---|---|
| Organisation dans l'URL | Non. L'organisation active est dans la session (option A). |
| Préfixe auth | Aplati : `/login`, `/register`, `/session-expired`. |
| Administration plateforme | Préfixe `/admin` (ancien `/platform-admin`). |
| Routes legacy (anciens URLs offres) | Abandonnées, pas de redirection. |
| Parcours achat public | Adresses conservées : `/connect/:siteId`, `/connect/:siteId/offers/:offerId`, `/connect/:siteId/purchases/:purchaseId`. |
| Rendu serveur | Activé sur les trois pages publiques (`/connect/*`) et la page d'accueil (`/dashboard`). Toutes les autres pages restent client-only (`"use client"`). |

---

## 2. Table des 51 routes

### Légende

- **RSC** : rendu serveur activé sur cette page (async Server Component, `fetch` depuis le serveur).
- **Guard** : vérification effectuée dans le layout Next.js le plus proche (cookies → redirect).
- **Priorité** : ordre absolu de migration, 1 = premier.

### 2.1 Parcours achat public — Phase 3

| # | Ancienne adresse (React Router) | Nouvelle adresse (Next.js) | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 1 | `/connect/:siteId` | `/connect/[siteId]` | `app/connect/[siteId]/page.tsx` | ✓ | — |
| 2 | `/connect/:siteId/offers/:offerId` | `/connect/[siteId]/offers/[offerId]` | `app/connect/[siteId]/offers/[offerId]/page.tsx` | ✓ | — |
| 3 | `/connect/:siteId/purchases/:purchaseId` | `/connect/[siteId]/purchases/[purchaseId]` | `app/connect/[siteId]/purchases/[purchaseId]/page.tsx` | — | — |

Layout partagé : `app/connect/[siteId]/layout.tsx` (barre de progression d'achat, header léger).

### 2.2 Pages publiques — Phase 3

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 4 | `/` | `/` | `app/(public)/page.tsx` | — | — |
| 5 | `/public` | `/portal` | `app/(public)/portal/page.tsx` | — | — |
| 6 | `/forbidden` | `/forbidden` | `app/(public)/forbidden/page.tsx` | — | — |

### 2.3 Authentification — Phase 4 (début)

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 7 | `/auth/login` | `/login` | `app/(auth)/login/page.tsx` | — | public-only |
| 8 | `/auth/register` | `/register` | `app/(auth)/register/page.tsx` | — | public-only |
| 9 | `/auth/session-expired` | `/session-expired` | `app/(auth)/session-expired/page.tsx` | — | — |
| 10 | `/account` | `/account` | `app/(auth)/account/page.tsx` | — | authenticated |

Layout partagé : `app/(auth)/layout.tsx` (fond centré, logo, largeur contrainte).

### 2.4 Onboarding — Phase 4 (démarrage)

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 11 | `/onboarding/organization` | `/onboarding/organization` | `app/(onboarding)/onboarding/organization/page.tsx` | — | authenticated |
| 12 | `/onboarding/status` | `/onboarding/status` | `app/(onboarding)/onboarding/status/page.tsx` | — | authenticated |
| 13 | `/organizations/select` | `/organizations/select` | `app/(onboarding)/organizations/select/page.tsx` | — | authenticated |

### 2.5 Console gérant — Phase 4

L'organisation active est lue depuis les cookies de session. Toutes ces routes exigent une session authentifiée avec une organisation sélectionnée.

Layout partagé : `app/(app)/layout.tsx` → `AppShell` avec navigation et barre du haut.

#### Démarrage

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 14 | `/app/:org` (index) | `/dashboard` | `app/(app)/dashboard/page.tsx` | ✓ | org |

#### Sites

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 15 | `/app/:org/sites` | `/sites` | `app/(app)/sites/page.tsx` | — | org |
| 16 | `/app/:org/sites/new` | `/sites/new` | `app/(app)/sites/new/page.tsx` | — | org |
| 17 | `/app/:org/sites/:siteId` | `/sites/[siteId]` | `app/(app)/sites/[siteId]/page.tsx` | — | org |
| 18 | `/app/:org/sites/:siteId/routers` | `/sites/[siteId]/routers` | `app/(app)/sites/[siteId]/routers/page.tsx` | — | org |
| 19 | `/app/:org/sites/:siteId/settings` | `/sites/[siteId]/settings` | `app/(app)/sites/[siteId]/settings/page.tsx` | — | org |

#### Routeurs

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 20 | `/app/:org/routers` | `/routers` | `app/(app)/routers/page.tsx` | — | org |
| 21 | `/app/:org/routers/new` | `/routers/new` | `app/(app)/routers/new/page.tsx` | — | org |
| 22 | `/app/:org/routers/:routerId` | `/routers/[routerId]` | `app/(app)/routers/[routerId]/page.tsx` | — | org |
| 23 | `/app/:org/routers/:routerId/settings` | `/routers/[routerId]/settings` | `app/(app)/routers/[routerId]/settings/page.tsx` | — | org |

#### Accès

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 24 | `/app/:org/access` | `/access` | `app/(app)/access/page.tsx` | — | org |
| 25 | `/app/:org/access/new` | `/access/new` | `app/(app)/access/new/page.tsx` | — | org |
| 26 | `/app/:org/access/:accessGrantId` | `/access/[accessGrantId]` | `app/(app)/access/[accessGrantId]/page.tsx` | — | org |

#### Offres

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 27 | `/app/:org/offers` | `/offers` | `app/(app)/offers/page.tsx` | — | org |
| 28 | `/app/:org/sites/:siteId/offers` | `/sites/[siteId]/offers` | `app/(app)/sites/[siteId]/offers/page.tsx` | — | org |
| 29 | `/app/:org/sites/:siteId/offers/new` | `/sites/[siteId]/offers/new` | `app/(app)/sites/[siteId]/offers/new/page.tsx` | — | org |
| 30 | `/app/:org/offers/:offerId` | `/offers/[offerId]` | `app/(app)/offers/[offerId]/page.tsx` | — | org |
| 31 | `/app/:org/offers/:offerId/prix` | `/offers/[offerId]/pricing` | `app/(app)/offers/[offerId]/pricing/page.tsx` | — | org |
| 32 | `/app/:org/offers/:offerId/presentation` | `/offers/[offerId]/presentation` | `app/(app)/offers/[offerId]/presentation/page.tsx` | — | org |

Note : `/app/:org/sites/:siteId/offers` (route 28) et `/sites/[siteId]/offers` coexistent avec `/offers` (route 27). C'est intentionnel : la route 27 est la vue consolidée « toutes offres », la route 28 est la vue filtrée par site.

#### Finances

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 33 | `/app/:org/finance` | `/finance` | `app/(app)/finance/page.tsx` | — | org |
| 34 | `/app/:org/usage` | `/usage` | `app/(app)/usage/page.tsx` | — | org |

#### Organisation

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 35 | `/app/:org/organization` | `/organization` | `app/(app)/organization/page.tsx` | — | org |

#### Réglages

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 36 | `/app/:org/settings` (redirect) | — | Redirection interne → `/settings/general` | — | — |
| 37 | `/app/:org/settings/general` | `/settings/general` | `app/(app)/settings/general/page.tsx` | — | org |
| 38 | `/app/:org/settings/members` | `/settings/members` | `app/(app)/settings/members/page.tsx` | — | org |

Layout partagé : `app/(app)/settings/layout.tsx` (onglets Général / Membres).

### 2.6 Administration plateforme — Phase 5

Layout partagé : `app/(admin)/layout.tsx` → sidebar réduite (aucune organisation).

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 39 | `/platform-admin` (index) | `/admin` | `app/(admin)/admin/page.tsx` | — | platform-admin |
| 40 | `/platform-admin/organizations` | `/admin/organizations` | `app/(admin)/admin/organizations/page.tsx` | — | platform-admin |
| 41 | `/platform-admin/organizations/:id` | `/admin/organizations/[organizationId]` | `app/(admin)/admin/organizations/[organizationId]/page.tsx` | — | platform-admin |
| 42 | `/platform-admin/reseau` | `/admin/network` | `app/(admin)/admin/network/page.tsx` | — | platform-admin |
| 43 | `/platform-admin/finance` | `/admin/finance` | `app/(admin)/admin/finance/page.tsx` | — | platform-admin |
| 44 | `/platform-admin/audit` | `/admin/audit` | `app/(admin)/admin/audit/page.tsx` | — | platform-admin |

### 2.7 Pages d'erreur et diagnostics — Phase 5

| # | Ancienne adresse | Nouvelle adresse | Segment `app/` | RSC | Guard |
|---|---|---|---|---|---|
| 45 | `*` (not found) | — | `app/not-found.tsx` | — | — |
| 46 | Erreur inattendue | — | `app/error.tsx` | — | — |
| 47 | `/__dev/socle` | `/__dev/socle` | `app/__dev/socle/page.tsx` (hors prod) | ✓ | — |

### 2.8 Routes de gabarits — déjà présentes, à supprimer en Phase 5

Les routes sous `/gabarits/*` (`app/gabarits/`) existent aujourd'hui pour valider le design system. Elles sont retirées au moment de la bascule.

---

## 3. Helpers de routes Next.js

Le fichier `src/lib/routes.ts` remplace tous les `*Routes` dispersés dans les features. Il expose des fonctions pures, sans dépendance à React Router.

```ts
// src/lib/routes.ts  — contrat de nommage, pas encore créé
export const routes = {
  // Public purchase
  connect:         (siteId: string)                        => `/connect/${siteId}`,
  connectOffer:    (siteId: string, offerId: string)       => `/connect/${siteId}/offers/${offerId}`,
  connectPurchase: (siteId: string, purchaseId: string)    => `/connect/${siteId}/purchases/${purchaseId}`,
  // Public
  home:            ()                                      => `/`,
  portal:          ()                                      => `/portal`,
  forbidden:       ()                                      => `/forbidden`,
  // Auth
  login:           ()                                      => `/login`,
  register:        ()                                      => `/register`,
  sessionExpired:  ()                                      => `/session-expired`,
  account:         ()                                      => `/account`,
  // Onboarding
  onboardingOrg:   ()                                      => `/onboarding/organization`,
  onboardingStatus:()                                      => `/onboarding/status`,
  selectOrg:       ()                                      => `/organizations/select`,
  // App — console gérant
  dashboard:       ()                                      => `/dashboard`,
  sites:           ()                                      => `/sites`,
  siteNew:         ()                                      => `/sites/new`,
  site:            (siteId: string)                        => `/sites/${siteId}`,
  siteRouters:     (siteId: string)                        => `/sites/${siteId}/routers`,
  siteSettings:    (siteId: string)                        => `/sites/${siteId}/settings`,
  siteOffers:      (siteId: string)                        => `/sites/${siteId}/offers`,
  siteOfferNew:    (siteId: string)                        => `/sites/${siteId}/offers/new`,
  routers:         ()                                      => `/routers`,
  routerNew:       ()                                      => `/routers/new`,
  router:          (routerId: string)                      => `/routers/${routerId}`,
  routerSettings:  (routerId: string)                      => `/routers/${routerId}/settings`,
  access:          ()                                      => `/access`,
  accessNew:       ()                                      => `/access/new`,
  accessGrant:     (accessGrantId: string)                 => `/access/${accessGrantId}`,
  offers:          ()                                      => `/offers`,
  offer:           (offerId: string)                       => `/offers/${offerId}`,
  offerPricing:    (offerId: string)                       => `/offers/${offerId}/pricing`,
  offerPresentation:(offerId: string)                      => `/offers/${offerId}/presentation`,
  finance:         ()                                      => `/finance`,
  usage:           ()                                      => `/usage`,
  organization:    ()                                      => `/organization`,
  settingsGeneral: ()                                      => `/settings/general`,
  settingsMembers: ()                                      => `/settings/members`,
  // Admin
  admin:           ()                                      => `/admin`,
  adminOrgs:       ()                                      => `/admin/organizations`,
  adminOrg:        (orgId: string)                         => `/admin/organizations/${orgId}`,
  adminNetwork:    ()                                      => `/admin/network`,
  adminFinance:    ()                                      => `/admin/finance`,
  adminAudit:      ()                                      => `/admin/audit`,
} as const;
```

---

## 4. Ordre de migration

| Phase | Groupe | Routes # | Critère de fin |
|---|---|---|---|
| **3** | Parcours achat + pages publiques | 1–6 | Les trois pages `/connect/*` passent en RSC, le cookie de session est lu côté serveur sans erreur. |
| **4a** | Auth + Onboarding | 7–13 | Login, register, session-expired fonctionnent. L'onboarding crée une organisation. |
| **4b** | Console gérant : démarrage | 14 | `/dashboard` charge depuis le serveur, les métriques du jour s'affichent. |
| **4c** | Console gérant : sites | 15–19 | Toutes les pages sites fonctionnent, la navigation n'utilise plus l'`orgId` dans l'URL. |
| **4d** | Console gérant : routeurs | 20–23 | Idem routeurs. |
| **4e** | Console gérant : accès | 24–26 | Idem accès. |
| **4f** | Console gérant : offres | 27–32 | Idem offres, dont les deux vues (consolidée et par site). |
| **4g** | Console gérant : finances + usage | 33–34 | Idem finances et consommation. |
| **4h** | Console gérant : organisation + réglages | 35–38 | Paramètres et membres fonctionnent. |
| **5a** | Administration plateforme | 39–44 | Les six pages `/admin/*` fonctionnent avec le guard `platform-admin`. |
| **5b** | Erreurs, diagnostics, nettoyage | 45–47 + gabarits | `not-found`, `error`, et `/__dev/socle` présents. Les gabarits sont retirés. |
| **5c** | Bascule | — | Suite de tests verte, recette complète, déploiement Vercel, ancien front en standby. |

---

## 5. Critères d'acceptation par groupe

### Console gérant (phases 4b–4h)
- Tous les écrans existants de `ronett-web-client` sont reproduits avec le même comportement.
- La navigation ne contient aucun `orgId` visible dans l'URL.
- Chaque écran est valide à 360 px sans défilement horizontal.
- Chaque écran est validé par produit sur un écran de téléphone avant de passer au suivant.

### Parcours achat (phase 3)
- Les trois pages `/connect/*` se chargent sans JavaScript activé (HTML serveur complet).
- Le temps jusqu'au premier octet (TTFB) sur un réseau simulé à 1 Mbit/s est inférieur à 1,5 s.
- La connexion après paiement fonctionne (friction n°2 des personas : l'utilisateur est redirigé vers le login puis revient automatiquement à son accès).

### Bascule (phase 5c)
- Tous les tests unitaires et d'intégration passent.
- La recette complète (checklist `ACCEPTANCE.md` à créer en phase 5) est validée.
- L'ancien front `ronett-web-client` reste déployable pendant 30 jours après la bascule.

---

## 6. Points de risque ouverts

| # | Risque | Statut | Action |
|---|---|---|---|
| R1 | Variables `VITE_*` figées à la construction | Résolu en phase 1 : remplacées par `NEXT_PUBLIC_*` dans `src/config/environment.ts`. | — |
| R2 | 160 `Link` et 42 `useSearchParams` avec `orgId` dans l'URL | À traiter progressivement en phase 4 : chaque feature migre ses helpers vers `src/lib/routes.ts`. | Créer `src/lib/routes.ts` avant la phase 4a. |
| R3 | Tests qui s'appuient sur un faux routeur React Router | À remplacer par `next/navigation` mock (déjà standard avec `vitest` + `jsdom`). | Fait lors de chaque migration de feature. |
| R4 | Cookies de session côté serveur | Validé en phase 1 (`/socle` lit le backend depuis le serveur). À confirmer avec le vrai cookie de session avant la phase 3. | Tâche dédiée en début de phase 3. |
| R5 | Mode démo avec mocks (MSW) | `NEXT_PUBLIC_ENABLE_MOCKS=true` démarre le service worker MSW côté navigateur dans `src/components/providers.tsx`. À câbler avant la phase 4. | — |
