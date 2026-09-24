# Fiche 11 — Dans quel ordre développer ?

## La réponse courte

Pas « la route puis les composants ». Dans une application Next.js App Router
comme celle-ci, on développe **des données vers l'écran** :

```
schéma de données → validation → logique serveur (lectures/écritures)
      → page (Server Component) → composants interactifs (Client) → temps réel
```

Et à l'échelle du projet : d'abord un **squelette qui marche de bout en bout
jusqu'en production**, puis on ajoute les fonctionnalités **une tranche
verticale à la fois** (une fonctionnalité complète, de la base à l'écran,
avant de passer à la suivante).

---

## Pourquoi « des données vers l'écran » ?

1. **Chaque couche ne dépend que de celles du dessous.** La page importe
   `lib/data`, qui importe `lib/prisma`, qui dépend du schéma. En construisant
   de bas en haut, tu n'écris jamais de code qui appelle quelque chose qui
   n'existe pas encore.
2. **Les types remontent tout seuls.** Une fois le schéma Prisma écrit, le
   type de `listPrescriptionsMedecin()` est connu, donc les props de la page
   aussi. Si tu commences par l'écran, tu inventes une forme de données que
   tu devras ensuite adapter.
3. **Chaque étape est vérifiable seule.** Une migration se vérifie dans la
   base, une action avec un formulaire minimal, une page sans aucun style.
4. **La sécurité se pose au bon endroit.** Écrire l'action avant le
   formulaire force à penser « qui a le droit ? » et « que valider ? » avant
   « à quoi ça ressemble ? ».

> Exception légitime : si tu ne sais pas encore **ce que** l'écran doit
> montrer, fais une maquette (Figma, ou JSX avec des données en dur) pour
> clarifier le besoin. Mais jette-la ou branche-la ensuite **de bas en haut**.

---

## Partie 1 — L'ordre idéal pour le projet entier

### Phase 0 — Cadrage (avant tout code)

- Lister les **acteurs** (astronaute, médecin, ESP32, Authentik, Visio) et ce
  que chacun fait.
- Dessiner le **modèle de données** sur papier : entités, relations, statuts.
- Définir les **contrats avec l'extérieur**, en particulier ceux qu'on ne
  contrôle pas : format attendu par l'ESP32, API Visio, groupes Authentik.
- Repérer les **décisions d'architecture** qui impactent tout le reste. Ici :
  *« on veut du temps réel »* ⇒ serveur custom ⇒ change le `pnpm dev`, le
  Dockerfile et le déploiement.

### Phase 1 — Le squelette qui marche (« walking skeleton »)

Le but : une page vide, protégée par le SSO, qui lit la base, **en production**.

1. `create-next-app`, TypeScript, Tailwind.
2. Base de données : Prisma + MariaDB, modèles Auth.js (`User`, `Account`…),
   première migration, `lib/prisma.ts`.
3. Authentification : `auth.ts` avec Authentik, `/login`, `lib/roles.ts`,
   `lib/dal.ts`, `proxy.ts`, les deux layouts protégés + `forbidden.tsx`,
   la déconnexion.
4. Serveur custom `server.mjs` (même vide de WebSocket au début) si on sait
   déjà qu'on en aura besoin.
5. **Déploiement** : Dockerfile, compose, workflow GitHub Actions.
6. Le kit UI (shadcn, thème, `AppHeader`).

Pourquoi déployer si tôt ? Parce que les problèmes de production (HTTPS,
cookies `__Secure-`, redirect URI OIDC, reverse proxy, `0.0.0.0`) sont
indépendants des fonctionnalités, et qu'ils sont beaucoup plus faciles à
diagnostiquer sur une appli qui ne fait encore rien.

### Phase 2 — Les tranches verticales, dans l'ordre des dépendances métier

| # | Tranche | Dépend de |
|---|---------|-----------|
| 1 | Demande de consultation (astronaute crée, médecin voit) | squelette |
| 2 | Accepter / refuser (+ Visio) | 1 |
| 3 | Notifications (table + cloche + page) | 1, 2 |
| 4 | Temps réel (WebSocket + `AutoRefresh`) | 3 (les mêmes endroits appellent `notifyUsers`) |
| 5 | Référentiel médicaments (seed + recherche) | squelette |
| 6 | Prescriptions | 5 |
| 7 | Carte RFID + API distributeur | 6 |
| 8 | Affichage des prises / prochaine prise | 7 |
| 9 | Annulation de consultation | 2 |

Chaque tranche = une branche = une PR, testée avant de passer à la suivante.

### Comparaison avec ce qui a été fait réellement

L'historique git montre :

```
auth → base de données → shadcn → interface médecin → interfaces des deux côtés
→ déploiement (4 PR de corrections) → WebSocket → thème → refonte UI
→ prescriptions → RFID → API distributeur → prises UI → prochaine prise
→ quantité en entier → commentaires → annulation visio
```

C'est **globalement un bon ordre** : fondations d'abord, déploiement dès le
2ᵉ jour, puis des fonctionnalités par branches. Ce qu'on peut améliorer :

