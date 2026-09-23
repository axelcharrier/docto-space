import { CheckCircleIcon, PillIcon } from "@phosphor-icons/react/dist/ssr";
import { formatHeure } from "@/lib/datetime";

type Ligne = {
  id: string;
  medicamentId: string;
  posologie: string;
  medicament: { denomination: string; formePharmaceutique: string };
};

type Prise = { medicamentId: string; datePrise: Date | null };

// The medicine list of a prescription, rendered the same way for the doctor
// and the astronaut. `prises` are today's doses released by the dispenser.
export function PrescriptionLignes({ lignes, prises = [] }: { lignes: Ligne[]; prises?: Prise[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lignes.map((ligne) => {
        const heures = prises
          .filter((prise) => prise.medicamentId === ligne.medicamentId && prise.datePrise)
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
