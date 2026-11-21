---
name: Ronetz, console des gérants
description: Base Stripe tout blanc, états à la Linear, contours nets à la Vercel, montants à la Mercury, fiches Shopify, rail de filtres et trait d'onglet propres à Ronetz.
colors:
  primary: "#3cc66a"
  primary-foreground: "#0d0d14"
  primary-hover: "#2ea456"
  primary-pressed: "#177a36"
  signal: "#177a36"
  background: "#ffffff"
  foreground: "#353a44"
  muted: "#f5f6f8"
  muted-foreground: "#6b6b6b"
  sidebar-muted-foreground: "#687385"
  border: "#ebeef1"
  input: "#d5dbe1"
  state-ok: "#2fae58"
  state-warn: "#d99a1e"
  state-down: "#d2452f"
  state-idle: "#a3ada6"
  destructive: "#d92d20"
typography:
  page-title:
    fontFamily: "Archivo, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
  detail-title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
  figure:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.25rem"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
    fontVariation: "'wdth' 72"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  sidebar: "224px"
  topbar: "64px"
  content-max: "72rem"
  table-row: "48px"
  label-column: "14rem"
  rail-column: "17.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
  button-link:
    textColor: "{colors.signal}"
  filter-rail:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "4px"
  filter-option-on:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "28px"
  search-field:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.md}"
    height: "32px"
  metric-card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System : Ronetz, console des gérants

## Overview

Console d'un gérant de Wi-Fi au Cameroun : vendre des accès, suivre les recettes, garder les routeurs en marche. La base est le tableau de bord Stripe (captures dans `docs/design/references/stripe-dashboard/`), choisie le 17/11/2026 après le rejet du kiosque, du billet de banque et de la disposition Shopify. Contrat : `docs/design/surface-console.md` ; journal : `docs/design/REFONTE-KIOSQUE.md`.

