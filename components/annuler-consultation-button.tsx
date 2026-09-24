"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowCounterClockwiseIcon, XCircleIcon } from "@phosphor-icons/react";
import { annulerConsultation } from "@/lib/actions/demandes";
import { DELAI_ANNULATION_MS } from "@/lib/consultations";
import { Button } from "@/components/ui/button";

const RAYON = 14;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

// Empties over `durationMs`, with the remaining seconds in the middle.
function CountdownRing({ durationMs }: { durationMs: number }) {
  const [secondes, setSecondes] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    const fin = Date.now() + durationMs;
    const id = setInterval(() => {
      setSecondes(Math.max(0, Math.ceil((fin - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [durationMs]);

  return (
    <div className="relative size-9 shrink-0" role="timer" aria-live="off">
      <svg viewBox="0 0 32 32" className="size-9 -rotate-90">
        <circle cx="16" cy="16" r={RAYON} fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="16"
          cy="16"
          r={RAYON}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-destructive"
          strokeDasharray={CIRCONFERENCE}
          style={
            {
              "--ring-length": CIRCONFERENCE,
              animation: `countdown-ring ${durationMs}ms linear forwards`,
            } as React.CSSProperties
          }
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums">
        {secondes}
      </span>
    </div>
  );
}

// Lives inside the toaster (root layout), not in the card: the countdown
// survives client-side navigation and the auto-refresh re-renders. When it
// runs out, the cancellation is actually sent.
function AnnulationToast({
  toastId,
  demandeId,
  onDone,
}: {
  toastId: string | number;
  demandeId: string;
  onDone: () => void;
}) {
  const annule = useRef(false);
  // Sonner re-renders the toast with a fresh `onDone` closure: keep the
  // latest one in a ref so the countdown effect never restarts.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    // Closing the tab would silently drop the cancellation: ask first.
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);

    const timer = setTimeout(async () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (annule.current) return;
      toast.dismiss(toastId);
      const result = await annulerConsultation(demandeId);
      onDoneRef.current();
      if (result.status === "success") toast.success(result.message);
      else if (result.status === "error") toast.error(result.message);
    }, DELAI_ANNULATION_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [toastId, demandeId]);

  const revenirEnArriere = () => {
    annule.current = true;
    toast.dismiss(toastId);
    onDoneRef.current();
    toast.info("La consultation est maintenue");
  };

  return (
    <div className="flex w-full items-center gap-3 border bg-popover p-3 text-popover-foreground shadow-lg">
      <CountdownRing durationMs={DELAI_ANNULATION_MS} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">Annulation de la consultation</span>
        <span className="text-xs text-muted-foreground">
          Les deux participants seront notifiés.
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={revenirEnArriere}>
        <ArrowCounterClockwiseIcon />
        Revenir en arrière
      </Button>
    </div>
  );
}

export function AnnulerConsultationButton({ demandeId }: { demandeId: string }) {
  const [pending, setPending] = useState(false);

  const annuler = () => {
    setPending(true);
    // Infinity: the toast's own timer decides when it goes away, so that
    // sonner's pause-on-hover can't desync it from the countdown.
    toast.custom(
      (id) => (
        <AnnulationToast toastId={id} demandeId={demandeId} onDone={() => setPending(false)} />
      ),
      { duration: Infinity },
    );
  };

  return (
    <Button size="sm" variant="destructive" disabled={pending} onClick={annuler}>
      <XCircleIcon />
      {pending ? "Annulation…" : "Annuler la visio"}
    </Button>
  );
}
