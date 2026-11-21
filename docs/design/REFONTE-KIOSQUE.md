# Refonte « modèle Stripe » : suivi

Direction choisie le 17/11/2026 (contrat : `docs/design/surface-console.md`, modèle : captures Stripe dans `docs/design/references/stripe-dashboard/`). Kiosque, billet de banque et disposition Shopify ont été essayés et rejetés.
Pour reprendre : ouvrir ce fichier, faire la première phase non cochée, vérifier (`npx tsc --noEmit`, `npm run lint`, `npm run lint:colors`, navigateur via la config « front-simule »), cocher, noter ce qui reste.

## Règles qui ne bougent pas
- Vert = couleur principale (demande de l'utilisateur). Vert vif #3CC66A pour l'action principale, texte noir dessus. Tout blanc, barre latérale blanche à filet, entrée active en vert sans fond, tableaux à plat.
- Police Archivo (chargée par next/font), chiffres en étroit gras.
- Pas de termes techniques à l'écran, français, vouvoiement.
- Tiroir à droite pour offres et accès ; fiche Site en une colonne.

## Fusion (demande du 17/11/2026 : Stripe comme base, d'autres SaaS mêlés avec harmonie)
- Stripe : coque, tableaux, en-têtes de colonnes, puces de filtre, boutons avec ombre légère.
- Linear : états en point de couleur + mot (`StateDot`), ligne au clavier marquée d'un trait à gauche.
- Vercel : contours nets, une seule action vert vif par écran.
- Mercury : montants alignés et en gras moyen dans les tableaux.
- Shopify : fiches de détail en deux colonnes (à reprendre en phases 5 à 7).
- Propre à Ronetz (demande : ne pas recopier Stripe pour les onglets et filtres) : filtres et choix de période en rail gris où l'option choisie se soulève en carte blanche, compte en petite étiquette ; onglets en texte avec un trait court arrondi de la largeur du mot ; grands chiffres en Archivo étroit (`font-figure`).

## Phases
- [x] 1. Fondations : coque Stripe (tout blanc, barre latérale à filet, compte en haut), police Archivo.
- [x] 2. Composants communs : tableaux (chiffres étroits, points d'état), boutons, puces de filtre, tiroirs, titres de page, états vides.
- [x] 3. Accueil.
- [x] 4. Accès (liste + tiroir).
- [x] 5. Offres (liste + tiroir).
- [x] 6. Sites (liste + fiche).
- [x] 7. Routeurs (liste + fiche + mise en service).
- [x] 8. Finances.
- [x] 9. Réglages, connexion, inscription, page d'achat publique.
- [x] 10. Téléphone (360 px), mode sombre, revue finale, DESIGN.md réécrit.

## Journal
- 17/11/2026 : direction choisie, contrat écrit.
- 17/11/2026 : phase 1 faite. Archivo via next/font (`src/app/layout.tsx`), jetons `--booth`, `--state-*`, utilitaire `font-figure` (`globals.css`), ardoise `src/components/app-shell/kiosk-board.tsx`, cabine dans `app-shell.tsx` (recherche factice retirée). À reprendre en phase 2 : les pastilles d'état pleines (`StatusPill`) restent à remplacer par des points ; le filtre « Actifs » de la liste compte la page affichée seulement, l'ardoise compte les 100 derniers accès.
- 17/11/2026 : l'utilisateur rejette le kiosque, passe au billet de banque. L'ardoise est retirée.
- 17/11/2026 : phase 1 (billet) faite. Jetons papier/encre/filets et `--ink` dans `globals.css`, rail encre, barre du haut sur papier, plus de panneau flottant (`app-shell.tsx`), Archivo conservée, utilitaire `font-figure` et couleurs `--state-*` prêts pour la phase 2. Phase 2 : double filet sous les en-têtes de tableau, montants en `font-figure text-ink`, points d'état à la place de `StatusPill`.
- 17/11/2026 : billet rejeté (« je n'aime pas du tout »), passage à la disposition Shopify. Phase 1 faite : `app-shell.tsx` (barre du haut fixe, compte en haut à droite, barre latérale sous la barre), jetons `--canvas`, `--topbar` (`globals.css`), carte blanche autour des tableaux (`row-card-list.tsx`). Phase 2 : titres, filtres, fiches et tiroirs en cartes ; points d'état.
- 17/11/2026 : Shopify rejeté, retour au modèle Stripe (« partons sur un modèle stripe »). Coque refaite dans `app-shell.tsx`, jetons Stripe dans `globals.css`, tableaux à plat. Phase 2 : comparer chaque composant aux captures 06 à 40 (puces de filtre, tableaux, tiroirs, vides, chargement, erreurs).
- 17/11/2026 : phase 2 faite. `StateDot` dans `row-card.tsx` (utilisé par `StatusPill`, `OfferStatusBadge`, réglages, panneau routeur), en-têtes Stripe et lignes au clavier dans `row-card-list.tsx`, puces de filtre Stripe, boutons à ombre légère (`ui/button.tsx`). Restent avec les anciennes pastilles : `platform-admin/components/parts.tsx` et le gabarit `gabarits/acces` (hors console des gérants).
- 17/11/2026 : phase 3 faite. Filtres (`RowCardToolbar` dans `row-card-list.tsx`), onglets (`settings-tabs.tsx`, `ui/tabs.tsx` variante line), accueil (`today-section.tsx` chiffres étroits séparés par filets, `activity-section.tsx` période en rail). Zones de l'accueil inchangées (règle : ne pas ajouter de zone sans demander).
- 17/11/2026 : phase 4 faite. Liste des accès : lit les 100 derniers d'un coup, filtres, comptes et pages portent sur le même ensemble (`access-list.tsx`) ; un accès actif dont le temps est écoulé s'affiche « Expiré » (`accessDisplayState(grant, now)`). Tiroir : titre = identifiant en police à chasse fixe, conditions pleine largeur (`access-detail-panel.tsx`), parcours en fil d'activité léger à repères cerclés (`DetailJourney` dans `detail-page.tsx`, sert aussi aux routeurs).
- 17/11/2026 : phase 5 faite. Tiroir d'offre aligné sur celui des accès : actions sous le titre, identifiant technique retiré du pied (vocabulaire), dates seules (`offer-detail.tsx`). La liste profite déjà des phases 2-3 (points d'état, rail de filtres).
- 17/11/2026 : phase 6 faite. Fiche Site : chiffres au style de l'accueil (intitulé normal, Archivo étroit 28 px), « Dernière vente » en largeur normale (`site-detail.tsx`). Liste des sites inchangée (déjà aux styles des phases 2-3).
- 17/11/2026 : phase 7 faite. Fiche routeur et mise en service déjà aux nouveaux styles (points d'état, fil d'activité léger). Nom du script lisible : `ronetz-<nom-du-routeur>-<4 caractères>.rsc` au lieu de l'identifiant complet (`artifactFileName` dans `router/model/router.ts`, testé). Pas de bandeau de chiffres ajouté (la colonne d'infos à droite suffit, modèle Shopify).
- 17/11/2026 : phase 8 faite. Soldes en Archivo étroit, carte « Déjà versé » à sa hauteur naturelle (`balance-cards.tsx`). Correction : le trait sous l'onglet actif ne s'affichait jamais (sélecteur `group-data-horizontal` sans attribut correspondant) ; règle rendue inconditionnelle dans `ui/tabs.tsx`.
- 17/11/2026 : phase 9 faite. Aperçu « Ce que verra le client » retiré des deux formulaires de vente (règle : pas d'écran client dans la console), composants `Ticket` supprimés (`sell-access-drawer.tsx`, `app-shell/sell-drawer.tsx`). Réglages déjà aux nouveaux onglets et points d'état. Non vérifié : la page d'achat publique (le mode simulé n'a pas de route `/api/public/.../offers`, elle affiche « Offre indisponible ») ; connexion et inscription non revues (redirigées quand on est connecté).
- 17/11/2026 : phase 10 faite. 360 px : aucune page ne défile en largeur (seul le rail de filtres défile, voulu). Mode sombre : graphite neutre, lisible. DESIGN.md réécrit depuis le code. Revue finale (code seulement) : corrigés l'aperçu client de la création d'offre (supprimé), la pastille de compte en vert (neutre), la barre de progression de mise en service en vert (foncé), l'ancienne pastille du panneau des sites (point d'état), le code brut d'état à l'écran (« Autre »), deux règles de sélection en conflit, le gris secondaire aligné sur #687385.

