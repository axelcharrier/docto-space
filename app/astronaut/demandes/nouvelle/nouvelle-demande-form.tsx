"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { creerDemande } from "@/lib/actions/demandes";
import { idleState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

function errorsFor(state: typeof idleState, name: string) {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[name]?.map((message) => ({ message }));
}

export function NouvelleDemandeForm({ minDateTime }: { minDateTime: string }) {
  const [state, action] = useActionState(creerDemande, idleState);

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dateSouhaitee">Date et heure souhaitées</FieldLabel>
          <Input
            id="dateSouhaitee"
            name="dateSouhaitee"
            type="datetime-local"
            min={minDateTime}
            required
          />
          <FieldError errors={errorsFor(state, "dateSouhaitee")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="commentaire">Symptômes</FieldLabel>
          <Textarea
            id="commentaire"
            name="commentaire"
            rows={6}
            placeholder="Décrivez vos symptômes, depuis quand, leur intensité…"
            required
            minLength={10}
          />
          <FieldError errors={errorsFor(state, "commentaire")} />
        </Field>
      </FieldGroup>

      <div className="flex gap-2">
        <SubmitButton>Envoyer la demande</SubmitButton>
        <Button variant="outline" nativeButton={false} render={<Link href="/astronaut" />}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
