# Compte de développement local (valeurs de test, base locale uniquement)
Email : dev@ronetz.test
Mot de passe : Dev-3TSyztzTutlK
Organisation : Cyber Akwa
Backend local : http://localhost:8080 (copie de platform lancée hors dépôt)

## Compte d'essai d'onboarding (créé par l'inscription de l'application)
Email : onboarding@ronetz.test
Mot de passe : Onb-Test-7Kq2Lm9X
Organisation : Cyber Bonamoussadi (Cameroun)
Liste d'attente : Burkina Faso (essai)

## Compte de test onboarding (sans organisation)
- E-mail : onboarding-card@test.local
- Mot de passe : Test-123364efc2a0

## Mode simulé (sans backend)
Lancer : `NEXT_PUBLIC_ENABLE_MOCKS=true NEXT_DIST_DIR=.next-mock npx next dev --port 4177`
(ou l'entrée « front-simule » de `.claude/launch.json` à la racine du dépôt).
Connexion : n'importe quelle adresse et n'importe quel mot de passe.
Données : organisation « Cyber Akwa » (Douala), 4 sites, 6 routeurs, 12 offres, ~47 accès, ventes de la semaine.
Les modifications restent dans le navigateur (stockage local) ; elles sont remises à zéro après 6 heures
ou en vidant la clé `ronetz-mock-db-v1`. Code : `src/mocks/`. Interdit en staging et production.
Non simulés : achat public par Mobile Money (`/connect/...`), administration de la plateforme (refus 403).
