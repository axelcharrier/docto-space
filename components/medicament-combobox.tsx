"use client";

import { useEffect, useState } from "react";
import type { MedicamentOption } from "@/lib/data/prescriptions";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const DEBOUNCE_MS = 200;

/**
 * Picks a medicine from the official catalogue (~13 600 entries, see
 * prisma/seed.ts). Typing only ever filters — a doctor cannot type a name
 * that doesn't exist, so misspellings are impossible by construction.
 *
 * The catalogue is far too big to ship to the browser, so each keystroke
 * queries /api/medicaments, which returns the 20 best matches.
 */
export function MedicamentCombobox({
  value,
  onChange,
  id,
}: {
  value: MedicamentOption | null;
  onChange: (medicament: MedicamentOption | null) => void;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MedicamentOption[]>([]);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setChargement(true);
      try {
        const res = await fetch(`/api/medicaments?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) setOptions(await res.json());
      } catch {
        // Aborted by the next keystroke, or offline: keep the current list.
      } finally {
        setChargement(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <Combobox
      items={options}
      value={value}
      onValueChange={onChange}
      onInputValueChange={setQuery}
      itemToStringLabel={(item: MedicamentOption) => item.denomination}
      // The server already filtered; filtering again would hide matches whose
      // text doesn't start the same way.
      filter={null}
    >
      <ComboboxInput id={id} placeholder="Rechercher un médicament…" />
      <ComboboxContent>
        <ComboboxEmpty>
          {chargement ? "Recherche…" : "Aucun médicament ne correspond."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: MedicamentOption) => (
            <ComboboxItem key={item.codeCis} value={item}>
              {item.denomination}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
