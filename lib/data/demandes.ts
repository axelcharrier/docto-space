import "server-only";

import { prisma } from "@/lib/prisma";

export function listDemandesAstronaute(astronauteId: string) {
  return prisma.demandeConsultation.findMany({
    where: { astronauteId },
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
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.demandeConsultation.findMany({
    where: { medecinId, statut: "VALIDEE", dateConsultation: { gte: since } },
    include: { astronaute: { select: { name: true, email: true } } },
    orderBy: { dateConsultation: "asc" },
  });
}
