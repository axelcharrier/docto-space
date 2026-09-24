"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

/**
 * Marks a notification as read and redirects to its associated link when available.
 * @param formData - The form data containing the notification identifier.
 * @returns Nothing when the notification is missing or has no redirect link.
 */
export async function marquerLue(formData: FormData) {
  const session = await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
    select: { lienUrl: true },
  });
  if (!notification) return;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { lue: true },
  });

  if (notification.lienUrl) redirect(notification.lienUrl);
  refresh();
}

/**
 * Marks all unread notifications of the current user as read.
 */
export async function marquerToutesLues() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, lue: false },
    data: { lue: true },
  });
  refresh();
}
