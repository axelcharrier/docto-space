import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Runs before rendering starts: an astronaut (or anyone without the
  // "doctor" role) hitting this section gets a real 403 here.
  await requireRole("doctor");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <Link href="/doctor" className="font-semibold">
          docto-space · Médecin
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell href="/doctor/notifications" />
          <LogoutButton />
        </div>
      </header>
      <AutoRefresh />
      {children}
    </div>
  );
}
