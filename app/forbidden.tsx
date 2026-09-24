import Link from "next/link";

/**
 * Displays the 403 forbidden page when the user does not have access.
 * @returns The forbidden access page.
 */
export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-3xl font-semibold">403 — Accès refusé</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Votre rôle ne vous donne pas accès à cette page.
      </p>
      <Link href="/" className="font-medium underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
