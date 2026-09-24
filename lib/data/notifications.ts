import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Counts the unread notifications for a user.
 * @param userId - The identifier of the user.
 * @returns The number of unread notifications.
 */
export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, lue: false } });
}

/**
 * Retrieves the latest notifications for a user.
 * @param userId - The identifier of the user.
 * @returns The user's 50 most recent notifications.
 */
export function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
