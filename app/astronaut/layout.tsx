import { requireRole } from "@/lib/dal";

export default async function AstronautLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Runs before rendering starts: a doctor (or anyone without the
  // "astronaut" role) hitting this section gets a real 403 here.
  await requireRole("astronaut");

  return <>{children}</>;
}
