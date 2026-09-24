# Fiche 05 — Server Actions, formulaires et validation

## Qu'est-ce qu'une Server Action ?

Une fonction `async` déclarée dans un fichier qui commence par `"use server"`.
On peut la passer directement à un `<form action={...}>`. Next.js se charge de
créer un endpoint HTTP caché, d'envoyer les champs du formulaire en
`FormData`, et d'exécuter la fonction sur le serveur.

```tsx
// Sans Server Action : écrire une route API, un fetch, gérer le JSON...
// Avec : 
<form action={creerDemande}>...</form>
```

Tous les fichiers de `lib/actions/` sont des Server Actions (sauf `form.ts`
et `types.ts`, qui sont des utilitaires).

## Le pattern standard d'une action dans ce projet

Toutes les actions d'écriture suivent la même recette. Exemple
simplifié de `refuserDemande` (`lib/actions/demandes.ts`) :

```ts
"use server";

export async function refuserDemande(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // 1. AUTORISATION — toujours en premier
  const session = await requireRole("doctor");

  // 2. VALIDATION — ne jamais faire confiance au formulaire
  const parsed = refuserDemandeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Formulaire invalide", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  // 3. ÉCRITURE — en transaction, avec condition anti-course
  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.demandeConsultation.updateMany({ where: { ..., statut: "EN_ATTENTE" }, data: {...} });
    if (count === 0) return false;
    await tx.notification.create({ data: {...} });   // 4. NOTIFICATION persistée
    return true;
  });
  if (!ok) return { status: "error", message: "Cette demande a déjà été traitée." };

  // 5. TEMPS RÉEL — prévenir les autres navigateurs
  await notifyMedecinsEt(demande.astronauteId);

  // 6. RAFRAÎCHIR la page de l'appelant + RÉPONDRE
  refresh();
  return { status: "success", message: "Demande refusée" };
}
```

Retiens les 6 étapes : **autoriser → valider → écrire (+ notification) →
notifier en temps réel → rafraîchir → répondre**.

## Le type `ActionState`

```ts
// lib/actions/types.ts
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
```

Un contrat unique entre toutes les actions et tous les formulaires : le
formulaire sait toujours comment afficher le résultat.

## Côté formulaire : `useActionState` + `useFormStatus`

```tsx
"use client";
export function NouvelleDemandeForm({ minDateTime }: { minDateTime: string }) {
  const [state, action] = useActionState(creerDemande, idleState);
  useActionToast(state);                 // toast succès/erreur

  return (
    <form action={action}>
      <DateTimeField name="dateSouhaitee" min={minDateTime} />
      <FieldError errors={errorsFor(state, "dateSouhaitee")} />   {/* erreur sous le champ */}
      <Textarea name="commentaire" />
      <FieldError errors={errorsFor(state, "commentaire")} />
      <SubmitButton>Envoyer la demande</SubmitButton>
    </form>
  );
}
```

- **`useActionState(action, initial)`** (React 19) : enveloppe l'action, garde
  en mémoire son dernier retour (`state`). C'est pour ça que les actions ont
  la signature `(prevState, formData)`.
- **`useFormStatus()`** : utilisé dans `SubmitButton` pour désactiver le
  bouton et afficher « Envoi… » pendant la requête. Il doit être dans un
  composant **enfant** du `<form>`.
- **`useActionToast(state, onSuccess)`** (`lib/actions/form.ts`) : affiche le
  toast et permet par exemple de fermer le dialogue au succès.
- **`errorsFor(state, "champ")`** : récupère les erreurs Zod d'un champ.
- Le `name` de chaque input = la clé dans le `FormData` = la clé du schéma Zod.
  Les ids (`demandeId`) passent par des `<input type="hidden">`.

## La validation avec Zod

Zod décrit la forme attendue des données et produit à la fois la
**vérification à l'exécution** et le **type TypeScript**.

```ts
// lib/validation/demandes.ts
export const creerDemandeSchema = z.object({
  dateSouhaitee: futureDateTime,     // string → Date, doit être dans le futur
  commentaire: z.string().trim()
    .min(10, "Décrivez vos symptômes (10 caractères minimum)")
    .max(2000, "2000 caractères maximum"),
});
```

- **`.safeParse()`** ne lève pas d'exception : il renvoie `{ success, data }`
  ou `{ success: false, error }`.
- **`.transform()`** convertit en même temps qu'il valide (texte
  `"2026-09-25T14:30"` → objet `Date` en heure de Paris).
- **`.check()`** (Zod 4) permet des règles qui portent sur plusieurs champs
  (« si mode = MOMENTS, au moins un moment coché »).
- Les messages d'erreur sont en français : ils s'affichent tels quels sous
  les champs.

La validation HTML (`required`, `minLength`) côté client améliore
l'expérience, mais **seule la validation serveur compte** : un formulaire
peut être forgé.

### Cas particulier : les listes dynamiques

Une prescription contient un nombre variable de lignes. Plutôt que de
multiplier les champs `lignes[0][codeCis]`…, le formulaire met toute la liste
en JSON dans **un** champ caché ; le schéma fait `JSON.parse` puis valide
chaque ligne (`lignesField` dans `lib/validation/prescriptions.ts`). Les
erreurs d'une ligne remontent avec une clé `lignes.0.moments`.

### Partager du code entre client et serveur

`lib/validation/*` n'a pas `server-only` : `formatPosologie()` est utilisée
côté serveur pour enregistrer la posologie **et** côté client pour
l'aperçu en direct. Une seule fonction = le médecin voit exactement ce que
l'astronaute lira.

## Autres formes d'appel d'action

- **Action sans état** : `<form action={logout}>` ou `marquerLue(formData)`,
  quand il n'y a rien à afficher en retour.
- **Action inline** dans un Server Component (`app/login/page.tsx`) :
  ```tsx
  <form action={async () => { "use server"; await signIn("authentik"); }}>
  ```
- **Appel direct depuis du JS client** : `await annulerConsultation(demandeId)`
  dans un `setTimeout` (`components/annuler-consultation-button.tsx`). Une
  action est une fonction async comme une autre, on peut l'appeler sans
  formulaire.

## Messages après redirection

`creerDemande` redirige vers `/astronaut?created=1`. La page détecte le
paramètre et affiche `<ToastOnMount>`, qui montre le toast puis nettoie l'URL
avec `router.replace("/astronaut")` (sinon un rechargement réafficherait le
toast).
