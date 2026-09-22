import {
  CalendarBlankIcon,
  ClockIcon,
  StethoscopeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
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
import { MetaLine } from "@/components/meta-line";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { DemandeActions } from "./demande-actions";

export default async function DoctorPage() {
  const session = await auth();
  const [demandes, consultations] = await Promise.all([
    listDemandesEnAttente(),
    listConsultationsMedecin(session!.user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
      <PageHeader
        title="Espace médecin"
        description={`Connecté en tant que ${session?.user?.name ?? session?.user?.email}.`}
      />

      <section className="flex flex-col gap-4">
        <SectionTitle icon={StethoscopeIcon} count={demandes.length}>
          Demandes en attente
        </SectionTitle>

        {demandes.length === 0 ? (
          <p className="text-muted-foreground">Aucune demande de consultation en attente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {demandes.map((demande) => (
              <li key={demande.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{demande.astronaute.name ?? demande.astronaute.email}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <MetaLine icon={CalendarBlankIcon} label="Créneau souhaité">
                        {formatDateTime(demande.dateSouhaitee)}
                      </MetaLine>
                      <MetaLine icon={ClockIcon} label="Demande reçue le">
                        Reçue le {formatDateTime(demande.createdAt)}
                      </MetaLine>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{demande.commentaire}</p>
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
        <SectionTitle icon={CalendarBlankIcon} count={consultations.length}>
          Mes consultations planifiées
        </SectionTitle>

        {consultations.length === 0 ? (
          <p className="text-muted-foreground">Aucune consultation à venir.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consultations.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{c.astronaute.name ?? c.astronaute.email}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      {c.dateConsultation && (
                        <MetaLine icon={CalendarBlankIcon} label="Consultation le">
                          {formatDateTime(c.dateConsultation)}
                        </MetaLine>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{c.commentaire}</p>
                  </CardContent>
                  {c.lienVisio && (
                    <CardFooter>
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<a href={c.lienVisio} target="_blank" rel="noopener noreferrer" />}
                      >
                        <VideoCameraIcon />
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
