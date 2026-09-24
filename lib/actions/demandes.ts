"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/dal";
import { formatDateTime } from "@/lib/datetime";
import { createVisioRoom, VisioError } from "@/lib/visio";
import { notifyUsers } from "@/lib/events";
import { debutConsultationsNonTerminees } from "@/lib/consultations";
import {
  accepterDemandeSchema,
  annulerConsultationSchema,
  creerDemandeSchema,
  refuserDemandeSchema,
} from "@/lib/validation/demandes";
import type { ActionState } from "@/lib/actions/types";

/**
 * Groups validation error messages by their corresponding field.
 * @param error - The validation error containing field issues.
 * @returns An object mapping field names to their validation messages.
 */
function fieldErrorsOf(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

// Every doctor's dashboard lists the pending requests, so any change to one
// is relevant to all of them (plus, when given, the astronaut who owns it).
async function notifyMedecinsEt(...userIds: string[]) {
  const medecins = await prisma.user.findMany({
    where: { role: "MEDECIN" },
    select: { id: true },
  });
  notifyUsers([...medecins.map((m) => m.id), ...userIds]);
}

/**
 * Creates a consultation request for the authenticated astronaut.
 * @param _prev - The previous server action state.
 * @param formData - The form data containing the requested consultation details.
 * @returns The action state containing validation errors when the form is invalid.
 */
export async function creerDemande(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("astronaut");

  const parsed = creerDemandeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formulaire invalide",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const { dateSouhaitee, commentaire } = parsed.data;
  const auteur = session.user.name ?? session.user.email ?? "Un astronaute";

  const medecinIds = await prisma.$transaction(async (tx) => {
    const demande = await tx.demandeConsultation.create({
      data: { astronauteId: session.user.id, dateSouhaitee, commentaire },
    });

    const medecins = await tx.user.findMany({
      where: { role: "MEDECIN" },
      select: { id: true },
    });

    if (medecins.length > 0) {
      await tx.notification.createMany({
        data: medecins.map((m) => ({
          userId: m.id,
          type: "NOUVELLE_DEMANDE",
          titre: "Nouvelle demande de consultation",
          message: `${auteur} souhaite une consultation le ${formatDateTime(dateSouhaitee)}.`,
          lienUrl: "/doctor",
          demandeId: demande.id,
        })),
      });
    }

    return medecins.map((m) => m.id);
  });

  notifyUsers(medecinIds);
  redirect("/astronaut?created=1");
}

/**
 * Accepts a consultation request and schedules the consultation with a Visio room.
 * @param _prev - The previous server action state.
 * @param formData - The form data containing the request and consultation details.
 * @returns The action state containing success or validation/error information.
 */
export async function accepterDemande(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("doctor");

  const parsed = accepterDemandeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formulaire invalide",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const { demandeId, dateConsultation } = parsed.data;

  const email =
    session.user.email ??
    (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      })
    )?.email;
  if (!email) {
    return {
      status: "error",
      message: "Votre compte n'a pas d'adresse email, impossible de créer la salle Visio.",
    };
  }

  const demande = await prisma.demandeConsultation.findUnique({
    where: { id: demandeId },
    select: { statut: true, astronauteId: true },
  });
  if (!demande || demande.statut !== "EN_ATTENTE") {
    return { status: "error", message: "Cette demande a déjà été traitée." };
  }

  let room: { id: string; url: string };
  try {
    room = await createVisioRoom(email);
  } catch (error) {
    if (error instanceof VisioError) {
      return {
        status: "error",
        message: "Création de la salle Visio impossible. Réessayez plus tard.",
      };
    }
    throw error;
  }

  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.demandeConsultation.updateMany({
      where: { id: demandeId, statut: "EN_ATTENTE", medecinId: null },
      data: {
        statut: "VALIDEE",
        medecinId: session.user.id,
        dateConsultation,
        lienVisio: room.url,
        visioRoomId: room.id,
      },
    });
    if (count === 0) return false;

    await tx.notification.create({
      data: {
        userId: demande.astronauteId,
        type: "DEMANDE_ACCEPTEE",
        titre: "Consultation planifiée",
        message: `Votre consultation est confirmée le ${formatDateTime(dateConsultation)}.`,
        lienUrl: "/astronaut",
        demandeId,
      },
    });
    return true;
  });

  if (!ok) {
    console.warn("[visio] salle orpheline", room.id);
    return { status: "error", message: "Cette demande a déjà été traitée par un autre médecin." };
  }

  await notifyMedecinsEt(demande.astronauteId);
  refresh();
  return { status: "success", message: "Consultation planifiée" };
}

