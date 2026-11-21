# Conventions de la console (front Next.js)

Lis ce document en entier avant d'écrire du code. Il s'applique à toute session qui construit un domaine de la console des gérants (ou l'administration) dans `web-app/ronett-web-next`.

## 1. Objectif

Rendre le nouveau front **opérationnel** contre le vrai backend, fidèle au design de référence (le tableau de bord Stripe, interprété avec l'identité Ronetz). L'ancien front `web-app/ronett-web-client` est la **référence fonctionnelle** : mêmes comportements, mêmes cas limites, mêmes règles métier. On ne copie pas son apparence : on refait chaque écran dans le nouveau design.

## 2. Ce qui existe déjà (ne le refais pas)

- **Socle** : `src/app/(app)/layout.tsx` = garde de session + organisation active + `AppShell`. Toute page de la console vit sous `src/app/(app)/` et n'a rien à vérifier elle-même.
- **Organisation active** : `useOrganization()` (`src/features/organizations/hooks/organization-context.tsx`) donne `organizationId`, `organizationName`, `permissions`, `can(permission)` et `orgApi(path)` (ex. `orgApi("/sites")` → `/api/organizations/<id>/sites`). L'organisation n'est **jamais** dans l'adresse.
- **Appels d'API authentifiés** : `useAuth().request(path, options)` (`src/features/authentication/hooks/auth-provider.tsx`) ajoute le jeton, rafraîchit la session, lève `ApiError` (`src/lib/api-error.ts`, `toUserMessage`). Pour les données : TanStack Query (`useQuery`, `useMutation`), clés de requête rangées par domaine.
- **Adresses** : `src/lib/routes.ts` (`routes.sites()`, `routes.router(id)`…). N'écris jamais une adresse en dur.
- **Design system** : composants shadcn dans `src/components/ui/` (style Vega, Base UI), jetons dans `src/app/globals.css`, `Amount` et `PageHeader` dans `src/components/`, gabarits `src/components/patterns/` (`RowCardList`, `SplitView` : liste en cartes-lignes et panneau latéral poussé), tiroir de vente dans `src/components/app-shell/sell-drawer.tsx`, guide de démarrage, page de référence `/design-system`.
- **Références de design** : `DESIGN.md`, `docs/design/stripe-design-engine.md`, captures `docs/design/references/stripe-dashboard/`, exemples `/gabarits/accueil` et `/gabarits/acces`.
- **Produit** : `PRODUCT.md`, `docs/produit/` (parcours, besoins, décisions), personas `web-app/personas-parcours-ronetz.html`.
- **Contrat d'API** : `platform/docs/frontend-contract/` (endpoints, DTO, erreurs) et le code des contrôleurs `platform/src/main`.

## 3. Où tu travailles (propriété des fichiers)

Chaque session possède **uniquement** :
- `src/features/<ton-domaine>/` (api, model, schemas, queries, mutations, components, tests) ;
- les pages de ton domaine sous `src/app/(app)/<tes-routes>/`.

Tu ne modifies **pas** : `src/components/ui/`, `src/components/app-shell/`, `src/app/globals.css`, `src/lib/`, `src/features/authentication|memberships|organizations|onboarding|purchase`, `package.json`, `eslint.config.mjs`, `tsconfig.json`, les gabarits, ni le dossier d'une autre session. Besoin d'un changement partagé (nouveau composant générique, nouvelle dépendance, nouvel élément de menu, nouvel endpoint à demander au backend) : écris-le dans `docs/demandes-partagees.md` (ajoute une ligne : domaine, besoin, raison) et contourne localement en attendant. N'installe aucune dépendance (`npm install` interdit).

Un composant spécifique à ton domaine reste dans ton dossier `components/`. N'importe pas de fichiers d'un autre domaine.

## 4. Comment porter un domaine

1. Lis le code de l'ancien front pour le domaine : `web-app/ronett-web-client/src/features/<domaine>/`, `src/pages/<domaine>/`, ses tests. Reprends la logique **telle quelle** (schémas zod, modèles, appels d'API, règles de formatage, mapping d'erreurs, permissions) en remplaçant React Router par Next : `useNavigate`→`useRouter` (`next/navigation`), `useParams`/`useSearchParams`/`useLocation` depuis `next/navigation`, `Link` de `next/link`, plus d'`organizationId` dans l'adresse (utilise `useOrganization()`).
2. Vérifie chaque endpoint dans le contrôleur du backend (`platform/src/main/java/...`) et dans le contrat : ne suppose pas que l'ancien client est à jour.
3. Construis les écrans selon le design : tableaux Stripe pour les listes (colonnes `columns` de RowCardList ; lignes empilées sur téléphone), panneau latéral poussé pour un détail, tiroir à deux colonnes avec aperçu pour un formulaire riche, fenêtre centrée pour un formulaire court, onglets textuels, puces de filtre, bandeaux d'information, états vides avec une action. Page de titre 28/36 gras. Corps 14/20.
4. Chaque écran traite : chargement (squelette), vide (message + action), erreur locale (phrase à l'endroit du contenu, jamais une page cassée), permission refusée, grand volume, hors ligne.
5. Les textes sont en français courant, vouvoiement, phrases courtes, **aucun terme technique à l'écran** (RADIUS, UUID, projection, provisioning, idempotence, token…), montants « 12 500 FCFA » via `Amount`. Un bouton nomme son action.
6. Mobile d'abord : 360 px de large sans défilement horizontal, cibles tactiles ≥ 44 px (`h-11` sur mobile pour les champs et boutons principaux), pas de tableau défilant sur le côté.
7. Accessibilité : libellés sur chaque champ, focus visible, navigation au clavier, `aria-*` sur les listes et les états, contrastes AA, `prefers-reduced-motion`.
8. Aucune couleur en dur (`npm run lint:colors`) ; uniquement les jetons (`bg-primary`, `text-muted-foreground`, `success`, `danger`…).
9. Tests Vitest pour la logique (schémas, formatage, mapping d'erreurs, permissions) et pour les composants à comportement ; portés depuis l'ancien front quand ils existent. Pas d'appel réseau réel dans les tests.

## 5. Vérifier contre le vrai backend

- **Backend local partagé** : `http://localhost:8080` (déjà lancé ; ne le redémarre pas, ne touche pas à son dossier). Compte de développement et organisation : voir `docs/dev-local.md`. Si tu as besoin d'autres données (sites, routeurs, offres), crée-les par l'API ou par l'interface, avec des noms de test.
- **Ton serveur** : utilise ton port réservé (indiqué dans ta consigne), un dossier de construction à toi (`NEXT_DIST_DIR=.next-<ton-nom>`), et l'aperçu du navigateur intégré (jamais un serveur lancé à la main sans l'arrêter ensuite). Le relais `/api` de Next.js envoie vers le port 8080.
- **Contrôles à lancer** avant de conclure : `npx tsc --noEmit 2>&1 | grep -v "^\.next"` (ignore les erreurs de fichiers qui ne sont pas à toi, mais signale-les), `npm run lint`, `npx vitest run src/features/<ton-domaine>`, `NEXT_DIST_DIR=.next-<ton-nom> npm run build`. Puis un parcours réel dans le navigateur : connecte-toi avec le compte de développement, fais l'action de bout en bout, à 360 px et en bureau, en clair et en sombre. Joins ce que tu as vérifié et ce que tu n'as pas pu vérifier.
- Plusieurs sessions travaillent en parallèle dans le même dossier : une erreur de typage dans un fichier d'un autre domaine n'est pas la tienne ; ne la corrige pas.

## 6. Règles

- Ne commit rien, ne change pas de branche (le dossier n'est pas un dépôt git).
- N'affiche jamais un secret, un jeton ou un mot de passe dans ton compte rendu.
- Argent et sécurité : n'invente aucune règle. Reprends celles du backend et de l'ancien front ; signale tout doute.
- Retraits : désactivés tant que le versement n'est pas validé (décision du propriétaire). Affiche « Les retraits seront bientôt disponibles. » avec le solde visible.
- Une organisation par compte, Cameroun seul pays ouvert (pays sélectionnable), devise déduite du pays : jamais de saisie de devise.
- Le temps d'un accès commence à l'émission : dis-le clairement dans les textes (voir `docs/produit/parcours-premier-contact.md`).

## 7. Compte rendu attendu

≤ 25 lignes : ce qui est construit (routes, composants), ce qui est vérifié (commandes et résultats réels, parcours dans le navigateur), ce qui ne l'est pas, les écarts avec l'ancien front et leur raison, les demandes ajoutées à `docs/demandes-partagees.md`.
