# Déploiement du nouveau front (Next.js) sur Vercel

Le nouveau front se déploie sur **Vercel**, qui construit Next.js nativement : pas de Docker, pas de `render.yaml`, pas de `output: "standalone"`, et pas de `vercel.json` (rien n'y serait utile : le relais `/api` vit dans `next.config.ts`). Il tourne **à côté** de l'ancien front (`web-app/ronett-web-client`), qui reste en service jusqu'à la bascule.

## Projet Vercel

| Réglage          | Valeur                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| Root Directory   | `web-app/ronett-web-next`                                                 |
| Framework Preset | Next.js (détecté)                                                         |
| Build / Install  | par défaut (`next build`, `npm install` sur `package-lock.json`)          |
| Node.js          | 24.x (réglage du projet ; `engines` du `package.json` demande `>=24 <25`) |

Créer un **nouveau** projet Vercel : l'ancien front n'est pas touché.

## Variables d'environnement

| Variable                   | Portée                                            | Production                                         | Preview                                            |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | **Publique** (code du navigateur), figée au build | vide (même origine : le navigateur appelle `/api`) | vide                                               |
| `NEXT_PUBLIC_APP_ENV`      | **Publique**, figée au build                      | `production`                                       | `preview`                                          |
| `NEXT_PUBLIC_ENABLE_MOCKS` | **Publique**, figée au build                      | `false`                                            | `false`                                            |
| `API_PROXY_TARGET`         | **Serveur seulement**                             | URL du backend de production                       | URL d'un **backend de test**, jamais la production |

`API_PROXY_TARGET` est la cible du rewrite `/api/:path*` de `next.config.ts`. Marquer la variable comme sensible dans Vercel si l'URL ne doit pas être visible. Aucun secret dans une `NEXT_PUBLIC_*` : sa valeur est lisible par tout visiteur.

## Points d'attention

- **Changer une `NEXT_PUBLIC_*` impose un redéploiement.** Ces valeurs sont écrites dans le code du navigateur pendant le build. Modifier la variable dans Vercel n'affecte pas les déploiements existants ; il faut redéployer (sans le cache de build en cas de doute).
- **`API_PROXY_TARGET` est lue dans `next.config.ts`, donc à la construction** : un changement de cible demande aussi un redéploiement.
- **Preview sans backend de production.** Chaque branche et chaque PR produit un déploiement Preview. Si `API_PROXY_TARGET` y pointait vers la production, une relecture pourrait écrire sur de vraies données (paiements compris). Définir la variable explicitement pour l'environnement Preview.
- **Cookies de session.** Le relais same-origin doit garder le cookie de rafraîchissement en first-party. Après le premier déploiement, vérifier dans les outils du navigateur (onglet Réseau) sur `/api/...` : les en-têtes `Set-Cookie` (domaine, `Secure`, `HttpOnly`, `SameSite`), le cookie et l'en-tête XSRF renvoyés, puis qu'une session survit à un rechargement et à un rafraîchissement du jeton. Côté backend, vérifier que le cookie n'est pas lié au domaine de l'ancien front.
- CORS : inutile tant que `NEXT_PUBLIC_API_BASE_URL` est vide ; sinon autoriser la nouvelle origine côté backend.

## Mise en place et bascule

1. Créer le projet (Root Directory ci-dessus), renseigner les variables pour Production et Preview, déployer.
2. Recetter les parcours sur l'adresse `*.vercel.app` de production du nouveau projet, et contrôler les cookies (voir ci-dessus).
3. **Bascule du domaine** : retirer le domaine public de l'ancien service, l'ajouter au projet Vercel et ajuster le DNS selon les indications de Vercel. Prévoir une fenêtre calme.
4. Ne pas supprimer l'ancien front : le garder pendant une période d'observation.

## Retour arrière

- **Mauvais déploiement du nouveau front** : _Instant Rollback_ dans Vercel (Deployments → déploiement précédent → Instant Rollback), ou promotion d'un ancien déploiement vers la production. Un rollback restaure aussi les anciennes valeurs `NEXT_PUBLIC_*` de ce build.
- **Bascule ratée** : rattacher le domaine à l'ancien service et le retirer du projet Vercel ; l'ancien front tourne toujours, aucune reconstruction n'est nécessaire.

## Origines autorisées par le backend (vérifié le 2026-11-16)

Le backend refuse (HTTP 403, « Invalid CORS request ») toute requête dont l'en-tête `Origin` n'est pas dans `RONETZ_WEB_ALLOWED_ORIGINS` (propriété `ronetz.web.allowed-origins`). Le relais `/api` de Next.js transmet l'`Origin` du navigateur tel quel : le domaine du front doit donc figurer dans cette liste côté backend, sans quoi inscription, connexion et rafraîchissement échouent.

- Production : ajouter le domaine du front (ex. `https://app.ronetz.com`).
- Aperçus Vercel : chaque déploiement d'aperçu a une adresse différente. Prévoir soit un alias d'aperçu stable à autoriser, soit une liste de motifs côté backend ; décision à prendre avec `backend-argent` avant d'ouvrir les aperçus au public.
- Local : `http://localhost:4176` ou le port utilisé par `next dev`.
