import "server-only";

import { prisma } from "@/lib/prisma";

export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, lue: false } });
}

export function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
