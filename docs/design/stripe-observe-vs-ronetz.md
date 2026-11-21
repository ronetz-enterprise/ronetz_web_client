# Stripe observé contre Ronetz (2026-11-16)

Relevé dans le tableau de bord Stripe (mode test), avec des données créées pour l'occasion : un client « Awa Ndongo », un paiement réussi de 25 $ (carte de test 4242), un paiement refusé de 8 $ (carte de test 0002). Captures 29 à 39 dans `references/stripe-dashboard/`. **Ce qui est noté ici a été vu, rien n'est supposé.**

Non vu : la page de connexion (le compte est connecté, la voir demande de se déconnecter de Stripe). Les tiroirs latéraux, les réglages et les soldes remplis n'ont pas été rouverts aujourd'hui.

## 1. Tableau (capture 38)

| Stripe | Ronetz aujourd'hui | À faire |
|---|---|---|
| Aucun intertitre entre les lignes | Intertitres « Aujourd'hui » inventés | **Retirés** |
| Première colonne : case à cocher | Absente | Ajouter si une action groupée existe (sinon non) |
| Montant en premier, gras, devise en gris (« 25,00 $ USD ») | Montant en dernier | Mettre le montant en premier là où il y en a un |
| État : petite pastille teintée, rayon 4 | Pastille proche | Ajuster : vert « Réussi », rouge « Échoué » |
| Filtres : boutons rectangulaires encadrés, l'actif à bordure foncée ; « … » pour la suite ; à droite « filtre » et bouton de colonnes | Puces teintées émeraude | Refaire en boutons encadrés neutres |
| Onglets texte soulignés sous le titre (Paiements, Virements…) | Onglets présents sur certaines pages | Généraliser |
| Recherche dans la barre du haut uniquement (et pleine largeur sur Clients) | Recherche à côté des filtres | Recherche pleine largeur sous les filtres, comme Clients |
| Pagination « < > 1 à 2 sur 2 résultats » en bas à gauche, petite | Boutons Précédent / Suivant | Refaire en flèches seules + texte |
| Boutons en haut à droite du titre : exporter, analyser, « + Créer » | « Créer un accès » seul | Ajouter l'export plus tard |

## 2. Détail d'un élément (captures 31, 39)

**Stripe ouvre une page entière, pas un panneau latéral.** Fil d'Ariane (« Transactions »), grand titre (montant + pastille d'état), sous-titre, actions en haut à droite (« Remboursement », « … »). Colonne principale : « Activité récente » en frise, « Détail du paiement » (montant, frais, net), sections à bouton « + » et cases vides en pointillés. Colonne droite : « Détails », paires libellé / valeur, crayon pour modifier.

Écart : Ronetz utilise un panneau poussé (choix antérieur du propriétaire). **À trancher.**

## 3. Création (captures 30, 32, 33, 34, 36, 37)

- **Formulaire court → fenêtre centrée** (« Créer un client ») : titre + croix, intertitre gras, libellé gras + petite aide, pied « Annuler » / action.
- **Formulaire riche → page plein écran** (« Créer un paiement ») : barre du haut « × Titre » à gauche, boutons à droite (« Valider et créer un autre », « Créer ») ; colonne étroite centrée ; choix en deux grandes tuiles (« Ponctuel » / « Récurrent »).
- Menu « + Créer » : liste avec description de deux lignes et raccourci clavier par élément.
- Erreur de champ : bordure rouge + « Spécifiez une valeur » sous le champ.
- Erreur globale : bandeau rouge pleine largeur sous la barre, avec un lien.
- **Succès : écran centré**, coche, « Paiement réussi », phrase avec lien, deux boutons (« Envoyer le reçu », « Nouveau paiement »).
- Bouton indisponible : grisé, une infobulle dit pourquoi.

Écart : « Vendre un accès » est un tiroir à deux colonnes. Le modèle Stripe est la page plein écran, puis l'écran de succès (identifiant et mot de passe à la place du reçu).