Fusion, chaque emprunt à sa place :
- **Stripe** : coque blanche, tableaux à plat, en-têtes de colonnes, boutons à ombre légère.
- **Linear** : état = point de couleur + mot (`StateDot`) ; ligne au clavier marquée d'un trait à gauche.
- **Vercel** : contours nets d'un pixel, une seule action vert vif par écran.
- **Mercury** : montants alignés à droite, chiffres tabulaires, graisse moyenne.
- **Shopify** : fiches de détail en deux colonnes (contenu à gauche, colonne d'infos à droite).
- **Ronetz** : rail gris des filtres où le choix se soulève en carte blanche ; onglet marqué d'un trait court et arrondi ; grands chiffres en Archivo étroit (`font-figure`).

Tout est blanc, calme, dense comme Stripe. La couleur ne sert qu'à deux choses : l'action principale et l'état.

## Colors

Source unique : `src/app/globals.css`. Trois couches : primitives (`--gray-*`, `--emerald-*`), rôles (`--background`, `--primary`…), états. Un composant ne pose jamais une valeur : il demande un rôle (`npm run lint:colors`). Clair et sombre via `light-dark()`, le thème suit le système, `data-theme` le force.

**Le vert, rôle strict.**
- `--primary` (Vert électrique `#3CC66A`, texte noir `#0D0D14`, jamais blanc) : le bouton principal, un seul par écran (« Vendre un accès » dans la barre du haut, ou l'action principale d'un tiroir).
- `--signal` (`#177A36` sur clair, `#3CC66A` sur sombre) : liens, entrée active de la barre latérale, focus, anneau du guide.
- Interdit : fonds teintés de vert, titres verts, états en vert de marque. Le vert d'état est `--state-ok`, distinct de la marque.

**Neutres.** Texte `#353A44`, secondaire `--muted-foreground`, barre latérale secondaire `#687385`. Filets `#EBEEF1` (`--border`), contours de champs `#D5DBE1` (`--input`). Fonds gris `#F5F6F8` (`--muted`) réservés au rail de filtres, au champ de recherche, au survol et aux panneaux d'aide de l'accueil.

**États** (`--state-ok`, `--state-warn`, `--state-down`, `--state-idle`) : uniquement dans un point de 6 px. Les rampes `--success/--warning/--danger/--info` (fond, texte, bord) servent aux bandeaux et messages, pas aux lignes de tableau.

**Destructif** : `--destructive` en texte sur fond `destructive/10`, jamais un bouton rouge plein.

## Typography

Une famille : **Archivo** variable avec axe de largeur, chargée par `next/font` (`src/app/layout.tsx`, `--font-archivo`), repli sur la pile système. Chasse fixe (`--font-mono`) pour les identifiants copiables et le code d'accès.

| Rôle | Taille / interligne | Graisse | Usage |
| --- | --- | --- | --- |
| Titre de page | 28/36 (24 sur téléphone) | 700, `tracking-tight` | `PageHeader` |
| Titre de section | 24/32 | 600 | « Activité » sur l'accueil |
| Titre de fiche | 20/28 | 600 | `SettingsPage`, tiroirs |
| Sous-titre | 16/24 | 600 | `SettingsSection`, panneau « À faire » |
| Corps | 14/20 | 400 / 500 | tout l'interface (`--text-base` = 14 px) |
| Libellé | 12/16 | 600 | en-têtes de colonnes |
| Méta | 12/16 | 400, gris | ligne 2 des cartes-lignes, aides |
| Filtres | 13 px | 500 | options du rail |

**`font-figure`** (utilitaire de `globals.css`) : largeur 72 %, graisse 700, chiffres tabulaires, `-0.01em`. Réservé aux grands chiffres isolés, avec leur taille posée à côté :
- 44/48 : solde disponible (`balance-cards.tsx`) ;
- 34/40 : recette du jour, 22/40 gris pour la comparaison (`today-section.tsx`) ;
- 28/36 : cartes de métriques, « Déjà versé », chiffres de la fiche Site.

Dans les tableaux et les textes courants, les nombres restent en largeur normale avec `tnum` (ou `tabular-nums`). Montants toujours par `<Amount>` : séparateur de milliers insécable, « FCFA » à 0,85 em en gris.

## Layout

**Coque** (`app-shell.tsx`). Barre latérale blanche de 224 px (`--sidebar-width: 14rem`), séparée par le filet `--border`. En haut, le compte : pastille à initiale verte 28 px, nom de l'organisation, nom du gérant. Liste plate icône + libellé ; entrée active en `--signal`, graisse 600, sans fond. « Réglages » seul en pied.

**Barre du haut** : 64 px, dans la colonne de contenu, même blanc. À droite : « Guide de démarrage » (bouton contour avec anneau de progression, « 2/5 » sur téléphone) puis l'action principale « Vendre un accès » (« Vendre » sur téléphone). Sur téléphone : menu et logo à gauche.

**Contenu** : largeur maximale 72 rem centrée, marges 16 px (32 px dès `sm`), 64 px en bas. Sur ordinateur, seul le contenu défile, sans barre de défilement visible.

**Guide de démarrage** : carte flottante en bas à droite (384 px, rayon 12, `--shadow-float`), ouverte d'elle-même sur l'accueil seulement.

**Rythme** : sections de réglages et de fiches en lignes de 20 px de haut et de bas séparées d'un filet ; grille libellé 14 rem / contenu.

## Elevation & Depth

Monde plat : la profondeur vient des filets, pas des ombres.
- Boutons : `0 1px 1px` à 12 % (principal, avec reflet intérieur) ou 6 % (contour).
- Option choisie du rail : `0 1px 2px` à 8 % + contour 1 px à 4 %.
- Tiroirs : `shadow-lg` sur voile `black/10` légèrement flouté.
- Guide flottant : `--shadow-float`, deux couches.
- Tableaux, cartes de métriques, soldes : aucune ombre, contour `--border` seulement.

## Shapes

Rayons : 4 (petites étiquettes), 6 (boutons, champs, options du rail, lignes), 8 (rail de filtres, cases vides), 12 (cartes de métriques, soldes, panneaux d'aide, guide). Les points d'état et l'anneau sont ronds. Les vides sont des cases en pointillés (`border-dashed`). Les traits d'onglet sont des barres de 3 px aux extrémités arrondies.

## Components

**Boutons** (`ui/button.tsx`) : hauteur 36 (`sm` 32, `xs` 24), rayon 6, 14 px / 500. Variantes : `default` (vert, une fois par écran), `outline` (blanc, contour `--input`, la plupart des actions), `ghost`, `secondary`, `destructive` (texte rouge sur fond pâle), `link` (`--signal`, souligné au survol). Appui : descente de 1 px.

**États** (`StateDot`, `row-card.tsx`) : point de 6 px + mot, sans fond. Texte encre ; gris pour l'état neutre. La couleur ne vient jamais seule. `StatusPill` et `OfferStatusBadge` passent par `StateDot`.

**Tableaux** (`RowCardList`, `row-card-list.tsx`) : sur ordinateur, tableau Stripe. En-tête 36 px, 12 px / 600 encre, filet dessous ; lignes de 48 px séparées d'un filet, aucun fond alterné, aucun intertitre ; survol et sélection en `--muted` ; focus clavier = trait de 2 px à gauche (`inset 2px 0 0 var(--ring)`), flèches ↑ ↓ Début Fin. Colonne de montant alignée à droite, `tnum`, 500. Colonnes secondaires (`wide`) cachées sous 1024 px. Sur téléphone, cartes-lignes à deux lignes (titre + montant ; méta + état), 56 px minimum. Chargement : six blocs de 56 px. Pagination sous le tableau : « 1–8 sur 20 résultats », Précédent / Suivant en contour.

**Filtres** (`RowCardToolbar`) : rail gris `--muted`, rayon 8, 4 px de marge intérieure ; options de 28 px (40 px sur téléphone), 13 px / 500 ; l'option choisie se soulève en carte blanche, son compte en petite étiquette grise 11 px / 600. Un seul choix, « Tous » par défaut. Recherche à droite : champ gris sans contour, 32 px, loupe à gauche. Le choix de période de l'accueil reprend le même rail.

**Onglets** (`settings-tabs.tsx`, `ui/tabs.tsx` variante `line`) : texte seul, 14 px / 500, gris ; l'onglet courant passe en encre avec un trait de 3 px arrondi, de la largeur du mot (retrait de 4 px de chaque côté), posé sur le filet de la barre. Jamais un trait pleine largeur, jamais de vert.

**Tiroirs** (offres, accès, vente) : `Sheet` à droite, pleine largeur sur téléphone, 576 px max (`sm:max-w-xl`), défilement interne, croix en haut à droite. La fiche d'un objet s'y affiche en mode compact (`DetailCompactContext`) : une colonne, marges 24 px, titre 20 px avec l'état à côté, actions sous le titre, propriétés en grille de deux colonnes (libellé gris, valeur 500), sections empilées sous un filet.

**Fiches de détail** (`DetailPage` → `SettingsPage`, `detail-page.tsx`) : fil de retour et actions sur une ligne, titre 20 px avec l'état, puis deux colonnes à la Shopify : sections à gauche, colonne d'infos de 17,5 rem à droite (libellé gris, valeur 500, collante à 80 px). Sections (`DetailSection`) : titre à gauche sur 14 rem, contenu à droite, filet dessous. Vides : `DetailEmpty` en pointillés. Identifiants : `CopyId` en chasse fixe, « Copier » → « Copié ».

**Parcours** (`DetailJourney`) : fil vertical à repères cerclés de 28 px reliés par un filet. Passé : contour gris, icône encre. En cours : contour encre et halo `ring-4 ring-muted`. À venir : contour pointillé, texte gris. Jamais de pastilles pleines. Sert aux accès et aux routeurs.

**Accueil** : en-tête « Tableau de bord », chiffres du jour séparés par des filets verticaux, panneau « À faire » gris rayon 12 avec liens `--signal`, section « Activité » : rail de période et trois cartes de métriques à contour (titre 14 / 500, chiffre `font-figure` 28, comparaison grise).

**Finances** : carte « Solde disponible » à contour (chiffre 44), barre de répartition de 8 px, lignes libellé → montant séparées d'un filet ; carte « Déjà versé » à sa hauteur naturelle à droite (20 rem).

## Do's and Don'ts

**À faire**
- Une seule action vert vif par écran ; tout le reste en contour, fantôme ou lien.
- Doubler chaque couleur d'état d'un mot.
- Écrire en français, au vouvoiement, avec les mots du gérant et des unités humaines (« 2 h », « 500 FCFA »). Une phrase, l'action nommée par son verbe.
- Réutiliser `PageHeader`, `RowCardList`, `RowCardToolbar`, `DetailPage`, `StateDot`, `Amount` avant d'inventer.
- Garder les zones existantes d'un écran ; demander avant d'en ajouter.

**À ne pas faire**
- Aucun terme technique à l'écran : ni projection, RADIUS, UUID, identifiant technique, ni nom de champ du serveur.
- Aucun aperçu de ce que verra le client (téléphone, ticket) dans la console.
- Pas de vert en fond, en titre ou en décoration ; pas de texte blanc sur le vert.
- Pas de pastilles d'état pleines, pas d'intertitres qui coupent un tableau, pas de fond alterné.
- Pas d'onglet à trait pleine largeur ni d'onglet coloré ; pas de puces de filtre à contour façon Stripe.
- Pas de `font-figure` dans les cellules de tableau ni dans le texte courant.
- Pas de petits surtitres en capitales au-dessus des titres, pas de flèches en caractère (« ← ») à la place d'une icône.
