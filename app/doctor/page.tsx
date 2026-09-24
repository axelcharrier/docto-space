import {
  CalendarBlankIcon,
  ClockIcon,
  PencilSimpleIcon,
  PillIcon,
  PlusIcon,
  StethoscopeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { listConsultationsMedecin, listDemandesEnAttente } from "@/lib/data/demandes";
import { listAstronautes, listPrescriptionsMedecin } from "@/lib/data/prescriptions";
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
import { AnnulerConsultationButton } from "@/components/annuler-consultation-button";
import { MetaLine } from "@/components/meta-line";
import { PageHeader } from "@/components/page-header";
import { PrescriptionLignes } from "@/components/prescription-lignes";
import { SectionTitle } from "@/components/section-title";
import { DemandeActions } from "./demande-actions";
import { PrescriptionDialog, SupprimerPrescriptionDialog } from "./prescription-dialog";

/**
 * Protects and renders the doctor section layout
 * @param children The content to render inside the layout
 * @returns The layout containing the header and auto-refresh component
 */
export default async function DoctorPage() {
  const session = await auth();
  const medecinId = session!.user.id;
  const [demandes, consultations, prescriptions, astronautes] = await Promise.all([
    listDemandesEnAttente(),
    listConsultationsMedecin(medecinId),
    listPrescriptionsMedecin(medecinId),
    listAstronautes(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
      <PageHeader
        title="Espace médecin"
        description={`Connecté en tant que ${session?.user?.name ?? session?.user?.email}.`}
        action={
          <PrescriptionDialog
            astronautes={astronautes}
            trigger={
              <Button>
                <PlusIcon />
                Nouvelle prescription
              </Button>
            }
          />
        }
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
                  <CardFooter className="flex flex-wrap gap-2">
                    {c.lienVisio && (
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<a href={c.lienVisio} target="_blank" rel="noopener noreferrer" />}
                      >
                        <VideoCameraIcon />
                        Rejoindre la visio
                      </Button>
                    )}
                    <PrescriptionDialog
                      astronautes={astronautes}
                      astronauteId={c.astronauteId}
                      demandeId={c.id}
                      trigger={
                        <Button size="sm" variant="outline">
                          <PillIcon />
                          Prescrire
                        </Button>
                      }
                    />
                    <AnnulerConsultationButton demandeId={c.id} />
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle icon={PillIcon} count={prescriptions.length}>
          Mes prescriptions
        </SectionTitle>

        {prescriptions.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune prescription émise. Vous pouvez prescrire depuis une consultation ou
            directement, sans rendez-vous.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {prescriptions.map((p) => (
              <li key={p.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{p.astronaute.name ?? p.astronaute.email}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <MetaLine icon={ClockIcon} label="Prescrite le">
                        Prescrite le {formatDateTime(p.datePrescription)}
                      </MetaLine>
                      {p.demande?.dateConsultation && (
                        <MetaLine icon={CalendarBlankIcon} label="Consultation du">
                          Suite à la consultation du {formatDateTime(p.demande.dateConsultation)}
                        </MetaLine>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <PrescriptionLignes
                      lignes={p.lignes}
                      datePrescription={p.datePrescription}
                      prises={p.prises}
                    />
                    {p.commentaire && (
                      <p className="border-t pt-4 whitespace-pre-line text-muted-foreground">
                        {p.commentaire}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <PrescriptionDialog
                      astronautes={astronautes}
                      prescription={p}
                      trigger={
                        <Button size="sm" variant="outline">
                          <PencilSimpleIcon />
                          Modifier
                        </Button>
                      }
                    />
                    <SupprimerPrescriptionDialog prescriptionId={p.id} />
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
