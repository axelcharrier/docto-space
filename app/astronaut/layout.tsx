import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/logout-button";

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
      <header className="flex items-center justify-end border-b border-zinc-200 p-4 dark:border-zinc-800">
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
