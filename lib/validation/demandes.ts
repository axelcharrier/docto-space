import { z } from "zod";
import { parseLocalDateTime } from "@/lib/datetime";

const futureDateTime = z
  .string()
  .transform((value, ctx) => {
    const date = parseLocalDateTime(value);
    if (!date) {
      // The date/time field submits an empty string until both halves are
      // picked, so distinguish "nothing chosen" from a malformed value.
      ctx.addIssue({
        code: "custom",
        message: value ? "Date invalide" : "Choisissez une date et une heure",
      });
      return z.NEVER;
    }
    if (date <= new Date()) {
      ctx.addIssue({ code: "custom", message: "La date doit être dans le futur" });
      return z.NEVER;
    }
    return date;
  });

export const creerDemandeSchema = z.object({
  dateSouhaitee: futureDateTime,
  commentaire: z
    .string()
    .trim()
    .min(10, "Décrivez vos symptômes (10 caractères minimum)")
    .max(2000, "2000 caractères maximum"),
});

export const accepterDemandeSchema = z.object({
  demandeId: z.string().uuid(),
  dateConsultation: futureDateTime,
});

export const refuserDemandeSchema = z.object({
  demandeId: z.string().uuid(),
  motifRefus: z.string().trim().max(1000, "1000 caractères maximum").optional(),
});
