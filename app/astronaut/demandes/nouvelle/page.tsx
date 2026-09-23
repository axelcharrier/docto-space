import { toLocalInputValue } from "@/lib/datetime";
import { PageHeader } from "@/components/page-header";
import { NouvelleDemandeForm } from "./nouvelle-demande-form";

/**
 * Displays the page for creating a new consultation request
 * @returns The page containing the header and the application form
 */
export default function NouvelleDemandePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
      <PageHeader
        title="Nouvelle demande de consultation"
        description="Indiquez le créneau souhaité et décrivez vos symptômes. Tous les médecins seront notifiés."
      />
      <NouvelleDemandeForm minDateTime={toLocalInputValue(new Date())} />
    </main>
  );
}
