import { CheckCircleIcon, ClockIcon, PillIcon } from "@phosphor-icons/react/dist/ssr";
import { debutJourLocal, formatHeure, formatJourHeure } from "@/lib/datetime";
import { FENETRE_MS, prochainePrise } from "@/lib/prises";

type Ligne = {
  id: string;
  medicamentId: string;
  posologie: string;
  moments: string | null;
  intervalleHeures: number | null;
  dureeJours: number | null;
  medicament: { denomination: string; formePharmaceutique: string };
};

type Prise = { medicamentId: string; dateHeurePrevue: Date; datePrise: Date | null };

/**
 * Returns the label describing the next scheduled medication intake.
 * @param ligne - The medication prescription line.
 * @param datePrescription - The date when the prescription starts.
 * @param prises - The recorded medication intakes.
 * @param now - The current date and time.
 * @returns The label describing the next intake or whether the treatment is finished.
 */
function libelleProchaine(ligne: Ligne, datePrescription: Date, prises: Prise[], now: Date) {
  const prochaine = prochainePrise(ligne, datePrescription, prises, now);
  if (!prochaine) return "Traitement terminé";
  if (!prochaine.maintenant) return `Prochaine prise ${formatJourHeure(prochaine.date, now)}`;
  // A moment of the day stays available until the end of its window.
  return ligne.intervalleHeures
    ? "À prendre maintenant"
    : `À prendre maintenant, jusqu'à ${formatHeure(new Date(prochaine.date.getTime() + FENETRE_MS))}`;
}

// The medicine list of a prescription, rendered the same way for the doctor
// and the astronaut. `prises` are the recent doses released by the
// dispenser: today's are listed, and they decide the next one.
export function PrescriptionLignes({
  lignes,
  datePrescription,
  prises = [],
}: {
  lignes: Ligne[];
  datePrescription: Date;
  prises?: Prise[];
}) {
  const now = new Date();
  const debutJour = debutJourLocal(now);

  return (
    <ul className="flex flex-col gap-3">
      {lignes.map((ligne) => {
        const prisesLigne = prises.filter((prise) => prise.medicamentId === ligne.medicamentId);
        const heures = prisesLigne
          .filter((prise) => prise.datePrise && prise.datePrise >= debutJour)
          .map((prise) => formatHeure(prise.datePrise!));

        return (
          <li key={ligne.id} className="flex items-start gap-3">
            <PillIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">{ligne.medicament.denomination}</p>
              <p className="text-muted-foreground">{ligne.posologie}</p>
              {heures.length > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircleIcon className="size-4 shrink-0" aria-hidden />
                  Pris aujourd&apos;hui à {heures.join(" · ")}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ClockIcon className="size-4 shrink-0" aria-hidden />
                {libelleProchaine(ligne, datePrescription, prisesLigne, now)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
