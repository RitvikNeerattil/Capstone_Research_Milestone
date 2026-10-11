import { computeStats, type Lap } from "@/lib/laptime";

// POST /api/stats
// Body: { laps: Lap[] }
// Returns per-track stats computed on the server.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const laps = (body as { laps?: unknown })?.laps;
  if (!Array.isArray(laps)) {
    return Response.json({ error: "Expected { laps: [...] }" }, { status: 400 });
  }

  const valid = laps.filter(
    (l): l is Lap =>
      typeof l === "object" &&
      l !== null &&
      typeof l.track === "string" &&
      typeof l.driver === "string" &&
      typeof l.ms === "number" &&
      l.ms > 0
  );

  return Response.json({ stats: computeStats(valid) });
}
