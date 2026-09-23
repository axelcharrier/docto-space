import "server-only";

import { prisma } from "@/lib/prisma";
import { parseLocalDateTime, toLocalInputValue } from "@/lib/datetime";
import type { Moment } from "@/lib/validation/prescriptions";

// Wall-clock hour (APP_TIMEZONE) of each moment of the day, and how far
// from it the dispenser still accepts the dose.
const HEURE_MOMENT: Record<Moment, number> = {
  MATIN: 8,
  MIDI: 12,
  SOIR: 19,
  COUCHER: 22,
};
const HEURE_MS = 60 * 60 * 1000;
const JOUR_MS = 24 * HEURE_MS;
const FENETRE_MS = HEURE_MS;

type Prise = {
  prescriptionId: string;
  medecinId: string;
  medicamentId: string;
  dateHeurePrevue: Date;
};

// Start of the moment's slot today, if `now` falls within its window.
function creneauEnCours(moment: Moment, now: Date) {
  const jour = toLocalInputValue(now).slice(0, 10);
  const heure = String(HEURE_MOMENT[moment]).padStart(2, "0");
  const debut = parseLocalDateTime(`${jour}T${heure}:00`);
  if (!debut) return null;
  return Math.abs(now.getTime() - debut.getTime()) <= FENETRE_MS ? debut : null;
}

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
    where: { astronauteId, datePrescription: { gt: new Date(now.getTime() - 365 * JOUR_MS) } },
    select: {
      id: true,
      medecinId: true,
      datePrescription: true,
      lignes: { select: { medicamentId: true, moments: true, intervalleHeures: true, dureeJours: true } },
      prises: {
        select: { medicamentId: true, dateHeurePrevue: true },
        orderBy: { dateHeurePrevue: "desc" },
      },
    },
  });

  const dues: Prise[] = [];

  for (const prescription of prescriptions) {
    const debut = prescription.datePrescription.getTime();

    for (const ligne of prescription.lignes) {
      const fin = debut + (ligne.dureeJours ?? 0) * JOUR_MS;
      if (now.getTime() < debut || now.getTime() >= fin) continue;

      const dejaPrises = prescription.prises.filter((p) => p.medicamentId === ligne.medicamentId);
      const base = {
        prescriptionId: prescription.id,
        medecinId: prescription.medecinId,
        medicamentId: ligne.medicamentId,
      };

      if (ligne.intervalleHeures) {
        const derniere = dejaPrises[0]?.dateHeurePrevue.getTime();
        if (derniere === undefined || now.getTime() >= derniere + ligne.intervalleHeures * HEURE_MS) {
          dues.push({ ...base, dateHeurePrevue: now });
        }
        continue;
      }

      const moments = JSON.parse(ligne.moments ?? "[]") as Moment[];
      for (const moment of moments) {
        const creneau = creneauEnCours(moment, now);
        if (!creneau) continue;
        const dejaDistribue = dejaPrises.some(
          (p) => p.dateHeurePrevue.getTime() === creneau.getTime(),
        );
        const dejaDu = dues.some(
          (p) =>
            p.prescriptionId === base.prescriptionId &&
            p.medicamentId === base.medicamentId &&
            p.dateHeurePrevue.getTime() === creneau.getTime(),
        );
        if (!dejaDistribue && !dejaDu) dues.push({ ...base, dateHeurePrevue: creneau });
      }
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
