import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Renders the shared application header for the doctor and astronaut sections.
 * Shared by the doctor and astronaut sections: same chrome, only the label
 * and the notifications target differ.
 *
 * @param section - The section label displayed in the header.
 * @param href - The base URL used for navigation links.
 * @returns The application header component.
 */
export function AppHeader({ section, href }: { section: string; href: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={href} className="font-semibold">
          docto-space <span className="text-muted-foreground">· {section}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell href={`${href}/notifications`} />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
