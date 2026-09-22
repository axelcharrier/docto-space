"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ToastOnMount({ message, clearTo }: { message: string; clearTo?: string }) {
  const router = useRouter();

  useEffect(() => {
    toast.success(message);
    if (clearTo) router.replace(clearTo);
  }, [message, clearTo, router]);

  return null;
}
