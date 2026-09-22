import { PillIcon } from "@phosphor-icons/react/dist/ssr";

type Ligne = {
  id: string;
  posologie: string;
  medicament: { denomination: string; formePharmaceutique: string };
};

// The medicine list of a prescription, rendered the same way for the doctor
// and the astronaut.
export function PrescriptionLignes({ lignes }: { lignes: Ligne[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lignes.map((ligne) => (
        <li key={ligne.id} className="flex items-start gap-3">
          <PillIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">{ligne.medicament.denomination}</p>
            <p className="text-muted-foreground">{ligne.posologie}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
