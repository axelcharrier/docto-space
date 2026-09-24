# Fiche 07 — Interface : Tailwind v4, shadcn, thème

## Tailwind CSS v4

Tailwind = des classes utilitaires directement dans le JSX, au lieu de
fichiers CSS séparés : `className="flex flex-col gap-4 px-4 py-8"`.

Particularités de la **v4** (différente des tutos v3) :
- **Plus de `tailwind.config.js`** : la configuration est en CSS, dans
  `app/globals.css` (`@import "tailwindcss"`, `@theme inline { ... }`).
- Les couleurs sont des **variables CSS** (`--background`, `--primary`…)
  définies pour le thème clair (`:root`) et sombre (`.dark`). Les classes
  `bg-background`, `text-muted-foreground` s'appuient dessus.
- `@custom-variant dark (&:where(.dark, .dark *))` : le préfixe `dark:` suit la
  classe `.dark` posée sur `<html>` (par `next-themes`) plutôt que le réglage
  du système, pour que le bouton de thème ait le dernier mot.

Intégration via PostCSS : `postcss.config.mjs` → `@tailwindcss/postcss`.

## shadcn : des composants que tu possèdes

shadcn n'est **pas** une bibliothèque installée qu'on importe : c'est un
générateur qui **copie le code source** des composants dans
`components/ui/`. Tu peux (et dois) les modifier si besoin.

```bash
pnpm dlx shadcn@latest add dialog   # ajoute components/ui/dialog.tsx
```

`components.json` configure le générateur : style `base-lyra`, icônes
`phosphor`, alias `@/components/ui`.

### Base UI et la prop `render`

Ici, shadcn est construit sur **Base UI** (`@base-ui/react`), pas sur Radix
comme dans la plupart des tutos. Différence visible : pour qu'un bouton
s'affiche comme un lien, on utilise la prop **`render`** (pas `asChild`) :

```tsx
<Button nativeButton={false} render={<Link href="/astronaut/demandes/nouvelle" />}>
  <PlusIcon /> Nouvelle demande
</Button>

<DialogTrigger render={<Button size="sm" />}>Accepter</DialogTrigger>
```

`nativeButton={false}` indique à Base UI que l'élément rendu n'est pas un
`<button>` (pour l'accessibilité).

### Variantes avec `cva`

`components/ui/button.tsx` utilise `class-variance-authority` pour déclarer
les variantes (`variant: default | outline | destructive…`,
`size: sm | default | lg…`). `cn()` (`lib/utils.ts`) fusionne les classes.

## Deux niveaux de composants

| Dossier | Contenu | Exemple |
|---------|---------|---------|
| `components/ui/` | Briques génériques shadcn, sans logique métier | `button`, `card`, `dialog`, `field`, `combobox` |
| `components/` | Composants de l'application, qui composent les briques | `app-header`, `demande-status-badge`, `section-title`, `meta-line`, `prescription-lignes` |
| `app/<section>/` | Composants utilisés par une seule page | `demande-actions.tsx`, `prescription-dialog.tsx` |

Quand un bout de JSX se répète entre les deux espaces (médecin et
astronaute), on l'extrait dans `components/` : `PageHeader`,
`SectionTitle`, `MetaLine`, `NotificationsList`, `AnnulerConsultationButton`.

## Le thème clair/sombre

- `next-themes` pose la classe `dark` ou `light` sur `<html>`.
- `components/theme-provider.tsx` : wrapper `"use client"` pour que le root
  layout reste un Server Component.
- `suppressHydrationWarning` sur `<html>` : la classe est ajoutée avant que
  React ne s'hydrate, React ne doit pas s'en plaindre.

## Icônes : Phosphor

```tsx
import { PillIcon } from "@phosphor-icons/react/dist/ssr"; // dans un Server Component
import { TrashIcon } from "@phosphor-icons/react";         // dans un Client Component
```

Le sous-chemin `/dist/ssr` est nécessaire côté serveur (la version par
défaut utilise un contexte React, indisponible dans un Server Component).

## Toasts : Sonner

`<Toaster />` est monté une fois dans `app/layout.tsx`. Partout ailleurs :
`toast.success("…")`, `toast.error("…")`, ou `toast.custom(...)` pour un
contenu React (le compte à rebours d'annulation, voir ci-dessous).

### Exemple avancé : l'annulation avec délai

`components/annuler-consultation-button.tsx` montre comment l'UI peut
porter une règle métier :
1. Le clic n'appelle **pas** l'action : il ouvre un toast avec un compte à
   rebours de 15 s et un bouton « Revenir en arrière ».
2. Le toast vit dans le `<Toaster>` du root layout, donc il **survit** aux
   navigations et aux `router.refresh()` déclenchés par le WebSocket.
3. À la fin du délai, il appelle `annulerConsultation(demandeId)`.
4. Un `beforeunload` avertit si on ferme l'onglet pendant le décompte.

## Formulaires

`components/ui/field.tsx` fournit `Field`, `FieldLabel`, `FieldError`,
`FieldGroup` pour une mise en forme homogène. `components/datetime-field.tsx`
combine un calendrier (`react-day-picker`) et un sélecteur de créneaux de
30 min (`lib/slots.ts`), et soumet une valeur `"YYYY-MM-DDTHH:mm"` dans un
input caché — exactement ce qu'attend le schéma Zod.