| Constat | Trace dans le code | Ce qu'il aurait fallu |
|---------|--------------------|------------------------|
| L'auth a été faite avant la base | `auth.ts` dit encore « no database in this project » alors qu'il y a un `PrismaAdapter` | Poser le schéma minimal (`User`) avant l'auth, ou mettre à jour les commentaires au moment du changement |
| Le déploiement a demandé plusieurs PR de correction | PR #6, #8, #10, #12, #21 | Le faire encore plus tôt, sur une appli quasi vide |
| Le WebSocket est arrivé après le déploiement | Le Dockerfile a dû abandonner `standalone` pour le serveur custom | Trancher « temps réel ou pas » dès la phase 0 |
| La quantité était d'abord un texte libre | migration `quantite_entiere` qui re-parse le texte | Définir le contrat de l'ESP32 **avant** le schéma des prescriptions : c'est lui qui a besoin d'un entier |
| Les commentaires ont été ajoutés après coup | PR #31/#32 | Les écrire au fil de l'eau, quand on sait encore *pourquoi* |
| Pas de tests automatisés | — | Au minimum sur `lib/prises.ts` et `lib/datetime.ts` (logique pure, critique pour la santé) |

---

## Partie 2 — L'ordre pour UNE fonctionnalité

Exemple réel : **l'annulation d'une consultation** (PR #34).

### Étape 1 — Le modèle de données

**Question** : qu'est-ce qui doit être stocké ?
→ un nouveau statut `ANNULEE`, qui a annulé (`annuleeParId`), quand
(`annuleeLe`), un nouveau type de notification `CONSULTATION_ANNULEE`.

- Modifier `prisma/schema.prisma`.
- `pnpm exec prisma migrate dev --name annulation_consultation`.
- Relire le SQL généré.

✅ *Vérif* : `pnpm exec prisma studio`, les colonnes existent.

### Étape 2 — Les règles métier pures

**Question** : quelles règles ne dépendent ni de la base ni de React ?
→ « une consultation dure 1 h max », « délai de 15 s pour revenir en arrière ».

- `lib/consultations.ts` : `DUREE_CONSULTATION_MS`,
  `debutConsultationsNonTerminees()`, `DELAI_ANNULATION_MS`.

### Étape 3 — La validation

**Question** : que reçoit-on de l'extérieur ?
→ un `demandeId` qui doit être un UUID.

- `lib/validation/demandes.ts` : `annulerConsultationSchema`.

### Étape 4 — Les lectures (`lib/data/`)

**Question** : quelles listes changent ?
→ les consultations terminées ou annulées ne doivent plus s'afficher.

- `lib/data/demandes.ts` : filtres `statut` / `dateConsultation`.

### Étape 5 — L'écriture (`lib/actions/`)

- `annulerConsultation(demandeId)` dans `lib/actions/demandes.ts`, en suivant
  la recette de la fiche 05 : **autoriser** (`requireSession` + la demande
  doit appartenir à l'utilisateur) → **valider** → **écrire** en transaction
  avec condition (`statut: "VALIDEE"`, pas terminée) + **notifications** pour
  les deux parties → **`notifyUsers`** → **`refresh()`** → **réponse**.

✅ *Vérif* : appeler l'action depuis un bouton brut, regarder la base.

### Étape 6 — La page (Server Component)

- `app/astronaut/page.tsx` et `app/doctor/page.tsx` : afficher l'état
  « annulée par vous / par le médecin », placer le bouton.
- `components/demande-status-badge.tsx` : libellé du nouveau statut.

### Étape 7 — Le composant interactif (Client Component)

- `components/annuler-consultation-button.tsx` : le bouton, le toast avec
  compte à rebours, « Revenir en arrière ».
- Partagé par les deux espaces, donc dans `components/` et non dans `app/`.

### Étape 8 — Temps réel et finitions

- Vérifier que les deux parties sont notifiées en direct (2 navigateurs, 2
  comptes).
- Libellés des notifications, états vides, messages d'erreur.

### Étape 9 — Vérifier et livrer

```bash
pnpm exec tsc --noEmit   # types
pnpm lint                # ESLint
pnpm build               # le build de prod passe
```

Tester les cas limites : double clic, deux utilisateurs en même temps,
mauvais rôle, consultation déjà terminée. Puis PR vers `develop`.

---

## Récapitulatif — la checklist à coller dans chaque PR

```
[ ] 1. Schéma Prisma + migration (SQL relu)
[ ] 2. Règles métier pures dans lib/ (paramètre `now` si ça dépend du temps)
[ ] 3. Schéma Zod dans lib/validation/
[ ] 4. Fonctions de lecture dans lib/data/ (filtrées sur session.user.id)
[ ] 5. Server Action : autoriser → valider → écrire (transaction) → notifier → refresh
[ ] 6. Page Server Component : afficher les données
[ ] 7. Composants client : formulaire / dialogue / interactions
[ ] 8. notifyUsers() pour les bonnes personnes, test à 2 navigateurs
[ ] 9. Variables d'env documentées dans deploy/.env.example si nouvelles
[ ] 10. tsc + lint + build, cas limites testés
```

Pour une **intégration externe** (API tierce, appareil), ajoute une étape 0 :
**écrire le contrat** (format des requêtes/réponses, authentification, codes
d'erreur) et le tester à la main avec `curl` avant de brancher quoi que ce
soit.
