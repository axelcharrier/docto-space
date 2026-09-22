import { toLocalInputValue } from "@/lib/datetime";
import { NouvelleDemandeForm } from "./nouvelle-demande-form";

export default function NouvelleDemandePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-3xl font-semibold">Nouvelle demande de consultation</h1>
        <p className="text-muted-foreground">
          Indiquez le créneau souhaité et décrivez vos symptômes. Tous les médecins seront notifiés.
        </p>
      </div>
      <NouvelleDemandeForm minDateTime={toLocalInputValue(new Date())} />
    </main>
  );
}
