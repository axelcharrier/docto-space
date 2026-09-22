import { auth } from "@/auth";
import { listConsultationsMedecin, listDemandesEnAttente } from "@/lib/data/demandes";
import { formatDateTime, toLocalInputValue } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DemandeActions } from "./demande-actions";

export default async function DoctorPage() {
  const session = await auth();
  const [demandes, consultations] = await Promise.all([
    listDemandesEnAttente(),
    listConsultationsMedecin(session!.user.id),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-10 p-8 sm:p-16">
      <div>
        <h1 className="text-3xl font-semibold">Espace médecin</h1>
        <p className="text-muted-foreground">
          Connecté en tant que {session?.user?.name ?? session?.user?.email}.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Demandes en attente ({demandes.length})</h2>

        {demandes.length === 0 ? (
          <p className="text-muted-foreground">Aucune demande de consultation en attente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {demandes.map((demande) => (
              <li key={demande.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {demande.astronaute.name ?? demande.astronaute.email}
                    </CardTitle>
                    <CardDescription>
                      Créneau souhaité : {formatDateTime(demande.dateSouhaitee)} · demande du{" "}
                      {formatDateTime(demande.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm">{demande.commentaire}</p>
                  </CardContent>
                  <CardFooter>
                    <DemandeActions
                      demandeId={demande.id}
                      dateSouhaiteeInput={toLocalInputValue(demande.dateSouhaitee)}
                      minDateTime={toLocalInputValue(new Date())}
                    />
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          Mes consultations planifiées ({consultations.length})
        </h2>

        {consultations.length === 0 ? (
          <p className="text-muted-foreground">Aucune consultation à venir.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consultations.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{c.astronaute.name ?? c.astronaute.email}</CardTitle>
                    <CardDescription>
                      {c.dateConsultation && formatDateTime(c.dateConsultation)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm">{c.commentaire}</p>
                  </CardContent>
                  {c.lienVisio && (
                    <CardFooter>
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<a href={c.lienVisio} target="_blank" rel="noopener noreferrer" />}
                      >
                        Rejoindre la visio
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
