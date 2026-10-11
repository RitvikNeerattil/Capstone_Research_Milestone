"use client";

import { useMemo, useState } from "react";
import { formatLapTime, parseLapTime, type Lap } from "@/lib/laptime";

const DEFAULT_TRACKS = ["Monza", "Spa", "Silverstone", "Suzuka", "Interlagos"];

export default function LapLog() {
  const [laps, setLaps] = useState<Lap[]>([]);

  const [track, setTrack] = useState("Monza");
  const [driver, setDriver] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const tracks = useMemo(() => {
    const set = new Set([...DEFAULT_TRACKS, ...laps.map((l) => l.track)]);
    return [...set].sort();
  }, [laps]);

  // Fastest laps first
  const sortedLaps = useMemo(() => [...laps].sort((a, b) => a.ms - b.ms), [laps]);

  function addLap(e: React.FormEvent) {
    e.preventDefault();
    const ms = parseLapTime(time);
    const trackName = track.trim();
    const driverName = driver.trim();

    if (!trackName) return setFormError("Pick or type a track.");
    if (!driverName) return setFormError("Enter a driver name.");
    if (ms === null)
      return setFormError('Time should look like "1:23.456" or "83.456".');

    setLaps((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        track: trackName,
        driver: driverName,
        ms,
        createdAt: Date.now(),
      },
    ]);
    setTime("");
    setFormError(null);
  }

  function removeLap(id: string) {
    setLaps((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lap Log</h1>
        <p className="mt-1 text-sm opacity-70">
          Log lap times and see how you&apos;re doing at each track.
        </p>
      </header>

      {/* Entry form */}
      <form
        onSubmit={addLap}
        className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] dark:border-white/15"
      >
        <label className="flex flex-col gap-1 text-sm">
          Track
          <input
            list="tracks"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          <datalist id="tracks">
            {tracks.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Driver
          <input
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            placeholder="Your name"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Lap time
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="1:23.456"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 font-mono dark:border-white/20"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Add lap
        </button>
        {formError && (
          <p className="text-sm text-red-600 sm:col-span-4">{formError}</p>
        )}
      </form>

      {/* Lap table */}
      <section className="mt-8">
        {sortedLaps.length === 0 ? (
          <p className="text-sm opacity-60">No laps yet. Add one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left opacity-60 dark:border-white/15">
                <th className="py-2">#</th>
                <th>Track</th>
                <th>Driver</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedLaps.map((lap, i) => (
                <tr
                  key={lap.id}
                  className="border-b border-black/5 dark:border-white/10"
                >
                  <td className="py-2 opacity-60">{i + 1}</td>
                  <td>{lap.track}</td>
                  <td>{lap.driver}</td>
                  <td className="font-mono">{formatLapTime(lap.ms)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => removeLap(lap.id)}
                      className="opacity-50 hover:opacity-100"
                      aria-label="Delete lap"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
