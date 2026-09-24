"use client";

import { useState } from "react";
import { fr } from "date-fns/locale";
import { CalendarBlankIcon, ClockIcon } from "@phosphor-icons/react";
import { splitDateTime, timeSlots } from "@/lib/slots";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// "YYYY-MM-DD" <-> Date, built from the parts so no timezone shift can occur.
function toDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return y ? new Date(y, m - 1, d) : undefined;
}

/**
 * Converts a date to a YYYY-MM-DD string.
 * @param date - The date to convert.
 * @returns The formatted date string.
 */
function toDateValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Short form ("jeu. 24 sept. 2026") so the button and the time select fit
// side by side even in a dialog, which is only 448px wide.
function formatDate(value: string) {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Choisir une date";
}

/**
 * Formats a time slot using the French hour notation.
 * @param slot - The time slot to format.
 * @returns The formatted time slot.
 */
function formatTime(slot: string) {
  return slot.replace(":", " h ");
}

/**
 * Replaces `<input type="datetime-local">`: a calendar for the day and a list
 * of slots for the time. Slots stop doctors and patients from booking at
 * 03:47, and the calendar renders identically across browsers — unlike the
 * native control, whose layout and picker icon vary wildly.
 *
 * Submits the same "YYYY-MM-DDTHH:mm" string as before through a hidden
 * input, so the zod schemas and `parseLocalDateTime()` are untouched.
 */
export function DateTimeField({
  name,
  defaultValue,
  min,
  id,
}: {
  name: string;
  /** "YYYY-MM-DDTHH:mm" */
  defaultValue?: string;
  /** Earliest allowed value, same format. Past days and slots are disabled. */
  min?: string;
  id?: string;
}) {
  const initial = splitDateTime(defaultValue);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [open, setOpen] = useState(false);

  const minParts = splitDateTime(min);
  // Only today's slots need filtering; earlier days are disabled outright.
  const slots = timeSlots().filter((slot) => date !== minParts.date || slot > minParts.time);
  // An existing appointment may sit between two slots (older data, or a slot
  // list that changed since): keep it selectable rather than silently losing it.
  const options = time && !slots.includes(time) ? [time, ...slots] : slots;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={date && time ? `${date}T${time}` : ""} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="min-w-48 flex-1 justify-start font-normal"
            />
          }
        >
          <CalendarBlankIcon />
          <span className={date ? undefined : "text-muted-foreground"}>{formatDate(date)}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            required
            selected={toDate(date)}
            defaultMonth={toDate(date)}
            disabled={minParts.date ? { before: toDate(minParts.date)! } : undefined}
            onSelect={(selected: Date) => {
              setDate(toDateValue(selected));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Select value={time} onValueChange={(value) => setTime(value ?? "")}>
        <SelectTrigger className="w-full sm:w-32" aria-label="Heure">
          <ClockIcon />
          <SelectValue placeholder="Heure">
            {(value: string | null) => (value ? formatTime(value) : "Heure")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((slot) => (
            <SelectItem key={slot} value={slot}>
              {formatTime(slot)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
