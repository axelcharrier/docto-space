"use client";

// next-themes only works from a client component; this thin wrapper lets the
// root layout stay a server component.
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provides theme context and system theme support to the application.
 * @param children - The content to render within the theme provider.
 * @returns The theme provider containing the application content.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Avoids the whole page animating its colors while switching.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
