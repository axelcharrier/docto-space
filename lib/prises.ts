import { parseLocalDateTime, toLocalInputValue } from "@/lib/datetime";
import type { Moment } from "@/lib/validation/prescriptions";

// Dosing rules shared by the dispenser (lib/data/distributeur.ts) and the
// "next dose" line on the prescription cards, so both always agree.

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
export const FENETRE_MS = HEURE_MS;

// Doses older than this can no longer affect the next one: moment windows
// are a day apart at most and intervals are capped at 24 h.
export const HISTORIQUE_UTILE_MS = JOUR_MS + FENETRE_MS;

type Ligne = { moments: string | null; intervalleHeures: number | null; dureeJours: number | null };
type PriseFaite = { dateHeurePrevue: Date };

export type ProchainePrise = {
  // Slot start for a moment of the day, `now` for an interval dose due now.
  // Stored as PrisePlanifiee.dateHeurePrevue when dispensed.
  date: Date;
  // The dispenser would release it on a scan right now.
  maintenant: boolean;
};

// "YYYY-MM-DD" (APP_TIMEZONE) `jours` days after `date`. Goes through noon
// so a DST change never lands on the wrong day.
function jourLocal(date: Date, jours: number) {
  const midi = parseLocalDateTime(`${toLocalInputValue(date).slice(0, 10)}T12:00`)!;
  return toLocalInputValue(new Date(midi.getTime() + jours * JOUR_MS)).slice(0, 10);
}

// Next dose of a prescription line from `now`, given the doses already
// dispensed for this medicine on this prescription. null once the
// treatment is over.
export function prochainePrise(
  ligne: Ligne,
  datePrescription: Date,
  prises: PriseFaite[],
  now: Date,
): ProchainePrise | null {
  const fin = datePrescription.getTime() + (ligne.dureeJours ?? 0) * JOUR_MS;
  if (now.getTime() >= fin) return null;

  if (ligne.intervalleHeures) {
    const derniere = Math.max(...prises.map((p) => p.dateHeurePrevue.getTime()));
    const suivante = derniere + ligne.intervalleHeures * HEURE_MS;
    if (prises.length === 0 || suivante <= now.getTime()) return { date: now, maintenant: true };
    return suivante < fin ? { date: new Date(suivante), maintenant: false } : null;
  }

  const moments = (JSON.parse(ligne.moments ?? "[]") as Moment[]).toSorted(
    (a, b) => HEURE_MOMENT[a] - HEURE_MOMENT[b],
  );
  if (moments.length === 0) return null;

  // Walks the slots in chronological order, today first. Bounded by the
  // treatment's end, itself at most 365 days away.
  for (let jours = 0; jours <= 366; jours++) {
    const jour = jourLocal(now, jours);
    for (const moment of moments) {
      const heure = String(HEURE_MOMENT[moment]).padStart(2, "0");
      const creneau = parseLocalDateTime(`${jour}T${heure}:00`)!;
      if (creneau.getTime() >= fin) return null;
      if (creneau.getTime() + FENETRE_MS < now.getTime()) continue;

      if (creneau.getTime() - FENETRE_MS > now.getTime()) {
        return { date: creneau, maintenant: false };
      }
      // Window open now: due unless this slot was already dispensed.
      const dejaPrise = prises.some((p) => p.dateHeurePrevue.getTime() === creneau.getTime());
      if (!dejaPrise) return { date: creneau, maintenant: true };
    }
  }

  return null;
}
