import { requireRole } from "@/lib/dal";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Runs before rendering starts: an astronaut (or anyone without the
  // "doctor" role) hitting this section gets a real 403 here.
  await requireRole("doctor");

  return <>{children}</>;
}
