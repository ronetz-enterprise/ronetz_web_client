# Le moteur de design de Stripe : référence pour Ronetz

Relevé le 2026-11-16 dans le tableau de bord Stripe (environnement de test de l'utilisateur, interface en français), à partir des valeurs réelles de la page (variables CSS, styles calculés) et de 28 captures (`references/stripe-dashboard/01` à `28`). Ce document décrit un **système**, pas une apparence : comment les jetons sont rangés, quelles tailles se répètent, comment chaque composant se comporte. Il sert de modèle à la charte, au design system et aux écrans de Ronetz.

Ce qu'on prend : l'architecture des jetons, l'échelle de tailles, la densité, la composition des écrans, les comportements. Ce qu'on ne prend pas : la marque Stripe, son violet, ses textes, ses pictogrammes. Ronetz garde son nom, son logo, son émeraude et ses mots.

## 1. Comment le système est construit

Trois couches, de la plus brute à la plus utile :

1. **Primitives** : des rampes de couleur numérotées (`--sail-color-gray50` à `gray800`, `blue`, `green`, `red`, `orange`, `yellow`, `cyan`, `purple`), des tailles brutes (`--space-100`…).
2. **Rôles** : des noms qui disent à quoi sert la couleur, jamais quelle couleur c'est. `--color-text`, `--color-background-…`, `--color-border-…`, `--color-icon-…`.
3. **États** : chaque rôle d'action existe en cinq variantes, `-` (repos), `-hovered`, `-focused`, `-pressed`, `-disabled`. Un composant ne choisit jamais une couleur : il demande « fond de l'action principale, survolée ».

Les retours (succès, erreur, attention, information, neutre) suivent la même règle avec trois intensités : `subdued` (fond très pâle), normal (fond), `emphasized` (le plus marqué). Chacun a son jeu de trois jetons : fond, bordure, texte.

**Ce que Ronetz en retient** : un composant n'écrit jamais `#047857`. Il écrit « fond de l'action principale ». Changer la marque ne demande alors de modifier qu'un fichier.

## 2. Couleurs observées

### Neutres : un gris-bleu froid, sur une seule rampe

| Rôle | Valeur | Usage |
|---|---|---|
| Texte principal | `#1A2C44` | Titres, texte courant dans le contenu |
| Texte de formulaire | `#273951` | Valeur d'un champ, texte d'un bouton secondaire |
| Texte atténué | `#3C4F69` | Libellés de menu, icônes, intertitres de menu |
| Texte de substitution | `#667691` | Placeholder, fond « neutre accentué » |
| Texte désactivé | `#7D8BA4` | Contrôles inactifs |
| Bordure | `#D4DEE9` | Séparateurs, cartes, boutons secondaires |
| Bordure survolée | `#95A4BA` | Bouton secondaire au survol |
| Fond neutre | `#ECF1F6` | Puce neutre, champ désactivé |
| Fond très pâle | `#F4F7FA` | Bouton secondaire appuyé, bandeaux, panneaux |
| Fond de page | `#f0f3f5` | La coque autour du panneau de contenu |
| Voile de modale | `rgba(186, 200, 218, 0.7)` | Derrière une fenêtre ou un tiroir : un voile bleuté et clair, jamais noir |

### Action

Une seule couleur vive, `#533afd` : action principale, lien, entrée de menu active, icône d'action. Survolée : bordure `#44139f`. Appuyée : fond `#4e11e2`. Désactivée : même teinte, atténuée. Fond d'un contrôle accentué (case cochée, interrupteur) : `#675dff`. Destructif : `#e61947` (texte `#c0123c`).

### Retours

| Retour | Fond pâle | Fond | Texte | Accentué |
|---|---|---|---|---|
| Succès | `#eafcdd` | `#d1fab3` | `#217005` | `#2b8700` |
| Erreur | `#fef4f6` | `#fde9ee` | `#c0123c` | `#e61947` |
| Attention | `#fdf8c9` | `#fceeb5` | `#b13600` | `#cc4b00` |
| Information | `#e2fbfe` | `#cbf5fd` | `#045ad0` | `#0072e9` |
| Neutre | `#F4F7FA` | `#ECF1F6` | `#667691` | `#667691` |

Chaque rampe a 12 pas (0, 25, 33, 50, 66, 100 à 1100), ce qui permet un thème sombre sans réinventer les rôles.

## 3. Typographie

- **Police : la pile du système** (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu`) ; Menlo/Consolas pour le code. Aucune police chargée : l'interface est instantanée et lisible partout.
- **Corps : 14 px, interligne 20 px.** C'est la base de tout l'écran. Taille moyenne 13, petite 12, grande 15.
- **Titre de page : 28 px / 36, graisse 700**, couleur `#1A2C44`.
- **Intertitre de section : 24 px / 32** (« Votre aperçu », « Aujourd'hui »), ou 14 px / 20 graisse 600 pour un intertitre de panneau.
- **Chiffre clé : 30 px** ; sa partie décimale 15 px.
- **Libellé de menu / section : 12 px / 20**, `#3C4F69`.
- **Graisses : 400, 500, 600, 700.** Les boutons et l'entrée de menu active sont en 600.
- Interlignes disponibles : 16, 20, 24, 28, 32, 36, 40.
- Famille de styles : `heading`, `body`, `label`, `display`, chacun en `large / medium / small / xsmall`, avec des variantes `emphasized` et `subdued`.

## 4. Espacement, rayons, ombres

- **Espacement** (px) : 0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80. En usage courant : **2 · 4 · 8 · 16 · 24 · 32 · 48** (xxsmall à xxlarge).
- **Rayons** : 4 (très petit), **6 (par défaut : boutons, champs, puces, entrée de menu)**, 8, **12 (cartes, panneaux)**, 16 (grandes surfaces), pleine rondeur (pastilles).
- **Ombres, trois niveaux, toujours à deux couches** :
  - petite : `0 1px 1px rgba(0,0,0,.12), 0 2px 5px rgba(48,49,61,.08)` (cartes posées)
  - moyenne : `0 3px 6px rgba(0,0,0,.12), 0 7px 14px rgba(48,49,61,.08)`
  - grande / menus et fenêtres : `0 5px 15px rgba(0,0,0,.12), 0 15px 35px rgba(48,49,61,.08)`
  - très grande : la précédente plus `0 50px 100px rgba(48,49,61,.08)` (tiroirs)
  - action principale : `0 1px 1px rgba(20,19,78,.32)` (bouton très légèrement relevé).

## 5. Structure de l'écran

- **Haut de page** : une bande pleine largeur de 44 px (environnement de test : fond sombre, texte clair, un bouton d'action à droite).
- **Barre latérale** : 240 px de large, remplie de contenu à 20 px de marge, posée sur le fond de page ; le contenu commence à 280 px.
- **Panneau de contenu** : blanc, grand, coins arrondis en haut à gauche, marge de 40 px à droite.
- **Barre du haut du panneau** : recherche remplie à gauche (36 px de haut, 332 à 360 px de large, icône loupe à gauche à 32 px de retrait), aide, notifications, réglages et bouton « + » rond à droite.
- **Largeur de lecture** : le contenu s'étire jusqu'à environ 1 000 à 1 100 px, avec de larges marges.
- **Pied** : barre fixe « Développeurs » de 36 px en bas à gauche, et à droite quatre petits boutons-icônes (recherche de logs, alertes, flux, intégrations) et un chevron.

## 6. Composants

### Barre latérale
En haut : le compte (pastille à lettre, nom du compte, sous-nom, flèche). Puis la liste principale : Accueil, Soldes, Transactions, Clients, Catalogue de produits. Entrée : icône + libellé, 30 px de haut, rayon 6, texte 14/20. **Active : texte et icône en couleur d'action, graisse 600, sans fond.** Sections nommées en 12 px gris (« Raccourcis », « Produits ») : « Raccourcis » est une liste que l'utilisateur épingle lui-même (bouton « Épingler » au survol de chaque entrée, bouton « Gérer les raccourcis »). « Produits » : groupes repliables avec chevron (Payments, Billing, Reporting, Applications, Plus), qui se déplient en sous-liste décalée. La barre latérale défile seule quand elle déborde.

### Barre du haut
Recherche : champ rempli (pas de contour), icône loupe, placeholder gris. Au clic, une fenêtre s'ouvre dessous avec un indicateur de chargement, puis les suggestions, et un pied « Afficher plus de filtres ». À droite : aide, notifications, réglages, et un bouton « + » rond de couleur d'action qui ouvre le menu Créer. Le bouton « Guide de démarrage » (avec anneau de progression) n'apparaît que tant que la configuration n'est pas finie.

### Menu « Créer »
Petite fenêtre flottante sous le « + » : Facture, Abonnement, Lien de paiement, Paiement. Chaque ligne : icône, libellé, et à droite **un raccourci clavier affiché en puces** (`c` puis `i`). Ouverte au clavier, fermée par Échap. Le menu du compte propose aussi « Créer ».

### Notifications
Panneau ancré sous l'icône. Titre « Notifications », trois onglets-compteurs (Toutes 0, Action requise 0, Mises à jour 0), la sélection en contour de couleur d'action. Vide : « Vous êtes à jour. Si une action de votre part est requise, vous recevrez une notification ici. »

### Aide
Le bouton d'aide ouvre un **panneau latéral droit** pleine hauteur, qui pousse le contenu : « Nouvelle conversation avec l'assistant », message d'accueil, cinq suggestions en puces arrondies (« Où se trouve mon formulaire fiscal ? »…), zone de saisie avec pièce jointe et envoi, avertissement « l'IA peut faire des erreurs ». Fermable par une croix.

### Boutons
- **Principal** : fond d'action, texte blanc 14/20 graisse 600, **28 px de haut**, marge 4 × 8, rayon 6, ombre fine. Variante de formulaire plus haute (36 px).
- **Secondaire** : fond blanc, bordure `#D4DEE9`, texte `#273951`, même taille ; au survol la bordure fonce.
- **Destructif** : fond ou texte `#e61947`.
- **Discret / lien** : texte d'action, sans fond.
- **Désactivé** : même teinte très atténuée, jamais grisé en gris.
- Bouton carré à icône seule pour les actions d'en-tête (exporter, graphique, réglages), à côté du bouton principal (« + Créer un paiement »).

### Onglets
Texte seul, graisse 600, en ligne sous le titre, un filet de 1 px sous toute la rangée ; l'actif est en couleur d'action ou en encre avec un trait de 2 px dessous. Aucun fond.

### Puces de filtre
Rayon 6, bordure fine, texte 12-13 px ; une puce de filtre porte son nom en gris et sa valeur en couleur d'action, avec un chevron (« Plage de dates | 7 derniers jours ∨ »). Un petit « ⊗ » retire une puce. À droite de la rangée : « + Ajouter » et « ✎ Modifier » en secondaire, et deux boutons carrés (filtre, colonnes). L'actif de plusieurs filtres bascule en contour plus appuyé.

### Sélecteur de dates
Fenêtre large : à gauche les périodes prédéfinies (Aujourd'hui, 7 derniers jours, Mois en cours, Toutes les périodes), deux calendriers de mois côte à côte, deux champs « Début / Fin », la plage colorée en teinte d'action claire, extrémités pleines, boutons « Effacer » et « Appliquer » en bas à droite.

### Bandeaux d'information
Rectangle plein largeur, fond `#F4F7FA`, rayon 6-8, pictogramme d'ampoule à gauche, une phrase, un lien d'action à droite, une croix pour le masquer. Utilisés pour une suggestion utile, jamais pour une alerte.

### États vides et d'erreur
- **Vide simple** : pictogramme dans un carré gris, titre en gras, deux lignes d'explication, lien « En savoir plus → », un bouton d'action (parfois désactivé tant qu'une configuration manque).
- **Vide en pointillés** : cadre en pointillés avec une étiquette « Aucune donnée » au centre sur fond gris.
- **Grand bandeau de démarrage** : grand panneau teinté avec un titre de 36 px, une phrase, un bouton, puis **trois cartes de liens** dessous (titre, deux lignes, « En savoir plus »).
- **Erreur de chargement locale** : un pictogramme d'avertissement et une courte phrase (« Le graphique n'a pas pu être téléchargé ») *à l'endroit du contenu*, jamais une page d'erreur. Le reste de l'écran continue de fonctionner.
- **Chargement** : un seul indicateur circulaire centré dans la zone, pas de squelettes sur la première arrivée.

### Tableaux
En-têtes petits (12 px), gras, case à cocher en première colonne, lignes de 48 px séparées par un filet, pas de fond alterné, pagination discrète sous le tableau (« 1–1 sur 1 résultat » et deux flèches). Une rangée de puces de filtre et une recherche au-dessus.

### Fenêtres et tiroirs
- **Fenêtre centrée** pour un formulaire court : titre à gauche, croix à droite, contenu qui défile, pied fixe avec « Annuler » (secondaire) et l'action (principale). Voile bleuté clair derrière.
- **Tiroir large à deux colonnes** pour un formulaire riche : formulaire à gauche (libellés gras, phrase d'aide dessous), **aperçu à droite** avec totaux. Bouton « Fermer l'aperçu » pour retrouver de la largeur.
- **Assistant plein écran** pour une mise en service : étapes à gauche avec ligne pointillée, contenu à droite, « Enregistrer et quitter » en haut à droite, une barre de progression fine.
- **Questions de démarrage** : plein écran, colonne étroite centrée, barre de progression en haut à droite, « Retour » à gauche, « Passer » et « Continuer » à droite ; les choix sont des lignes grises avec case.

### Formulaires
Libellé gras au-dessus, phrase d'aide en gris sous le libellé, puis le champ (36 px, rayon 6, bordure en deux tons : haut plus foncé que bas). Focus : bordure bleue claire, pas d'ombre épaisse. Sections de réglages : libellé à gauche en gras, contrôles à droite, filet entre sections, interrupteurs, boutons « Annuler » et « Enregistrer » (désactivé tant que rien n'a changé).

### Guide de démarrage
Carte flottante en bas à droite, 290 px : titre, « Modifier », agrandir, fermer ; une barre de progression fine ; ligne « Étape suivante : … » ; agrandie, des sections repliables et des étapes à trois états (faite, à faire, verrouillée par un cadenas).

### Menus
Fenêtres de 8 px de rayon à ombre grande, lignes de 32 px, icône + libellé, séparateurs fins, titres de section en 12 px (« Workbench », « Documentation »), liens externes marqués d'une flèche, sous-menus à chevron. Le menu du compte : pastille, nom, bouton « Quitter l'environnement de test », Paramètres, Changer d'environnement, Créer, nom de l'utilisateur, Déconnexion.

## 7. Comportements

- **Navigation sans rechargement** : le clic sur une entrée change le contenu du panneau, l'adresse et le titre de l'onglet, sans clignotement. Chaque page a une adresse propre.
- **Raccourcis clavier partout** : séquences de deux touches pour créer (`c i`, `c s`, `c l`, `c p`), `N` pour ajouter sur une liste (affiché dans le bouton), Échap ferme tout.
- **Épingler** : l'utilisateur compose sa propre liste de raccourcis.
- **Panneaux qui poussent** (aide) et **tiroirs qui recouvrent** (création) : poussé pour consulter, recouvrant pour saisir.
- **États partiels** : chaque bloc se charge et échoue indépendamment.
- **Bascule d'environnement** visible en permanence (test / production) par la bande du haut.
- **Libellés en français complets**, y compris dans les calendriers, avec les termes métier de l'utilisateur.

## 8. Ce que Ronetz n'utilisera pas pour l'instant (noté pour plus tard)

Treasury, Radar (lutte contre la fraude), Connect, Atlas, Issuing, Terminal (lecteurs de cartes), Identity, Capital, Climate, Workflows, Projects, Workbench du développeur (journaux, webhooks, événements), clés d'API, assistant IA d'aide, comparaison de périodes à plusieurs devises, bascule d'environnement test/production, édition de la page d'accueil par l'utilisateur (« Ajouter / Modifier »), recherche à filtres, rapports et exports programmés, taxes, factures, abonnements récurrents. Certains reviendront : **le guide de démarrage, les notifications, le sélecteur de dates, les raccourcis clavier, l'aide en panneau latéral, la recherche** et **l'épinglage de raccourcis** sont directement utiles à un gérant ; le Workbench le sera pour Brice, le technicien.

## 9. Traduction pour Ronetz

| Stripe | Ronetz |
|---|---|
| Violet `#533afd` | Émeraude `#047857` (marque, action, entrée active, lien) |
| Gris-bleu froid | Même architecture de neutres, en gris froid sans teinte de vert (le sombre reste un graphite neutre) |
| Pile de polices du système | IBM Plex Sans si on garde la police de marque ; sinon la pile du système, à décider avec la charte |
| 14/20 base, titre 28/36 gras | Identiques |
| Rayons 6 / 12 | Identiques |
| Ombres à deux couches | Identiques, teinte neutre |
| Menu : Accueil, Soldes, Transactions, Clients, Catalogue | Accueil, Accès, Offres, Sites, Routeurs, Finances |
| « + » rond : Créer | Bouton « Vendre un accès » (action principale) |
| Menu Créer : Facture, Abonnement, Lien, Paiement | Vendre un accès, Créer une offre, Ajouter un routeur, Ajouter un site |
| Guide de démarrage | Idem : créer un site, ajouter un routeur, créer une offre, vendre un premier accès |
| Aide en panneau latéral avec IA | Aide en panneau latéral avec réponses sur les accès, les paiements et les routeurs (plus tard) |
| Tiroir à deux colonnes avec aperçu | Vendre un accès, créer une offre (aperçu : le ticket du client) |

## 10. Décisions prises le 2026-11-16 et appliquées

1. **Police : la pile du système** dans toute l'interface et la charte. IBM Plex est retirée (paquets désinstallés). Le caractère de la marque vient du logo, de la couleur et du ton.
2. **Neutres : un gris froid** sur dix pas (`--gray-0` à `--gray-900`). Le sombre est un graphite du même gris froid (`#0f1319` pour le fond, `#0a0d12` pour la coque).
3. **Marque : l'émeraude `#047857` reste la seule couleur vive.** Rampe de onze pas (`--emerald-25` à `900`) ; survol = 700, appui = 800 ; en sombre, le pas 300 (`#34d399`) sert aux liens et au focus.
4. **Taille de base 14/20**, titre de page 28/36 en 700, rayons 4 / 6 / 8 / 12 / 16, trois ombres à deux couches.
5. **Périmètre de la mise à jour de la charte : couleurs et neutres, typographie et tailles, composants et ombres, papeterie et supports.**

État d'application : jetons de l'application (`src/app/globals.css`), charte publiée (édition 2). Les maquettes de papeterie et de points de vente de la charte ont reçu les nouveaux neutres et les nouveaux poids de titre ; leur mise en page n'a pas été redessinée.
