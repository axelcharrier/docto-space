import "server-only";

import { prisma } from "@/lib/prisma";
import { debutConsultationsNonTerminees } from "@/lib/consultations";

/**
 * Retrieves the consultation requests created by an astronaut.
 * @param astronauteId - The identifier of the astronaut.
 * @returns The astronaut's consultation requests with assigned doctor details.
 */
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

/**
 * @returns The pending consultation requests with astronaut details.
 */
export function listDemandesEnAttente() {
  return prisma.demandeConsultation.findMany({
    where: { statut: "EN_ATTENTE", medecinId: null },
    include: { astronaute: { select: { name: true, email: true } } },
    orderBy: { dateSouhaitee: "asc" },
  });
}

/**
 * Retrieves a doctor's validated consultations from the last 24 hours.
 * @param medecinId - The identifier of the doctor.
 * @returns The doctor's recent consultations with astronaut details.
 */
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
