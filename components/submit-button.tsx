"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Renders a submit button that reflects the current form submission state.
 * @param children - The content displayed inside the button.
 * @param props - Additional properties passed to the button.
 * @returns The rendered submit button component.
 */
export function SubmitButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? "Envoi…" : children}
    </Button>
  );
}
