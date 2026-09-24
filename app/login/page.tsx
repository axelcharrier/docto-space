import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { ROLE_HOME_PATH } from "@/lib/roles";

/**
 * Displays the login page and redirects authenticated users to their role-based home page.
 * @param searchParams - The page search parameters containing an optional callback URL.
 * @returns The login page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user?.role) {
    redirect(callbackUrl ?? ROLE_HOME_PATH[session.user.role]);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16">
      <h1 className="text-3xl font-semibold">Connexion</h1>
      <form
        action={async () => {
          "use server";
          await signIn("authentik", { redirectTo: callbackUrl ?? "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Se connecter avec Authentik
        </button>
      </form>
    </main>
  );
}
