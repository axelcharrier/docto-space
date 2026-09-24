import "server-only";

import { prisma } from "@/lib/prisma";
import { debutConsultationsNonTerminees } from "@/lib/consultations";

// Planned or cancelled consultations drop out of the list once their slot is
// over; pending and refused requests have no slot and always stay.
export function listDemandesAstronaute(astronauteId: string) {
  return prisma.demandeConsultation.findMany({
    where: {
      astronauteId,
      OR: [
        { dateConsultation: null },
        { dateConsultation: { gte: debutConsultationsNonTerminees() } },
      ],
    },
    include: { medecin: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function listDemandesEnAttente() {
  return prisma.demandeConsultation.findMany({
    where: { statut: "EN_ATTENTE", medecinId: null },
    include: { astronaute: { select: { name: true, email: true } } },
    orderBy: { dateSouhaitee: "asc" },
  });
}

export function listConsultationsMedecin(medecinId: string) {
  return prisma.demandeConsultation.findMany({
    where: {
      medecinId,
      statut: "VALIDEE",
      dateConsultation: { gte: debutConsultationsNonTerminees() },
    },
    include: { astronaute: { select: { name: true, email: true } } },
    orderBy: { dateConsultation: "asc" },
  });
}
