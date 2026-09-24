// A consultation has no stored end time: we assume it lasts at most this
// long. Past that, it is over — it is no longer listed and can no longer be
// cancelled. Until then it stays visible so the visio can still be joined.
export const DUREE_CONSULTATION_MS = 60 * 60 * 1000;

// Consultations starting at or after this instant are not over yet.
export function debutConsultationsNonTerminees(now = new Date()) {
  return new Date(now.getTime() - DUREE_CONSULTATION_MS);
}

// How long the author of a cancellation can take it back, client side,
// before it is actually sent (see components/annuler-consultation-button.tsx).
export const DELAI_ANNULATION_MS = 15_000;
