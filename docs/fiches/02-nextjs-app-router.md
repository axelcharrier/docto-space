# Fiche 02 — Next.js (App Router)

> Le projet utilise **Next.js 16**. Plusieurs choses ont changé par rapport aux
> tutos que tu trouveras en ligne (voir « Pièges Next 16 » en bas). En cas de
> doute, la doc de la version installée est dans `node_modules/next/dist/docs/`.

## 1. Le routing par dossiers

Dans l'App Router, **l'URL = le chemin du dossier dans `app/`**. Certains noms
de fichiers ont un sens spécial :

| Fichier | Rôle |
|---------|------|
| `page.tsx` | Le contenu de l'URL. Sans `page.tsx`, le dossier n'est pas une route. |
| `layout.tsx` | Enveloppe toutes les pages du dossier et de ses sous-dossiers. Reste monté pendant la navigation. |
| `route.ts` | Un endpoint HTTP (GET, POST…) au lieu d'une page. |
| `forbidden.tsx` | Affiché quand le code appelle `forbidden()` (403). |
| `[param]/` | Segment dynamique. `[...nextauth]` = capture tous les sous-chemins. |

Dans ce projet :

```
app/layout.tsx                      → enveloppe TOUT (html, thème, toasts)
app/astronaut/layout.tsx            → enveloppe /astronaut/** (garde de rôle + header)
app/astronaut/page.tsx              → /astronaut
app/astronaut/demandes/nouvelle/page.tsx → /astronaut/demandes/nouvelle
app/api/medicaments/route.ts        → GET /api/medicaments?q=...
```

Les layouts s'emboîtent : `/astronaut/notifications` est rendu comme
`RootLayout > AstronautLayout > AstronautNotificationsPage`.

Un fichier qui n'est pas un nom spécial (ex. `nouvelle-demande-form.tsx`,
`demande-actions.tsx`) peut vivre dans `app/` à côté de la page qui l'utilise
sans créer de route. C'est pratique pour les composants propres à une seule page.

## 2. Server Components vs Client Components — LE concept à comprendre

Par défaut, **tout composant est un Server Component** : il s'exécute sur le
serveur, peut être `async`, peut lire la base de données, et n'envoie **aucun
JavaScript** au navigateur (seulement le HTML résultant).

```tsx
// app/astronaut/page.tsx — Server Component
export default async function AstronautPage() {
  const session = await auth();
  const demandes = await listDemandesAstronaute(session!.user.id); // requête SQL directe !
  return <ul>{demandes.map(...)}</ul>;
}
```

Dès qu'un composant a besoin d'**interactivité** (état `useState`, effets
`useEffect`, `onClick`, API du navigateur…), il doit commencer par
`"use client"` : c'est un Client Component, son code est envoyé au navigateur.

```tsx
// components/auto-refresh.tsx — Client Component
"use client";
export function AutoRefresh() {
  useEffect(() => { /* ouvre un WebSocket */ }, []);
  return null;
}
```

**Règles pratiques :**

- Un Server Component peut importer et afficher un Client Component (en lui
  passant des props sérialisables : string, number, objets simples, Date).
- Un Client Component **ne peut pas** importer un Server Component ni
  `lib/prisma.ts`. Les fichiers qui ne doivent jamais partir chez le client
  commencent par `import "server-only"` (`lib/dal.ts`, `lib/data/*`,
  `lib/events.ts`) : si on se trompe, la compilation échoue.
- Garde les `"use client"` **le plus bas possible** dans l'arbre. Exemple ici :
  la page médecin est serveur, seul le dialogue `DemandeActions` est client.

| Dans ce projet | Serveur | Client |
|----------------|---------|--------|
| Pages (`page.tsx`) | ✅ toutes | |
| Layouts | ✅ | |
| `AppHeader`, `NotificationBell`, `LogoutButton` | ✅ | |
| Formulaires, dialogues, `AutoRefresh`, `AnnulerConsultationButton`, `MedicamentCombobox`, `ThemeToggle` | | ✅ |

## 3. Les trois façons de faire tourner du code serveur

| Mécanisme | Où | Pour quoi | Exemple |
|-----------|----|-----------|---------|
| **Server Component** | `page.tsx`, `layout.tsx` | **Lire** et afficher | `app/doctor/page.tsx` |
| **Server Action** | fichier avec `"use server"` | **Écrire** suite à une action utilisateur | `lib/actions/demandes.ts` |
| **Route Handler** | `app/api/**/route.ts` | Endpoint HTTP appelé par autre chose qu'un formulaire React | `app/api/distributeur/prises/route.ts` (ESP32), `app/api/medicaments/route.ts` (fetch pendant la frappe) |

Règle simple : si c'est ton propre formulaire React qui écrit → Server Action.
Si c'est un appareil, un service externe ou un `fetch` au fil de la frappe →
Route Handler. Les Server Actions sont détaillées dans la fiche 05.

## 4. Le rafraîchissement des données

Les pages sont rendues côté serveur. Pour afficher des données à jour, il faut
**re-rendre** la page :

- `refresh()` (importé de `next/cache`) — **dans une Server Action** : demande
  au navigateur qui a appelé l'action de re-rendre la page courante.
- `router.refresh()` (de `useRouter`) — **dans un Client Component** : même
  effet, déclenché côté client. C'est ce que fait `AutoRefresh` quand le
  WebSocket reçoit un message.
- `redirect("/astronaut?created=1")` — change de page après une action.

`router.refresh()` ne recharge pas la page : il re-demande le rendu serveur et
React fusionne le résultat, l'état des composants client (dialogue ouvert,
champ en cours de saisie) est conservé.

## 5. Le proxy (ex-middleware)

`proxy.ts` s'exécute **avant** chaque requête correspondant à son `matcher`
(`/doctor/:path*`, `/astronaut/:path*`). Ici il fait un contrôle rapide :
« y a-t-il une session ? sinon → `/login?callbackUrl=...` ».

Il ne vérifie **pas** le rôle : ça, c'est le layout qui le fait avec
`requireRole()` (fiche 04). Le proxy est une optimisation, pas la sécurité.

## 6. `forbidden()` et `authInterrupts`

`next.config.ts` active `experimental.authInterrupts`. Cela permet d'appeler
`forbidden()` n'importe où dans le rendu serveur : Next.js arrête le rendu,
renvoie un vrai **HTTP 403** et affiche `app/forbidden.tsx`.

## 7. Pièges Next 16 (vs les tutos plus anciens)

- **`middleware.ts` s'appelle maintenant `proxy.ts`** et tourne sur le runtime
  Node.js (plus Edge).
- **`params` et `searchParams` sont des Promises** : il faut les `await`.
  ```tsx
  export default async function Page({ searchParams }: PageProps<"/astronaut">) {
    const params = await searchParams;
  ```
- **`PageProps<"/route">` et `LayoutProps<"/route">`** sont des types globaux
  générés par Next : pas besoin de les importer, et ils connaissent les
  paramètres de chaque route.
- **`refresh()` de `next/cache`** : nouvelle API pour rafraîchir depuis une
  action (avant, on utilisait `revalidatePath`).
- **`headers()` et `cookies()` sont asynchrones** : `await headers()`
  (voir `lib/logout.ts`).
