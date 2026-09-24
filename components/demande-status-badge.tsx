import type { StatutDemande } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUTS: Record<StatutDemande, { label: string; variant: "outline" | "default" | "destructive" }> = {
  EN_ATTENTE: { label: "En attente", variant: "outline" },
  VALIDEE: { label: "Planifiée", variant: "default" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
};

/**
 * Renders a badge displaying the status of a consultation request.
 * @param statut - The status of the consultation request.
 * @returns The status badge component.
 */
export function DemandeStatusBadge({ statut }: { statut: StatutDemande }) {
  const { label, variant } = STATUTS[statut];
  return <Badge variant={variant}>{label}</Badge>;
}
