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

export function toLocalInputValue(date: Date) {
  const p = wallClockParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("fr-FR", {
    timeZone: APP_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  });
}
