import "server-only";

import { prisma } from "@/lib/prisma";
import { debutJourLocal } from "@/lib/datetime";

const LIGNES_INCLUDE = {
  lignes: {
    include: {
      medicament: { select: { codeCis: true, denomination: true, formePharmaceutique: true } },
    },
    orderBy: { medicament: { denomination: "asc" } },
  },
} as const;

// Doses the dispenser released today (lib/data/distributeur.ts), shown
// under each medicine so the doctor and the astronaut can follow the day.
function prisesDuJour() {
  return {
    prises: {
      where: { datePrise: { gte: debutJourLocal(new Date()) } },
      select: { medicamentId: true, datePrise: true },
      orderBy: { datePrise: "asc" },
    },
  } as const;
}

// The one place astronauts are isolated from each other: always filter on the
// session's own id, never on an id coming from the client.
export function listPrescriptionsAstronaute(astronauteId: string) {
  return prisma.prescription.findMany({
    where: { astronauteId },
    include: {
      ...LIGNES_INCLUDE,
      ...prisesDuJour(),
      medecin: { select: { name: true, email: true } },
      demande: { select: { dateConsultation: true } },
    },
    orderBy: { datePrescription: "desc" },
  });
}

export function listPrescriptionsMedecin(medecinId: string) {
  return prisma.prescription.findMany({
    where: { medecinId },
    include: {
      ...LIGNES_INCLUDE,
      ...prisesDuJour(),
      astronaute: { select: { id: true, name: true, email: true } },
      demande: { select: { dateConsultation: true } },
    },
    orderBy: { datePrescription: "desc" },
  });
}

// Official catalogue lookup behind the prescription combobox. Capped
// because the table holds ~13 600 rows (see prisma/seed.ts) and the doctor
// only ever needs the first matches.
export const MEDICAMENTS_LIMIT = 20;

const MEDICAMENT_SELECT = {
  codeCis: true,
  denomination: true,
  formePharmaceutique: true,
} as const;

export async function searchMedicaments(query: string) {
  const q = query.trim();

  if (!q) {
    return prisma.medicament.findMany({
      select: MEDICAMENT_SELECT,
      orderBy: { denomination: "asc" },
      take: MEDICAMENTS_LIMIT,
    });
  }

  // Two passes so "doliprane" offers DOLIPRANE before CODOLIPRANE: a plain
  // alphabetical `contains` buries the obvious match under prefixed brands.
  const debut = await prisma.medicament.findMany({
    where: { denomination: { startsWith: q } },
    select: MEDICAMENT_SELECT,
    orderBy: { denomination: "asc" },
    take: MEDICAMENTS_LIMIT,
  });

  if (debut.length >= MEDICAMENTS_LIMIT) return debut;

  const reste = await prisma.medicament.findMany({
    where: {
      denomination: { contains: q },
      codeCis: { notIn: debut.map((m) => m.codeCis) },
    },
    select: MEDICAMENT_SELECT,
    orderBy: { denomination: "asc" },
    take: MEDICAMENTS_LIMIT - debut.length,
  });

  return [...debut, ...reste];
}

export type MedicamentOption = Awaited<ReturnType<typeof searchMedicaments>>[number];

export function listAstronautes() {
  return prisma.user.findMany({
    where: { role: "ASTRONAUTE" },
    select: { id: true, name: true, email: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
}

export type PrescriptionAstronaute = Awaited<
  ReturnType<typeof listPrescriptionsAstronaute>
>[number];

export type PrescriptionMedecin = Awaited<ReturnType<typeof listPrescriptionsMedecin>>[number];
