// Consultation slots. Times are wall-clock in APP_TIMEZONE (see lib/datetime),
// the same convention the "YYYY-MM-DDTHH:mm" form values use.
export const SLOT_START_HOUR = 8;
export const SLOT_END_HOUR = 20;
export const SLOT_STEP_MINUTES = 30;

export function timeSlots() {
  const slots: string[] = [];
  for (let m = SLOT_START_HOUR * 60; m < SLOT_END_HOUR * 60; m += SLOT_STEP_MINUTES) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
}

// Splits a "YYYY-MM-DDTHH:mm" value into its date and time halves.
export function splitDateTime(value: string | undefined) {
  const [date = "", time = ""] = (value ?? "").split("T");
  return { date, time };
}
