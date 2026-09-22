import Link from "next/link";
import { auth } from "@/auth";
import { listDemandesAstronaute } from "@/lib/data/demandes";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DemandeStatusBadge } from "@/components/demande-status-badge";
import { ToastOnMount } from "@/components/toast-on-mount";

export default async function AstronautPage({ searchParams }: PageProps<"/astronaut">) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const demandes = await listDemandesAstronaute(session!.user.id);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      {params.created && (
        <ToastOnMount message="Demande envoyée aux médecins" clearTo="/astronaut" />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Espace astronaute</h1>
          <p className="text-muted-foreground">
            Connecté en tant que {session?.user?.name ?? session?.user?.email}.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/astronaut/demandes/nouvelle" />}>
          Nouvelle demande de consultation
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Mes demandes ({demandes.length})</h2>

        {demandes.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune demande pour le moment. Décrivez vos symptômes pour solliciter un médecin.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {demandes.map((demande) => (
              <li key={demande.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <DemandeStatusBadge statut={demande.statut} />
                      <span>Souhaité le {formatDateTime(demande.dateSouhaitee)}</span>
                    </CardTitle>
                    <CardDescription>
                      Demande envoyée le {formatDateTime(demande.createdAt)}
                      {demande.medecin && ` · ${demande.medecin.name ?? demande.medecin.email}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="whitespace-pre-line text-sm">{demande.commentaire}</p>

                    {demande.statut === "VALIDEE" && demande.dateConsultation && (
                      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                        <span className="text-sm font-medium">
                          Consultation le {formatDateTime(demande.dateConsultation)}
                        </span>
                        {demande.lienVisio && (
                          <Button
                            size="sm"
                            nativeButton={false}
                            render={
                              <a href={demande.lienVisio} target="_blank" rel="noopener noreferrer" />
                            }
                          >
                            Rejoindre la visio
                          </Button>
                        )}
                      </div>
                    )}

                    {demande.statut === "REFUSEE" && (
                      <p className="border-t pt-3 text-sm text-muted-foreground">
                        {demande.motifRefus
                          ? `Motif du refus : ${demande.motifRefus}`
                          : "Demande refusée sans motif."}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
