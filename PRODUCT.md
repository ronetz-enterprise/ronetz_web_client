# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Gérants de zones Wi-Fi (cybercafés, boutiques, hôtels, hotspots de quartier) en Afrique francophone, d'abord au Cameroun. Ils travaillent sur un téléphone Android modeste, avec peu de temps, souvent devant un client qui attend. Persona principal : Serge, une zone, deux routeurs MikroTik. Autres : Aïcha (revendeuse, plusieurs sites, employés), Kevin (client final qui achète un accès par Mobile Money), Brice (technicien qui installe les routeurs). Voir `web-app/personas-parcours-ronetz.html` (hypothèses, pas encore confirmées par des entretiens).

## Product Purpose

Ronetz permet aux gérants de vendre leur connexion Wi-Fi, d'encaisser par Mobile Money, de suivre chaque franc et de garder leur réseau en marche. Réussite : un gérant sans formation technique vend un premier accès le jour même, et sait le soir combien il a gagné.

## Positioning

Un outil de gérant, pas un outil de réseau : l'argent, les accès et l'état des routeurs dans les mots du gérant, avec la transparence d'un registre de caisse.

## Operating Context

Backend Spring Modulith (`platform/`), nœud réseau Python avec FreeRADIUS et WireGuard (`node-agent/`), front en cours de migration de React Router vers Next.js (`web-app/ronett-web-next`, déployé sur Vercel). Paiements par Mobile Money (Flutterwave). Devise FCFA, montants écrits « 12 500 FCFA ».

## Capabilities and Constraints

Typographie : pile du système. Technologies conservées : React 19, TanStack Query, Tailwind 4, shadcn (style base-vega) sur Base UI, zod, react-hook-form. Aucun terme de backend à l'écran (RADIUS, UUID, projection…). Français, vouvoiement, phrases courtes. Thèmes clair et sombre à égalité ; le sombre est un graphite neutre, jamais teinté de vert. Utilisable à 360 px sans défilement horizontal, cibles tactiles ≥ 44 px. Pas de barre de navigation en bas sur téléphone (décision de l'utilisateur).

## Brand Commitments

Nom « ronetz » en minuscules, logo fourni par l'utilisateur (un R surmonté d'ondes Wi-Fi), émeraude `#047857` comme seule couleur de marque, la pile de polices du système (aucune police chargée), un gris froid pour les neutres. Valeurs : fiabilité, transparence, proximité, simplicité. Signature « Votre Wi-Fi, vos recettes, en clair. » (à confirmer). Charte : `web-app/charte-graphique-ronetz.html`.
Référence visuelle contraignante : le tableau de bord Stripe (captures dans `docs/design/references/stripe-dashboard/`), à interpréter avec l'identité Ronetz, sans copier sa marque ni ses couleurs.

## Evidence on Hand

Personas et parcours, charte graphique, `platform/docs/`, captures du tableau de bord Stripe. Les chiffres, noms et données affichés dans les gabarits sont des exemples.
