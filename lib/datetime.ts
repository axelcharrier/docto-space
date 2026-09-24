export const APP_TIMEZONE = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Extracts the local date and time components from a date.
 * @param date - The date to extract components from.
 * @returns The year, month, day, hour, minute, and second components.
 */
function wallClockParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Offset (ms) of APP_TIMEZONE relative to UTC at the given instant.
function tzOffsetMs(date: Date) {
  const p = wallClockParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

// "YYYY-MM-DDTHH:mm" wall-clock time in APP_TIMEZONE -> UTC Date.
export function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the offset change around DST transitions.
  let result = guess - tzOffsetMs(new Date(guess));
  result = guess - tzOffsetMs(new Date(result));
  const date = new Date(result);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Converts a date to a local date-time input value.
 * @param date - The date to convert.
 * @returns The date formatted as YYYY-MM-DDTHH:mm.
 */
export function toLocalInputValue(date: Date) {
  const p = wallClockParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Formats a date and time using the French locale and application time zone.
 * @param date - The date to format.
 * @returns The formatted date and time string.
 */
export function formatDateTime(date: Date) {
  return date.toLocaleString("fr-FR", {
    timeZone: APP_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  });
}

// Midnight of the given instant's day, in APP_TIMEZONE.
export function debutJourLocal(date: Date) {
  return parseLocalDateTime(`${toLocalInputValue(date).slice(0, 10)}T00:00`)!;
}

/**
 * Formats a date as a short time using the French locale and application time zone.
 * @param date - The date to format.
 * @returns The formatted time string.
 */
export function formatHeure(date: Date) {
  return date.toLocaleTimeString("fr-FR", { timeZone: APP_TIMEZONE, timeStyle: "short" });
}

// "aujourd'hui à 12:00", "demain à 08:00", "jeudi 24 septembre à 08:00".
export function formatJourHeure(date: Date, now: Date) {
  const jour = (d: Date) => toLocalInputValue(d).slice(0, 10);
  const demain = new Date(debutJourLocal(now).getTime() + 36 * 60 * 60 * 1000);
  const heure = formatHeure(date);

  if (jour(date) === jour(now)) return `aujourd'hui à ${heure}`;
  if (jour(date) === jour(demain)) return `demain à ${heure}`;
  const libelleJour = date.toLocaleDateString("fr-FR", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${libelleJour} à ${heure}`;
}
