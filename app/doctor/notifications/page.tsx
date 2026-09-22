import { auth } from "@/auth";
import { listNotifications } from "@/lib/data/notifications";
import { NotificationsList } from "@/components/notifications-list";

export default async function DoctorNotificationsPage() {
  const session = await auth();
  const notifications = await listNotifications(session!.user.id);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <NotificationsList notifications={notifications} />
    </main>
  );
}
