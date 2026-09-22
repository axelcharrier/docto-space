"use client";

import { useActionState, useState } from "react";
import { PillIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  creerPrescription,
  modifierPrescription,
  supprimerPrescription,
} from "@/lib/actions/prescriptions";
import { idleState } from "@/lib/actions/types";
import { errorsFor, useActionToast } from "@/lib/actions/form";
import {
  formatPosologie,
  MOMENTS,
  MOMENT_LABELS,
  type LigneInput,
  type Moment,
} from "@/lib/validation/prescriptions";
import type { MedicamentOption, PrescriptionMedecin } from "@/lib/data/prescriptions";
import { MedicamentCombobox } from "@/components/medicament-combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export type Astronaute = { id: string; name: string | null; email: string | null };

// The catalogue entry travels with the form state so the combobox can show a
// label; zod strips it server-side, only `codeCis` matters there.
type LigneForm = LigneInput & { medicament: MedicamentOption | null };

function nomAstronaute(a: Astronaute) {
  return a.name ?? a.email ?? "Astronaute";
}

function ligneVide(): LigneForm {
  return {
    codeCis: "",
    medicament: null,
    quantite: "",
    mode: "MOMENTS",
    moments: ["MATIN"],
    intervalleHeures: null,
    dureeJours: 7,
    instructions: "",
  };
}

// Rebuilds the editable form state from what was saved. The structured
// columns exist precisely so we never have to parse `posologie` back.
function lignesDe(prescription: PrescriptionMedecin): LigneForm[] {
  return prescription.lignes.map((ligne) => ({
    codeCis: ligne.medicament.codeCis,
    medicament: ligne.medicament,
    quantite: ligne.quantite ?? "",
    mode: ligne.intervalleHeures !== null ? "INTERVALLE" : "MOMENTS",
    moments: (JSON.parse(ligne.moments ?? "[]") as Moment[]) ?? [],
    intervalleHeures: ligne.intervalleHeures,
    dureeJours: ligne.dureeJours ?? 1,
    instructions: ligne.instructions ?? "",
  }));
}