export async function refuserDemande(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("doctor");

  const parsed = refuserDemandeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formulaire invalide",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const { demandeId } = parsed.data;
  const motifRefus = parsed.data.motifRefus || null;

  const demande = await prisma.demandeConsultation.findUnique({
    where: { id: demandeId },
    select: { astronauteId: true },
  });
  if (!demande) {
    return { status: "error", message: "Demande introuvable." };
  }

  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.demandeConsultation.updateMany({
      where: { id: demandeId, statut: "EN_ATTENTE", medecinId: null },
      data: { statut: "REFUSEE", medecinId: session.user.id, motifRefus },
    });
    if (count === 0) return false;

    await tx.notification.create({
      data: {
        userId: demande.astronauteId,
        type: "DEMANDE_REFUSEE",
        titre: "Demande refusée",
        message: motifRefus
          ? `Votre demande de consultation a été refusée : ${motifRefus}`
          : "Votre demande de consultation a été refusée.",
        lienUrl: "/astronaut",
        demandeId,
      },
    });
    return true;
  });

  if (!ok) {
    return { status: "error", message: "Cette demande a déjà été traitée." };
  }

  await notifyMedecinsEt(demande.astronauteId);
  refresh();
  return { status: "success", message: "Demande refusée" };
}

// Either side of a planned consultation can cancel it, as long as it is not
// over. Both get a notification: the other party to be warned, the author
// as a trace in their history. The 15-second undo happens client side,
// before this action is called — once here, the cancellation is final.
export async function annulerConsultation(demandeId: string): Promise<ActionState> {
  const session = await requireSession();

  const parsed = annulerConsultationSchema.safeParse({ demandeId });
  if (!parsed.success) {
    return { status: "error", message: "Consultation introuvable." };
  }

  // Scoped to the signed-in user: only the doctor or the astronaut of this
  // consultation can find it.
  const demande = await prisma.demandeConsultation.findFirst({
    where: {
      id: parsed.data.demandeId,
      OR: [{ medecinId: session.user.id }, { astronauteId: session.user.id }],
    },
    include: {
      astronaute: { select: { name: true, email: true } },
      medecin: { select: { name: true, email: true } },
    },
  });
  if (!demande?.medecinId || !demande.dateConsultation) {
    return { status: "error", message: "Consultation introuvable." };
  }

  const parMedecin = session.user.id === demande.medecinId;
  const autre = parMedecin ? demande.astronaute : demande.medecin;
  const autreNom = autre?.name ?? autre?.email ?? (parMedecin ? "l'astronaute" : "le médecin");
  const auteurNom =
    session.user.name ?? session.user.email ?? (parMedecin ? "Le médecin" : "L'astronaute");
  const quand = formatDateTime(demande.dateConsultation);

  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.demandeConsultation.updateMany({
      where: {
        id: demande.id,
        statut: "VALIDEE",
        dateConsultation: { gte: debutConsultationsNonTerminees() },
      },
      data: { statut: "ANNULEE", annuleeParId: session.user.id, annuleeLe: new Date() },
    });
    if (count === 0) return false;

    await tx.notification.createMany({
      data: [
        {
          userId: parMedecin ? demande.astronauteId : demande.medecinId!,
          type: "CONSULTATION_ANNULEE",
          titre: "Consultation annulée",
          message: `${auteurNom} a annulé la consultation du ${quand}.`,
          lienUrl: parMedecin ? "/astronaut" : "/doctor",
          demandeId: demande.id,
        },
        {
          userId: session.user.id,
          type: "CONSULTATION_ANNULEE",
          titre: "Consultation annulée",
          message: `Vous avez annulé la consultation du ${quand} avec ${autreNom}.`,
          lienUrl: parMedecin ? "/doctor" : "/astronaut",
          demandeId: demande.id,
        },
      ],
    });
    return true;
  });

  if (!ok) {
    return {
      status: "error",
      message: "Cette consultation est déjà annulée ou terminée.",
    };
  }

  notifyUsers([demande.astronauteId, demande.medecinId]);
  refresh();
  return { status: "success", message: "Consultation annulée" };
}
