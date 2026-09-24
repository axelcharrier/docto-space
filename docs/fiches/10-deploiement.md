# Fiche 10 — Déploiement : Docker + GitHub Actions

## Vue d'ensemble

```mermaid
flowchart LR
  Dev[git push sur main] --> GA[GitHub Actions]
  GA -- build --> I1[image app]
  GA -- build --> I2[image migrate]
  I1 & I2 -- push --> R[(ghcr.io)]
  GA -- scp compose.yaml + ssh --> VPS
  subgraph VPS
    direction TB
    N[nginx HTTPS] --> APP[conteneur app :3000]
    MIG[conteneur migrate<br/>une fois puis s'arrête] --> DB[(MariaDB<br/>sur l'hôte)]
    APP --> DB
  end
```

Branches : on développe sur des branches de fonctionnalité → PR vers
`develop` → PR `develop` → `main` déclenche le déploiement.

## Le Dockerfile multi-étapes

Un seul `Dockerfile`, quatre étapes (*stages*) ; chacune part d'une autre
pour réutiliser le cache.

| Stage | Contenu | Sert à |
|-------|---------|--------|
| `deps` | `pnpm install --frozen-lockfile` | Base commune, en cache tant que le lockfile ne change pas |
| `builder` | `prisma generate` + `next build` puis `pnpm prune --prod` | Produire `.next/` et des `node_modules` sans dépendances de dev |
| `migrate` | CLI Prisma + `prisma/` | Image *one-shot* : `migrate deploy` puis `db seed` |
| `runner` | `.next`, `node_modules`, `server.mjs`, utilisateur non-root | L'image qui tourne en prod |

Points notables :
- **Variables factices au build** (`DATABASE_URL=mysql://build:build@...`) :
  `lib/prisma.ts` instancie l'adapter à l'import, et `next build` importe les
  modules. Aucune connexion n'est faite.
- **Pas de `output: "standalone"`** : cette optimisation de Next ne sait pas
  tracer un serveur custom comme `server.mjs` ; on copie donc `.next` et les
  `node_modules` élagués.
- **Utilisateur `nextjs` (uid 1001)** : le processus ne tourne pas en root.

## `deploy/compose.yaml`

```yaml
services:
  migrate:                       # tourne d'abord, puis s'arrête
    image: ghcr.io/axelcharrier/doctospace-migrate:latest
    restart: "no"
  app:
    image: ghcr.io/axelcharrier/doctospace:latest
    ports: ["127.0.0.1:3000:3000"]   # accessible seulement par nginx, pas depuis Internet
    depends_on:
      migrate: { condition: service_completed_successfully }  # pas de démarrage si la migration échoue
    healthcheck: ...             # GET /login doit répondre < 500
```

- `extra_hosts: host.docker.internal:host-gateway` : MariaDB tourne sur
  l'hôte, pas dans Docker ; ce nom permet aux conteneurs de l'atteindre.
- Les secrets sont dans un `.env` à côté du `compose.yaml` sur le VPS
  (droits 600), jamais dans le dépôt. La liste complète est dans
  `deploy/.env.example`.

## Le workflow GitHub Actions (`.github/workflows/deploy.yml`)

1. **build** : construit les stages `runner` et `migrate`, les pousse sur
   GHCR avec deux tags (`latest` et le SHA du commit, utile pour revenir en
   arrière). Cache Docker partagé via `type=gha`.
2. **deploy** :
   - copie `deploy/compose.yaml` sur le VPS (`scp`) : le fichier du dépôt est
     la seule source de vérité ;
   - en SSH : vérifie que `.env` existe, `docker compose pull`,
     `docker compose up -d`, affiche les logs en cas d'échec, nettoie les
     vieilles images.

`concurrency: deploy-production` : deux déploiements ne peuvent pas se
chevaucher.

Secrets GitHub nécessaires : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
(`GITHUB_TOKEN` est fourni automatiquement).

## Checklist quand on ajoute…

- **une variable d'environnement** → `deploy/.env.example` + le `.env` du VPS
  à la main + ton `.env.local`.
- **une migration** → rien à faire : le conteneur `migrate` l'appliquera. Mais
  vérifie qu'elle ne casse pas les données existantes (fiche 03).
- **un fichier lu à l'exécution par `server.mjs`** → vérifier qu'il est copié
  dans le stage `runner`.
