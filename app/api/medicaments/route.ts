import { requireRole } from "@/lib/dal";
import { searchMedicaments } from "@/lib/data/prescriptions";

// Search over the 13k-entry official catalogue. It can't be shipped to the
// browser, so the combobox queries this endpoint as the doctor types.
export async function GET(request: Request) {
  await requireRole("doctor");

  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(await searchMedicaments(q));
}
