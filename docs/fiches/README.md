# Fiches explicatives — docto-space

Ces fiches s'adressent à un·e développeur·se qui découvre le projet **et** les
technologies qu'il utilise. Chaque fiche explique d'abord le concept en
général, puis montre comment il est appliqué ici, avec les fichiers à ouvrir.

## Le projet en une phrase

Une application de **téléconsultation pour astronautes** : un astronaute demande
une consultation, un médecin l'accepte (une salle de visio est créée), prescrit
des médicaments, et un **distributeur ESP32** délivre les doses quand
l'astronaute scanne sa carte RFID. Les deux interfaces se mettent à jour en
temps réel.

## Ordre de lecture conseillé

| #  | Fiche | Ce que tu y apprends |
|----|-------|----------------------|
| 01 | [Vue d'ensemble](01-vue-ensemble.md) | La stack, l'arborescence, le trajet d'une requête |
| 02 | [Next.js App Router](02-nextjs-app-router.md) | Routing par dossiers, Server vs Client Components, spécificités Next 16 |
| 03 | [Base de données : Prisma + MariaDB](03-prisma-base-de-donnees.md) | Schéma, migrations, seed, transactions |
| 04 | [Authentification SSO (OIDC + Authentik)](04-authentification-sso.md) | Le flow OIDC, les JWT, les rôles, la déconnexion |
| 05 | [Server Actions, formulaires et validation](05-server-actions-formulaires.md) | Comment un formulaire écrit en base, avec Zod |
| 06 | [Temps réel : WebSocket](06-temps-reel-websocket.md) | Pourquoi un serveur custom, comment les pages se rafraîchissent |
| 07 | [Interface : Tailwind, shadcn, thème](07-interface-ui.md) | Le design system et ses composants |
| 08 | [Intégrations externes : Visio, distributeur, référentiel](08-integrations-externes.md) | Les API tierces et l'API exposée à l'ESP32 |
| 09 | [Logique métier : dates et prises](09-logique-metier-dates-prises.md) | Fuseaux horaires, créneaux, calcul de la prochaine prise |
| 10 | [Déploiement : Docker + GitHub Actions](10-deploiement.md) | Du `git push` à la prod |
| 11 | [Dans quel ordre développer ?](11-ordre-de-developpement.md) | L'ordre idéal pour le projet et pour une fonctionnalité |

Si tu n'as le temps d'en lire que trois : **01**, **02** et **11**.

## Glossaire express

- **SSO** (*Single Sign-On*) : une seule connexion (ici chez Authentik) donne
  accès à plusieurs applications.
- **OIDC** (*OpenID Connect*) : le protocole standard utilisé pour ce SSO.
- **JWT** (*JSON Web Token*) : un jeton signé qui contient des infos sur
  l'utilisateur (id, rôle) ; on le stocke dans un cookie.
- **ORM** : bibliothèque qui traduit du code TypeScript en requêtes SQL
  (ici Prisma).
- **WebSocket** : connexion permanente entre navigateur et serveur, qui permet
  au serveur d'envoyer des messages sans que le navigateur les demande.
- **Server Action** : fonction serveur appelée directement depuis un formulaire
  React, sans écrire d'API REST.
- **RSC** (*React Server Component*) : composant React exécuté uniquement sur
  le serveur, qui peut lire la base de données directement.
