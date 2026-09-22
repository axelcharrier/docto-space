import { auth } from "@/auth";
import { listNotifications } from "@/lib/data/notifications";
import { NotificationsList } from "@/components/notifications-list";

export default async function AstronautNotificationsPage() {
  const session = await auth();
  const notifications = await listNotifications(session!.user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <NotificationsList notifications={notifications} backHref="/astronaut" />
    </main>
  );
}
