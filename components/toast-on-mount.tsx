"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Displays a success toast when the component mounts and optionally redirects.
 * @param message - The success message displayed in the toast.
 * @param clearTo - The URL to navigate to after displaying the toast.
 * @returns No rendered content.
 */
export function ToastOnMount({ message, clearTo }: { message: string; clearTo?: string }) {
  const router = useRouter();

  useEffect(() => {
    toast.success(message);
    if (clearTo) router.replace(clearTo);
  }, [message, clearTo, router]);

  return null;
}
