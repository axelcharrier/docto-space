import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Retrieves the consultation requests created by an astronaut.
 * @param astronauteId - The identifier of the astronaut.
 * @returns The astronaut's consultation requests with assigned doctor details.
 */
export function listDemandesAstronaute(astronauteId: string) {
  return prisma.demandeConsultation.findMany({
    where: { astronauteId },
    include: { medecin: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves all pending consultation requests without an assigned doctor.
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
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.demandeConsultation.findMany({
    where: { medecinId, statut: "VALIDEE", dateConsultation: { gte: since } },
    include: { astronaute: { select: { name: true, email: true } } },
    orderBy: { dateConsultation: "asc" },
  });
}
