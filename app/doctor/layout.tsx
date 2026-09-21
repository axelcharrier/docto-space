import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/logout-button";

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
      <header className="flex items-center justify-end border-b border-zinc-200 p-4 dark:border-zinc-800">
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
