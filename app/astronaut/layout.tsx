import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";

/**
 * Protects and renders the astronaut section layout.
 * @param children - The content to render inside the layout.
 * @returns The layout containing the header and auto-refresh component.
 */
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
      <AppHeader section="Astronaute" href="/astronaut" />
      <AutoRefresh />
      {children}
    </div>
  );
}
