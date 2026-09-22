import type { Icon } from "@phosphor-icons/react";

// One "icon + label + value" row, used for the metadata under card titles.
// Scanning a column of icons is faster than parsing sentences glued together
// with middots, which is what these cards used to do.
export function MetaLine({
  icon: IconComponent,
  label,
  children,
}: {
  icon: Icon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <IconComponent className="size-4 shrink-0" aria-hidden />
      <span className="sr-only">{label} :</span>
      <span>{children}</span>
    </span>
  );
}
