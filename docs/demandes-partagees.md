# Demandes partagées

Une ligne par demande : date, domaine, besoin, raison. Traitées par la session principale.

- 2026-11-16 · accès · Brancher `SellAccessDrawer` (`@/features/access`, mêmes props `open`/`onOpenChange` que `SellDrawer`) dans `app-shell.tsx` à la place de la maquette `sell-drawer.tsx`. · La maquette tire un code au hasard ; le nouveau tiroir crée un vrai accès (offre du site, clé d'idempotence, identifiant + mot de passe affichés une fois).
- 2026-11-16 · accès · Backend local : la création d'accès répond 503 (« RADIUS deployment has not been verified ») tant que `RONETZ_ACCESS_RADIUS_DEPLOYMENT_VERIFIED=true` n'est pas défini au lancement du backend partagé. · Impossible de valider la création de bout en bout sans cette variable (ou un nœud de site).
- 2026-11-16 | organisation-reglages | Backend : route de modification du nom de l'organisation (`PATCH /api/organizations/{id}`, permission ORGANIZATION_UPDATE existe déjà ; PUT/PATCH renvoient 405 aujourd'hui). Le formulaire est prêt : passer `ORGANIZATION_RENAME_AVAILABLE` à `true` dans `src/features/organization-settings/model/organization.ts`. | Le propriétaire veut pouvoir renommer son organisation.
- 2026-11-16 | organisation-reglages | Backend : invitation d'un membre par e-mail, et nom/e-mail des membres dans `GET /organizations/{id}/memberships` (seul `userId` est renvoyé). | L'ancien front demandait un UUID, interdit à l'écran ; la page Membres affiche « bientôt disponible ».
- 2026-11-16 | organisation-reglages | Partagé : page `/` utilise les classes de `status-screen.tsx` (liens-boutons) ; à remplacer par un composant générique si le design system en fournit un. | Éviter la duplication.
