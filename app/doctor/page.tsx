import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DoctorPage() {
  const session = await auth();

  const demandes = await prisma.demandeConsultation.findMany({
    where: { medecinId: session!.user.id, statut: "EN_ATTENTE" },
    include: { astronaute: true },
    orderBy: { dateSouhaitee: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-3xl font-semibold">Espace docteur</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Connecté en tant que {session?.user?.name ?? session?.user?.email}.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          Consultations demandées ({demandes.length})
        </h2>

        {demandes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Aucune demande de consultation en attente.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {demandes.map((demande) => (
              <li
                key={demande.id}
                className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {demande.astronaute.name ?? demande.astronaute.email}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {demande.dateSouhaitee.toLocaleDateString("fr-FR")} à{" "}
                    {demande.heureSouhaitee.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {demande.commentaire && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {demande.commentaire}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
