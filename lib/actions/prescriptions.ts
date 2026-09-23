"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { notifyUsers } from "@/lib/events";
import {
  creerPrescriptionSchema,
  formatPosologie,
  modifierPrescriptionSchema,
  supprimerPrescriptionSchema,
  type LigneInput,
} from "@/lib/validation/prescriptions";
import type { ActionState } from "@/lib/actions/types";

function fieldErrorsOf(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    // Line-level issues arrive as ["lignes", 0, "moments"]: key them as
    // "lignes.0.moments" so the form can show them on the right row.
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

// Shapes the lines for insertion. The medicines themselves are never
// created here: they come from the official catalogue (prisma/seed.ts).
function lignesData(lignes: LigneInput[]) {
  return lignes.map((ligne) => ({
    medicamentId: ligne.codeCis,
    quantite: ligne.quantite,
    posologie: formatPosologie(ligne),
    moments: JSON.stringify(ligne.moments),
    intervalleHeures: ligne.intervalleHeures,
    dureeJours: ligne.dureeJours,
    instructions: ligne.instructions || null,
  }));
}

// Rejects a code that isn't in the catalogue, so a forged form can't invent
// a medicine.
async function checkMedicaments(lignes: LigneInput[]) {
  const codes = [...new Set(lignes.map((ligne) => ligne.codeCis))];
  const connus = await prisma.medicament.count({ where: { codeCis: { in: codes } } });
  return connus === codes.length;
}

// A prescription may be attached to a consultation, but only to one this
// doctor owns and that belongs to this astronaut.
async function checkDemande(demandeId: string, medecinId: string, astronauteId: string) {
  const demande = await prisma.demandeConsultation.findUnique({
    where: { id: demandeId },
    select: { statut: true, medecinId: true, astronauteId: true },
  });

  return (
    demande?.statut === "VALIDEE" &&
    demande.medecinId === medecinId &&
    demande.astronauteId === astronauteId
  );
}

async function checkAstronaute(astronauteId: string) {
  const user = await prisma.user.findUnique({
    where: { id: astronauteId },
    select: { role: true },
  });
  return user?.role === "ASTRONAUTE";
}

export async function creerPrescription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("doctor");

  const parsed = creerPrescriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formulaire invalide",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const { astronauteId, commentaire, lignes } = parsed.data;
  const demandeId = parsed.data.demandeId || null;

  if (!(await checkAstronaute(astronauteId))) {
    return { status: "error", message: "Astronaute introuvable." };
  }
  if (demandeId && !(await checkDemande(demandeId, session.user.id, astronauteId))) {
    return { status: "error", message: "Cette consultation ne vous appartient pas." };
  }

  if (!(await checkMedicaments(lignes))) {
    return { status: "error", message: "Médicament inconnu du référentiel." };
  }

  await prisma.$transaction(async (tx) => {
    const data = lignesData(lignes);

    await tx.prescription.create({
      data: {
        astronauteId,
        medecinId: session.user.id,
        demandeId,
        commentaire: commentaire || null,
        lignes: { create: data },
      },
    });

    await tx.notification.create({
      data: {
        userId: astronauteId,
        type: "NOUVELLE_PRESCRIPTION",
        titre: "Nouvelle prescription",
        message: `${lignes.length} médicament${lignes.length > 1 ? "s" : ""} vous ${
          lignes.length > 1 ? "ont" : "a"
        } été prescrit${lignes.length > 1 ? "s" : ""}.`,
        lienUrl: "/astronaut",
      },
    });
  });

  notifyUsers([astronauteId, session.user.id]);
  refresh();
  return { status: "success", message: "Prescription enregistrée" };
}

export async function modifierPrescription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("doctor");

  const parsed = modifierPrescriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formulaire invalide",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const { prescriptionId, commentaire, lignes } = parsed.data;

  const existante = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: { medecinId: true, astronauteId: true },
  });
  if (!existante) {
    return { status: "error", message: "Prescription introuvable." };
  }
  if (existante.medecinId !== session.user.id) {
    return { status: "error", message: "Cette prescription ne vous appartient pas." };
  }

  if (!(await checkMedicaments(lignes))) {
    return { status: "error", message: "Médicament inconnu du référentiel." };
  }

  await prisma.$transaction(async (tx) => {
    const data = lignesData(lignes);

    // The lines are replaced wholesale: simpler than diffing, and the
    // astronaut only ever reads the latest state.
    await tx.lignePrescription.deleteMany({ where: { prescriptionId } });
    await tx.prescription.update({
      where: { id: prescriptionId },
      data: { commentaire: commentaire || null, lignes: { create: data } },
    });

    await tx.notification.create({
      data: {
        userId: existante.astronauteId,
        type: "PRESCRIPTION_MODIFIEE",
        titre: "Prescription modifiée",
        message: "Votre traitement a été mis à jour par votre médecin.",
        lienUrl: "/astronaut",
      },
    });
  });

  notifyUsers([existante.astronauteId, session.user.id]);
  refresh();
  return { status: "success", message: "Prescription modifiée" };
}

export async function supprimerPrescription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("doctor");

  const parsed = supprimerPrescriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Formulaire invalide" };
  }

  const { prescriptionId } = parsed.data;

  const existante = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: {
      medecinId: true,
      astronauteId: true,
      lignes: { select: { medicament: { select: { denomination: true } } } },
    },
  });
  if (!existante) {
    return { status: "error", message: "Prescription introuvable." };
  }
  if (existante.medecinId !== session.user.id) {
    return { status: "error", message: "Cette prescription ne vous appartient pas." };
  }

  // Name the medicines in the notification: the prescription is gone, so
  // the astronaut has nothing left to open.
  const noms = existante.lignes.map((ligne) => ligne.medicament.denomination).join(", ");

  await prisma.$transaction(async (tx) => {
    // The lines go with it (onDelete: Cascade in the schema).
    await tx.prescription.delete({ where: { id: prescriptionId } });

    await tx.notification.create({
      data: {
        userId: existante.astronauteId,
        type: "PRESCRIPTION_SUPPRIMEE",
        titre: "Prescription annulée",
        message: noms
          ? `Votre médecin a annulé la prescription de : ${noms}.`
          : "Votre médecin a annulé une prescription.",
        lienUrl: "/astronaut",
      },
    });
  });

  notifyUsers([existante.astronauteId, session.user.id]);
  refresh();
  return { status: "success", message: "Prescription supprimée" };
}
