import type { Icon } from "@phosphor-icons/react";

// Section heading with its icon and an optional count, so the eye can jump
// between sections instead of reading every title.
export function SectionTitle({
  icon: IconComponent,
  children,
  count,
}: {
  icon: Icon;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold">
      <IconComponent className="size-5 text-muted-foreground" aria-hidden />
      {children}
      {count !== undefined && (
        <span className="text-sm font-normal text-muted-foreground">({count})</span>
      )}
    </h2>
  );
}
