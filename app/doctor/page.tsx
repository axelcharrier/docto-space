import { auth } from "@/auth";

export default async function DoctorPage() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-16">
      <h1 className="text-3xl font-semibold">Espace docteur</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Connecté en tant que {session?.user?.name ?? session?.user?.email}.
      </p>
    </main>
  );
}
