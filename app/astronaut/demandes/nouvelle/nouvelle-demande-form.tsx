"use client";

import { useActionState } from "react";
import Link from "next/link";
import { creerDemande } from "@/lib/actions/demandes";
import { idleState } from "@/lib/actions/types";
import { errorsFor, useActionToast } from "@/lib/actions/form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { DateTimeField } from "@/components/datetime-field";
import { SubmitButton } from "@/components/submit-button";

/**
 * Displays the form that allows a user to create a new request
 * @param minDateTime Earliest date and time at which a request can be scheduled
 * @returns The form for creating a new request
 */
export function NouvelleDemandeForm({ minDateTime }: { minDateTime: string }) {
  const [state, action] = useActionState(creerDemande, idleState);
  useActionToast(state);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dateSouhaitee">Date et heure souhaitées</FieldLabel>
          <DateTimeField id="dateSouhaitee" name="dateSouhaitee" min={minDateTime} />
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
