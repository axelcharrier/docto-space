import { z } from "zod";

export const MOMENTS = ["MATIN", "MIDI", "SOIR", "COUCHER"] as const;
export type Moment = (typeof MOMENTS)[number];

export const MOMENT_LABELS: Record<Moment, string> = {
  MATIN: "matin",
  MIDI: "midi",
  SOIR: "soir",
  COUCHER: "au coucher",
};

export const ligneSchema = z
  .object({
    // Code CIS : le médicament est choisi dans le référentiel officiel, il
    // n'est jamais saisi au clavier (voir prisma/seed.ts).
    codeCis: z.string().trim().min(1, "Choisissez un médicament"),
    quantite: z.string().trim().max(60, "60 caractères maximum").optional(),
    mode: z.enum(["MOMENTS", "INTERVALLE"]),
    moments: z.array(z.enum(MOMENTS)).default([]),
    intervalleHeures: z.number().int().min(1).max(24).nullable().default(null),
    dureeJours: z.number().int().min(1, "Au moins 1 jour").max(365, "365 jours maximum"),
    instructions: z.string().trim().max(200, "200 caractères maximum").optional(),
  })
  .check((ctx) => {
    const ligne = ctx.value;
    if (ligne.mode === "MOMENTS" && ligne.moments.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ligne.moments,
        path: ["moments"],
        message: "Choisissez au moins un moment de la journée",
      });
    }
    if (ligne.mode === "INTERVALLE" && ligne.intervalleHeures === null) {
      ctx.issues.push({
        code: "custom",
        input: ligne.intervalleHeures,
        path: ["intervalleHeures"],
        message: "Indiquez un intervalle en heures",
      });
    }
  });

export type LigneInput = z.infer<typeof ligneSchema>;

// The dynamic list of medicines travels as JSON in a hidden input, so the
// forms keep submitting a plain FormData like every other action here.
const lignesField = z
  .string()
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Prescription illisible" });
      return z.NEVER;
    }
  })
  .pipe(z.array(ligneSchema).min(1, "Ajoutez au moins un médicament"));

const base = {
  astronauteId: z.string().min(1, "Choisissez un astronaute"),
  // "" when prescribing outside any consultation.
  demandeId: z.string().uuid().or(z.literal("")).optional(),
  commentaire: z.string().trim().max(1000, "1000 caractères maximum").optional(),
  lignes: lignesField,
};

export const creerPrescriptionSchema = z.object(base);

export const modifierPrescriptionSchema = z.object({
  ...base,
  prescriptionId: z.string().uuid(),
});

export const supprimerPrescriptionSchema = z.object({
  prescriptionId: z.string().uuid(),
});

// Turns the structured form into the sentence stored on the line and shown
// to the astronaut. Used server-side on save and client-side for the live
// preview, so both always read the same.
export function formatPosologie(ligne: LigneInput) {
  const rythme =
    ligne.mode === "INTERVALLE"
      ? `Toutes les ${ligne.intervalleHeures} h`
      : capitalize(joinFr(ligne.moments.map((moment) => MOMENT_LABELS[moment])));

  const duree = `pendant ${ligne.dureeJours} jour${ligne.dureeJours > 1 ? "s" : ""}`;
  const quantite = ligne.quantite ? `${ligne.quantite}, ` : "";
  const phrase = `${quantite}${quantite ? decapitalize(rythme) : rythme} ${duree}`;

  return ligne.instructions ? `${phrase} · ${ligne.instructions}` : phrase;
}

function joinFr(parts: string[]) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} et ${parts.at(-1)}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function decapitalize(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
