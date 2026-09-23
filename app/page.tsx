import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_HOME_PATH } from "@/lib/roles";

/**
 * Displays the home page and redirects authenticated users to their role-based page.
 * @returns The application home page.
 */
export default async function Home() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(ROLE_HOME_PATH[session.user.role]);
  }

  if (session?.user) {
    // Authenticated, but not a member of the "doctor" or "astronaut"
    // group in Authentik: nothing in the app to send them to.
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-16 text-center">
        <h1 className="text-3xl font-semibold">Aucun accès</h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Votre compte n&apos;appartient à aucun rôle connu (doctor /
          astronaut) dans Authentik.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16">
      <h1 className="text-3xl font-semibold">docto-space</h1>
      <a
        href="/login"
        className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Se connecter
      </a>
    </main>
  );
}
