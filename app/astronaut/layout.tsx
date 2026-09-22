import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function AstronautLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Runs before rendering starts: a doctor (or anyone without the
  // "astronaut" role) hitting this section gets a real 403 here.
  await requireRole("astronaut");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <Link href="/astronaut" className="font-semibold">
          docto-space · Astronaute
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell href="/astronaut/notifications" />
          <LogoutButton />
        </div>
      </header>
      <AutoRefresh />
      {children}
    </div>
  );
}
