// Helpers for working with lap times.
// Times are stored as integer milliseconds so math stays exact.

export type Lap = {
  id: string;
  track: string;
  driver: string;
  ms: number;
  createdAt: number;
};

export type TrackStats = {
  track: string;
  laps: number;
  bestMs: number;
  bestDriver: string;
  avgMs: number;
  stdDevMs: number;
  // 0-100, higher = more consistent laps
  consistency: number;
};

// Accepts "1:23.456", "83.456", "1:23", or "0:59.9"
export function parseLapTime(input: string): number | null {
  const s = input.trim();
  const match = s.match(/^(?:(\d+):)?(\d{1,2}(?:\.\d{1,3})?)$/);
  if (!match) return null;

  const minutes = match[1] ? parseInt(match[1], 10) : 0;
  const seconds = parseFloat(match[2]);

  // "1:75.000" isn't a real time
  if (match[1] && seconds >= 60) return null;

  const ms = Math.round((minutes * 60 + seconds) * 1000);
  return ms > 0 ? ms : null;
}

export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms % 60000) / 1000;
  const secStr = seconds.toFixed(3).padStart(6, "0");
  return minutes > 0 ? `${minutes}:${secStr}` : seconds.toFixed(3);
}

export function computeStats(laps: Lap[]): TrackStats[] {
  const byTrack = new Map<string, Lap[]>();
  for (const lap of laps) {
    const key = lap.track;
    if (!byTrack.has(key)) byTrack.set(key, []);
    byTrack.get(key)!.push(lap);
  }

  const stats: TrackStats[] = [];
  for (const [track, trackLaps] of byTrack) {
    const times = trackLaps.map((l) => l.ms);
    const best = trackLaps.reduce((a, b) => (b.ms < a.ms ? b : a));
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance =
      times.reduce((sum, t) => sum + (t - avg) ** 2, 0) / times.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation mapped to a 0-100 score.
    // A 2% spread or worse scores 0, identical laps score 100.
    const cv = stdDev / avg;
    const consistency = Math.max(0, Math.round(100 - (cv / 0.02) * 100));

    stats.push({
      track,
      laps: trackLaps.length,
      bestMs: best.ms,
      bestDriver: best.driver,
      avgMs: Math.round(avg),
      stdDevMs: Math.round(stdDev),
      consistency,
    });
  }

  return stats.sort((a, b) => a.track.localeCompare(b.track));
}
