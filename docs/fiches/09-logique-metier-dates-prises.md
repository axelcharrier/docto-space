# Fiche 09 — Logique métier : dates, créneaux et prises

Cette fiche couvre le code « pur » de `lib/` : des fonctions sans base de
données ni React, faciles à lire et à tester isolément.

## Le problème des fuseaux horaires

- En base, une date est un **instant** (stocké en UTC).
- Pour l'utilisateur, une date est une **heure murale** (« jeudi 14h30 à
  Paris »).
- Le serveur tourne en UTC dans Docker, le navigateur est à l'heure locale :
  si on laisse faire `new Date("2026-09-25T14:30")`, le résultat dépend de la
  machine qui l'exécute.

**Choix du projet** : tout est interprété dans **un seul fuseau**,
`APP_TIMEZONE = "Europe/Paris"` (`lib/datetime.ts`), quelle que soit la
machine.

| Fonction | Rôle |
|----------|------|
| `parseLocalDateTime("2026-09-25T14:30")` | Heure de Paris → `Date` (instant UTC). Gère le changement d'heure été/hiver. |
| `toLocalInputValue(date)` | `Date` → `"YYYY-MM-DDTHH:mm"` à l'heure de Paris (valeur de formulaire) |
| `formatDateTime(date)` | Affichage : « jeudi 25 septembre 2026 à 14:30 » |
| `formatJourHeure(date, now)` | « aujourd'hui à 12:00 », « demain à 08:00 »… |
| `debutJourLocal(date)` | Minuit (heure de Paris) du jour donné |

Le format `"YYYY-MM-DDTHH:mm"` est le **format d'échange** entre formulaire et
serveur : le champ date l'envoie, Zod le convertit via `parseLocalDateTime`.

## Les créneaux de consultation (`lib/slots.ts`)

Créneaux de 30 min, de 8h à 20h. Utilisés par `DateTimeField` pour proposer
une liste d'heures au lieu d'une saisie libre.

## La durée d'une consultation (`lib/consultations.ts`)

Aucune heure de fin n'est stockée : on considère qu'une consultation dure au
plus 1 h (`DUREE_CONSULTATION_MS`). Après, elle est terminée : elle disparaît
des listes et ne peut plus être annulée. `debutConsultationsNonTerminees()`
renvoie « maintenant − 1 h », utilisé dans les `where` Prisma.

`DELAI_ANNULATION_MS = 15 s` : le délai pendant lequel on peut revenir sur
une annulation (fiche 07).

## Posologie : deux modes

Une ligne de prescription est soit :
- **MOMENTS** : à des moments de la journée (`MATIN` 8h, `MIDI` 12h, `SOIR`
  19h, `COUCHER` 22h) ;
- **INTERVALLE** : toutes les N heures (1 à 24).

…pendant `dureeJours` jours, à raison de `quantite` unités par prise.

On stocke à la fois :
- la **phrase lisible** (`posologie`, générée par `formatPosologie`) affichée
  à l'astronaute ;
- les **champs structurés** (`moments` en JSON, `intervalleHeures`,
  `dureeJours`) pour pouvoir ré-éditer la ligne et **calculer** les prises.

## Le calcul de la prochaine prise (`lib/prises.ts`)

`prochainePrise(ligne, datePrescription, prisesDejaFaites, now)` est **la**
fonction centrale. Elle est utilisée par :
- le distributeur (« dois-je délivrer maintenant ? ») ;
- les cartes de prescription (« prochaine prise : demain à 08:00 »).

Une seule fonction pour les deux garantit qu'ils ne se contredisent jamais.

Elle renvoie `{ date, maintenant }` ou `null` si le traitement est fini.

### Mode MOMENTS

```
Pour chaque jour à partir d'aujourd'hui, pour chaque moment trié :
  créneau = jour + heure du moment
  si créneau ≥ fin du traitement         → null (terminé)
  si créneau + 1h < maintenant            → passé, on continue
  si créneau − 1h > maintenant            → { créneau, maintenant: false } (à venir)
  sinon (fenêtre ±1h ouverte) :
     déjà délivré ? on continue : { créneau, maintenant: true }
```

La **fenêtre** d'une heure de part et d'autre (`FENETRE_MS`) : un astronaute
peut prendre sa dose du matin entre 7h et 9h.

### Mode INTERVALLE

```
aucune prise encore, ou dernière prise + N heures ≤ maintenant → { now, maintenant: true }
sinon → { dernière + N h, maintenant: false }   (si avant la fin du traitement)
```

### Pourquoi on ne charge que l'historique récent

`HISTORIQUE_UTILE_MS` = 25 h : une prise plus ancienne ne peut plus influencer
la suivante (les moments sont espacés de 24 h max, les intervalles aussi).
Les requêtes ne chargent donc que les prises des dernières 25 h.

### Pourquoi `PrisePlanifiee` pointe vers la prescription et pas la ligne

Modifier une prescription **supprime et recrée** ses lignes
(`modifierPrescription`). Si les prises étaient rattachées aux lignes,
l'historique du jour disparaîtrait et le distributeur redonnerait une dose
déjà prise. En les rattachant à `(prescription, médicament)`, l'historique
survit à la modification.

## Conseil pour ce genre de code

Ces fonctions reçoivent `now` en paramètre au lieu d'appeler `new Date()`
elles-mêmes. C'est ce qui les rend testables : on peut simuler « nous sommes
le 25 à 7h45 » sans toucher à l'horloge.
