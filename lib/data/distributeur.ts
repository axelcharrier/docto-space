import "server-only";

import { prisma } from "@/lib/prisma";
import { HISTORIQUE_UTILE_MS, prochainePrise } from "@/lib/prises";

type Prise = {
  prescriptionId: string;
  medecinId: string;
  medicamentId: string;
  dateHeurePrevue: Date;
};

// Doses due right now for this astronaut, and not dispensed yet. Called
// inside the transaction of dispenserPrises() so the check and the write
// can't be interleaved with another scan.
async function prisesDues(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  astronauteId: string,
  now: Date,
) {
  // Only prescriptions that can still be running: the longest line is at
  // most 365 days (lib/validation/prescriptions.ts).
  const prescriptions = await tx.prescription.findMany({
    where: {
      astronauteId,
      datePrescription: { gt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      medecinId: true,
      datePrescription: true,
      lignes: {
        select: { medicamentId: true, moments: true, intervalleHeures: true, dureeJours: true },
      },
      prises: {
        where: { dateHeurePrevue: { gte: new Date(now.getTime() - HISTORIQUE_UTILE_MS) } },
        select: { medicamentId: true, dateHeurePrevue: true },
      },
    },
  });

  const dues: Prise[] = [];

  for (const prescription of prescriptions) {
    for (const ligne of prescription.lignes) {
      const prises = prescription.prises.filter((p) => p.medicamentId === ligne.medicamentId);
      const prochaine = prochainePrise(ligne, prescription.datePrescription, prises, now);
      if (!prochaine?.maintenant) continue;

      // Two lines of the same medicine on one prescription share a slot.
      const doublon = dues.some(
        (p) =>
          p.prescriptionId === prescription.id &&
          p.medicamentId === ligne.medicamentId &&
          p.dateHeurePrevue.getTime() === prochaine.date.getTime(),
      );
      if (doublon) continue;

      dues.push({
        prescriptionId: prescription.id,
        medecinId: prescription.medecinId,
        medicamentId: ligne.medicamentId,
        dateHeurePrevue: prochaine.date,
      });
    }
  }

  return dues;
}

export function findAstronauteByRfid(rfidUid: string) {
  return prisma.user.findFirst({
    where: { rfidUid, role: "ASTRONAUTE" },
    select: { id: true },
  });
}

// Decides what the dispenser may release now and records it as taken in
// the same transaction, so a second scan gets nothing for the same slot.
// Returns the CIS codes of the medicines to dispense, and the prescribing
// doctors so their open pages can be refreshed.
export async function dispenserPrises(astronauteId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    // Serializes scans of the same astronaut: interval doses have no fixed
    // slot for the unique index to catch a double scan on.
    await tx.$queryRaw`SELECT id FROM \`User\` WHERE id = ${astronauteId} FOR UPDATE`;

    const dues = await prisesDues(tx, astronauteId, now);
    if (dues.length > 0) {
      await tx.prisePlanifiee.createMany({
        data: dues.map((prise) => ({
          prescriptionId: prise.prescriptionId,
          medicamentId: prise.medicamentId,
          dateHeurePrevue: prise.dateHeurePrevue,
          datePrise: now,
          statut: "PRISE" as const,
        })),
      });
    }

    return {
      medicaments: dues.map((prise) => prise.medicamentId),
      medecinIds: dues.map((prise) => prise.medecinId),
    };
  });
}
