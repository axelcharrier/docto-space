"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { accepterDemande, refuserDemande } from "@/lib/actions/demandes";
import { idleState, type ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type Props = {
  demandeId: string;
  dateSouhaiteeInput: string;
  minDateTime: string;
};

function useActionToast(state: ActionState, onSuccess: () => void) {
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Enregistré");
      onSuccess();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

function errorsFor(state: ActionState, name: string) {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[name]?.map((message) => ({ message }));
}

function AccepterDialog({ demandeId, dateSouhaiteeInput, minDateTime }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(accepterDemande, idleState);
  useActionToast(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Accepter</DialogTrigger>
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Planifier la consultation</DialogTitle>
            <DialogDescription>
              Confirmez ou ajustez le créneau. Une salle Visio sera créée automatiquement.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="demandeId" value={demandeId} />
          <Field>
            <FieldLabel htmlFor={`dateConsultation-${demandeId}`}>Date et heure</FieldLabel>
            <Input
              id={`dateConsultation-${demandeId}`}
              name="dateConsultation"
              type="datetime-local"
              defaultValue={dateSouhaiteeInput}
              min={minDateTime}
              required
            />
            <FieldError errors={errorsFor(state, "dateConsultation")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <SubmitButton>Confirmer et créer la visio</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefuserDialog({ demandeId }: Pick<Props, "demandeId">) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(refuserDemande, idleState);
  useActionToast(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>Refuser</DialogTrigger>
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              L&apos;astronaute sera notifié. Vous pouvez indiquer un motif.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="demandeId" value={demandeId} />
          <Field>
            <FieldLabel htmlFor={`motifRefus-${demandeId}`}>Motif (optionnel)</FieldLabel>
            <Textarea id={`motifRefus-${demandeId}`} name="motifRefus" rows={3} />
            <FieldError errors={errorsFor(state, "motifRefus")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <SubmitButton variant="destructive">Refuser</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DemandeActions(props: Props) {
  return (
    <div className="flex gap-2">
      <AccepterDialog {...props} />
      <RefuserDialog demandeId={props.demandeId} />
    </div>
  );
}
