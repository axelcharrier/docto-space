import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
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
      <AppHeader section="Médecin" href="/doctor" />
      <AutoRefresh />
      {children}
    </div>
  );
}