## Reste à faire
- Captures ordinateur et téléphone pour une revue visuelle complète (la revue finale n'a lu que le code).
- Page d'achat publique, connexion et inscription à revoir avec le vrai serveur (le mode simulé n'a pas les offres publiques).

- 17/11/2026 : petits restes réglés. Rang lisible (ex. « 4e sur 6 ») sur la fiche d'offre (`offer-detail.tsx`), jetons `--sidebar-active*` retirés, trait d'onglet aligné (`ui/tabs.tsx`, `settings-tabs.tsx`), bouton retour en icône (`detail-page.tsx`), administration et gabarit passés au point d'état, `ROW_CARD_TONE_CLASS` supprimé.
- 17/11/2026 : demande « mêmes tableaux partout, trop répétitif ». Offres en cartes groupées par site (`offer-cards.tsx`). `RowCardList` prend `variant` : `boxed` (tableau encadré, en-tête gris, façon Vercel : routeurs, sites), `feed` (fil groupé par jour, sans en-têtes : accès), `table` (à plat, Stripe : finances).
- 17/11/2026 : cartes d'offres et variantes de tableau rejetées (« naze », « horrible »), références 21st.dev rejetées aussi ; retour au tableau Stripe partout. Prochaine fois : partir de captures fournies par l'utilisateur.
- 17/11/2026 : page Finances refaite sur la capture Stripe 06 (Soldes) : montant à côté du titre, « Retirer » en bouton à contour, « Résumé du solde » (barre + tableau Type/Montant, ligne Disponible surlignée), « Activité récente » avec onglets, colonne de droite « Versements » (`finance-page.tsx`, `balance-cards.tsx`, `withdrawal-dialog.tsx`).
- 17/11/2026 : fiche routeur refaite sur les captures Stripe 31 et 39 : nouveau gabarit `RecordPage` (`components/patterns/record-page.tsx`) — lien vers la liste au-dessus du titre 28 px + état, ligne de contexte, actions à droite, bandeau d'information, sections « Mise en service » / « Activité récente » à gauche, colonne « Détails » à droite. Réutilisable pour les autres fiches.
- 17/11/2026 : mise en service du routeur refaite sur le guide de démarrage Stripe (captures 03, 17) : barre de progression fine + « Étape X sur 4 », liste des étapes (coche pleine / en cours dépliée sur fond gris / à venir en pointillé), sans cadre (`SetupSteps` dans `router-setup.tsx`).
- 18/11/2026 : fiche Site sur `RecordPage` (captures Stripe 31/39) : sections Routeurs (tableau + « + »), Offres en vente (tableau), Page de vente, Page de connexion ; vides en pointillés ; « Détails » à droite (ville, routeurs en ligne, accès actifs, vendus sur 7 jours, dernière vente, créé le). Finances : la répartition du solde (en attente / retraits en cours) est remplacée par « Ce mois-ci » sur le modèle « Détail du paiement » de Stripe : payé par vos clients, commission Ronetz, recettes nettes ; un retrait en cours ne s'affiche qu'à droite et seulement s'il existe.
- 18/11/2026 : Finances réorganisée sur « Aujourd'hui » de Stripe (capture 03) : titre + filet ; à gauche chiffres (Disponible, Recettes nettes du mois, Ventes) et une barre par jour du mois (`month-overview.tsx`) ; à droite panneau gris « Retirer vos recettes » (`WithdrawPanel`) ; puis « Ce mois-ci » et « Versements » côte à côte ; puis l'activité récente.
