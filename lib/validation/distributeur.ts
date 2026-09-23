import { z } from "zod";

// Card UIDs are 4, 7 or 10 bytes. The ESP32 may send them as "39:18:b9:e3"
// or "3918b9e3": both are stored and matched as "3918B9E3" (User.rfidUid).
export const rfidUidSchema = z
  .string()
  .transform((value) => value.replace(/[\s:-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$/, "UID invalide"));

export const scanSchema = z.object({ uid: rfidUidSchema });
