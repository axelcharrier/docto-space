"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/types";

// Toasts the result of a server action, and lets the caller react to a
// success (closing a dialog, typically). Shared by every form in the app so
// the feedback stays identical everywhere.
export function useActionToast(state: ActionState, onSuccess?: () => void) {
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Enregistré");
      onSuccess?.();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
    // onSuccess is usually an inline closure: depending on it would re-fire
    // the toast on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

// Shapes an action's field errors the way <FieldError> expects them.
export function errorsFor(state: ActionState, name: string) {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[name]?.map((message) => ({ message }));
}