export function PrescriptionDialog({
  astronautes,
  prescription,
  astronauteId,
  demandeId,
  trigger,
}: {
  astronautes: Astronaute[];
  /** Present when editing an existing prescription. */
  prescription?: PrescriptionMedecin;
  /** Pre-selected astronaut (prescribing from a consultation). */
  astronauteId?: string;
  /** Consultation this prescription belongs to, if any. */
  demandeId?: string;
  trigger: React.ReactNode;
}) {
  const edition = prescription !== undefined;
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    edition ? modifierPrescription : creerPrescription,
    idleState,
  );
  useActionToast(state, () => setOpen(false));

  const [lignes, setLignes] = useState<LigneForm[]>(
    prescription ? lignesDe(prescription) : [ligneVide()],
  );
  const [cible, setCible] = useState(
    prescription?.astronaute.id ?? astronauteId ?? astronautes[0]?.id ?? "",
  );

  const majLigne = (index: number, patch: Partial<LigneForm>) =>
    setLignes((current) =>
      current.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)),
    );

  const figee = astronauteId !== undefined || edition;
  const nomCible = nomAstronaute(
    astronautes.find((a) => a.id === cible) ??
      prescription?.astronaute ?? { id: "", name: null, email: null },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <form action={action} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>
              {edition ? "Modifier la prescription" : "Nouvelle prescription"}
            </DialogTitle>
            <DialogDescription>
              {edition
                ? "Les médicaments seront remplacés par la liste ci-dessous."
                : "Ajoutez un ou plusieurs médicaments et précisez leur posologie."}
            </DialogDescription>
          </DialogHeader>

          {edition && <input type="hidden" name="prescriptionId" value={prescription.id} />}
          {demandeId && <input type="hidden" name="demandeId" value={demandeId} />}
          <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

          <Field>
            <FieldLabel htmlFor="astronauteId">Astronaute</FieldLabel>
            {figee ? (
              <>
                <input type="hidden" name="astronauteId" value={cible} />
                <p className="text-sm font-medium">{nomCible}</p>
              </>
            ) : (
              <Select
                name="astronauteId"
                value={cible}
                onValueChange={(value) => setCible(value ?? "")}
              >
                <SelectTrigger id="astronauteId" className="w-full">
                  <SelectValue placeholder="Choisir un astronaute" />
                </SelectTrigger>
                <SelectContent>
                  {astronautes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {nomAstronaute(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FieldError errors={errorsFor(state, "astronauteId")} />
          </Field>

          <div className="flex flex-col gap-4">
            {lignes.map((ligne, index) => (
              <LigneFields
                key={index}
                index={index}
                ligne={ligne}
                state={state}
                onChange={(patch) => majLigne(index, patch)}
                onRemove={
                  lignes.length > 1
                    ? () => setLignes((c) => c.filter((_, i) => i !== index))
                    : undefined
                }
              />
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLignes((c) => [...c, ligneVide()])}
              >
                <PlusIcon />
                Ajouter un médicament
              </Button>
              <FieldError errors={errorsFor(state, "lignes")} />
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="commentaire">Consigne générale (optionnel)</FieldLabel>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              defaultValue={prescription?.commentaire ?? ""}
              placeholder="Repos, hydratation, consulter à nouveau si…"
            />
            <FieldError errors={errorsFor(state, "commentaire")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <SubmitButton>{edition ? "Enregistrer" : "Prescrire"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LigneFields({
  index,
  ligne,
  state,
  onChange,
  onRemove,
}: {
  index: number;
  ligne: LigneForm;
  state: typeof idleState;
  onChange: (patch: Partial<LigneForm>) => void;
  onRemove?: () => void;
}) {
  // Server-side issues come back keyed by their path, e.g. "lignes.0.moments".
  const erreurs = (champ: string) => errorsFor(state, `lignes.${index}.${champ}`);

  return (
    <div className="flex flex-col gap-4 border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <PillIcon className="size-4 text-muted-foreground" />
          Médicament {index + 1}
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Retirer le médicament ${index + 1}`}
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
        )}
      </div>

      <Field>
        <FieldLabel htmlFor={`medicament-${index}`}>Médicament</FieldLabel>
        <MedicamentCombobox
          id={`medicament-${index}`}
          value={ligne.medicament}
          onChange={(medicament) =>
            onChange({ medicament, codeCis: medicament?.codeCis ?? "" })
          }
        />
        <FieldError errors={erreurs("codeCis")} />
      </Field>

      <RadioGroup
        value={ligne.mode}
        onValueChange={(value) =>
          onChange(
            value === "INTERVALLE"
              ? { mode: "INTERVALLE", moments: [], intervalleHeures: ligne.intervalleHeures ?? 8 }
              : { mode: "MOMENTS", intervalleHeures: null, moments: ligne.moments.length ? ligne.moments : ["MATIN"] },
          )
        }
        className="flex flex-col gap-3"
      >
        <Label className="flex items-center gap-2 font-normal">
          <RadioGroupItem value="MOMENTS" />
          Moments de la journée
        </Label>
        {ligne.mode === "MOMENTS" && (
          <div className="flex flex-wrap gap-4 pl-6">
            {MOMENTS.map((moment) => (
              <Label key={moment} className="flex items-center gap-2 font-normal capitalize">
                <Checkbox
                  checked={ligne.moments.includes(moment)}
                  onCheckedChange={(checked) =>
                    onChange({
                      moments: checked
                        ? [...ligne.moments, moment]
                        : ligne.moments.filter((m) => m !== moment),
                    })
                  }
                />
                {MOMENT_LABELS[moment]}
              </Label>
            ))}
          </div>
        )}

        <Label className="flex items-center gap-2 font-normal">
          <RadioGroupItem value="INTERVALLE" />
          Toutes les N heures
        </Label>
        {ligne.mode === "INTERVALLE" && (
          <div className="flex items-center gap-2 pl-6">
            <Input
              type="number"
              min={1}
              max={24}
              className="w-20"
              aria-label="Intervalle en heures"
              value={ligne.intervalleHeures ?? ""}
              onChange={(e) =>
                onChange({ intervalleHeures: e.target.value ? Number(e.target.value) : null })
              }
            />
            <span className="text-sm text-muted-foreground">heures</span>
          </div>
        )}
      </RadioGroup>
      <FieldError errors={erreurs("moments") ?? erreurs("intervalleHeures")} />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field className="sm:w-40">
          <FieldLabel htmlFor={`quantite-${index}`}>Quantité par prise</FieldLabel>
          <Input
            id={`quantite-${index}`}
            value={ligne.quantite ?? ""}
            onChange={(e) => onChange({ quantite: e.target.value })}
            placeholder="1 comprimé"
          />
          <FieldError errors={erreurs("quantite")} />
        </Field>
        <Field className="sm:w-32">
          <FieldLabel htmlFor={`duree-${index}`}>Durée (jours)</FieldLabel>
          <Input
            id={`duree-${index}`}
            type="number"
            min={1}
            max={365}
            value={ligne.dureeJours}
            onChange={(e) => onChange({ dureeJours: Number(e.target.value) })}
          />
          <FieldError errors={erreurs("dureeJours")} />
        </Field>
        <Field className="sm:flex-1">
          <FieldLabel htmlFor={`instructions-${index}`}>Instructions (optionnel)</FieldLabel>
          <Input
            id={`instructions-${index}`}
            value={ligne.instructions ?? ""}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="au cours du repas"
          />
          <FieldError errors={erreurs("instructions")} />
        </Field>
      </div>

      <p className="text-sm text-muted-foreground">
        Aperçu : <span className="text-foreground">{formatPosologie(ligne)}</span>
      </p>
    </div>
  );
}

export function SupprimerPrescriptionDialog({ prescriptionId }: { prescriptionId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(supprimerPrescription, idleState);
  useActionToast(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <TrashIcon />
        Supprimer
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Supprimer la prescription ?</DialogTitle>
            <DialogDescription>
              L&apos;astronaute sera notifié et ne verra plus ce traitement. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="prescriptionId" value={prescriptionId} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <SubmitButton variant="destructive">Supprimer</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
