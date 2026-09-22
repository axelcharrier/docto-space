import Link from "next/link";
import {
  CalendarBlankIcon,
  ClockIcon,
  PlusIcon,
  StethoscopeIcon,
  UserIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
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
import { MetaLine } from "@/components/meta-line";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { ToastOnMount } from "@/components/toast-on-mount";

export default async function AstronautPage({ searchParams }: PageProps<"/astronaut">) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const demandes = await listDemandesAstronaute(session!.user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
      {params.created && (
        <ToastOnMount message="Demande envoyée aux médecins" clearTo="/astronaut" />
      )}

      <PageHeader
        title="Espace astronaute"
        description={`Connecté en tant que ${session?.user?.name ?? session?.user?.email}.`}
        action={
          <Button nativeButton={false} render={<Link href="/astronaut/demandes/nouvelle" />}>
            <PlusIcon />
            Nouvelle demande
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <SectionTitle icon={StethoscopeIcon} count={demandes.length}>
          Mes demandes
        </SectionTitle>

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
                    <CardDescription className="flex flex-col gap-1">
                      <MetaLine icon={ClockIcon} label="Demande envoyée le">
                        Envoyée le {formatDateTime(demande.createdAt)}
                      </MetaLine>
                      {demande.medecin && (
                        <MetaLine icon={UserIcon} label="Médecin">
                          {demande.medecin.name ?? demande.medecin.email}
                        </MetaLine>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="whitespace-pre-line">{demande.commentaire}</p>

                    {demande.statut === "VALIDEE" && demande.dateConsultation && (
                      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                        <MetaLine icon={CalendarBlankIcon} label="Consultation le">
                          <span className="font-medium text-foreground">
                            Consultation le {formatDateTime(demande.dateConsultation)}
                          </span>
                        </MetaLine>
                        {demande.lienVisio && (
                          <Button
                            size="sm"
                            nativeButton={false}
                            render={
                              <a href={demande.lienVisio} target="_blank" rel="noopener noreferrer" />
                            }
                          >
                            <VideoCameraIcon />
                            Rejoindre la visio
                          </Button>
                        )}
                      </div>
                    )}

                    {demande.statut === "REFUSEE" && (
                      <p className="border-t pt-4 text-muted-foreground">
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
