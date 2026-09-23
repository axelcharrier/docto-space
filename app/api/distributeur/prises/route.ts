import { createHash, timingSafeEqual } from "node:crypto";
import { dispenserPrises, findAstronauteByRfid } from "@/lib/data/distributeur";
import { notifyUsers } from "@/lib/events";
import { scanSchema } from "@/lib/validation/distributeur";

// Called by the ESP32 dispenser when a card is scanned. The device has no
// session, so it authenticates with a shared key instead:
//   Authorization: Bearer <DISTRIBUTEUR_API_KEY>
// Hashing both sides gives equal-length buffers for timingSafeEqual.
function cleValide(request: Request) {
  const attendue = process.env.DISTRIBUTEUR_API_KEY;
  if (!attendue) return false;

  const recue = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(recue), hash(attendue));
}

// Body: { "uid": "3918B9E3" }
// Reply: { "autorise": true, "medicaments": [{ "id": 60234100, "quantite": 2 }] }.
// The ESP32 picks the motor from each CIS code, sent as an integer (8
// digits, fits int32), and releases `quantite` units.
export async function POST(request: Request) {
  if (!cleValide(request)) {
    return Response.json({ erreur: "Clé invalide" }, { status: 401 });
  }

  const parsed = scanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ erreur: "UID invalide" }, { status: 400 });
  }

  const astronaute = await findAstronauteByRfid(parsed.data.uid);
  if (!astronaute) {
    return Response.json({ erreur: "Carte inconnue" }, { status: 404 });
  }

  const { medicaments, medecinIds } = await dispenserPrises(astronaute.id);
  if (medicaments.length > 0) {
    // Live update of the "taken today" lines on both sides.
    notifyUsers([astronaute.id, ...medecinIds]);
  }

  return Response.json({
    autorise: medicaments.length > 0,
    medicaments: medicaments.map((m) => ({ id: Number(m.id), quantite: m.quantite })),
  });
}
