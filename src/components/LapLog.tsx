"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatLapTime,
  parseLapTime,
  type Lap,
  type TrackStats,
} from "@/lib/laptime";

const STORAGE_KEY = "lap-log:laps";
const DEFAULT_TRACKS = ["Monza", "Spa", "Silverstone", "Suzuka", "Interlagos"];

function loadLaps(): Lap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Lap[]) : [];
  } catch {
    return [];
  }
}

export default function LapLog() {
  // This component only renders in the browser (see LapLogClient),
  // so it's safe to read localStorage right away.
  const [laps, setLaps] = useState<Lap[]>(loadLaps);
  const [stats, setStats] = useState<TrackStats[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [track, setTrack] = useState("Monza");
  const [driver, setDriver] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Save whenever laps change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(laps));
    } catch {
      // storage blocked, app still works in memory
    }
  }, [laps]);

  // Ask the server for stats whenever laps change
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laps }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: { stats: TrackStats[] }) => {
        setStats(data.stats);
        setStatsError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStatsError(err.message);
      });
    return () => controller.abort();
  }, [laps]);

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

  function loadSample() {
    const sample: [string, string, string][] = [
      ["Monza", "Ritvik", "1:21.874"],
      ["Monza", "Ritvik", "1:22.310"],
      ["Monza", "Alex", "1:21.602"],
      ["Monza", "Ritvik", "1:22.045"],
      ["Spa", "Ritvik", "1:46.221"],
      ["Spa", "Alex", "1:47.090"],
      ["Spa", "Ritvik", "1:45.988"],
      ["Suzuka", "Alex", "1:31.455"],
    ];
    setLaps(
      sample.map(([t, d, time], i) => ({
        id: crypto.randomUUID(),
        track: t,
        driver: d,
        ms: parseLapTime(time)!,
        createdAt: Date.now() + i,
      }))
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lap Log</h1>
        <p className="mt-1 text-sm opacity-70">
          Log lap times, see your best, average and how consistent you are at
          each track.
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

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="ml-auto flex gap-2">
          <button
            onClick={loadSample}
            className="rounded-md border border-black/15 px-3 py-1 text-sm dark:border-white/20"
          >
            Load sample data
          </button>
          {laps.length > 0 && (
            <button
              onClick={() => setLaps([])}
              className="rounded-md border border-black/15 px-3 py-1 text-sm dark:border-white/20"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Stats from the API */}
      {statsError && (
        <p className="mt-4 text-sm text-red-600">
          Couldn&apos;t load stats: {statsError}
        </p>
      )}
      {stats.length > 0 && (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.track}
              className="rounded-xl border border-black/10 p-4 dark:border-white/15"
            >
              <h2 className="font-semibold">{s.track}</h2>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="opacity-60">Best</dt>
                <dd className="font-mono">
                  {formatLapTime(s.bestMs)}{" "}
                  <span className="opacity-60">({s.bestDriver})</span>
                </dd>
                <dt className="opacity-60">Average</dt>
                <dd className="font-mono">{formatLapTime(s.avgMs)}</dd>
                <dt className="opacity-60">Laps</dt>
                <dd>{s.laps}</dd>
                <dt className="opacity-60">Consistency</dt>
                <dd>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded bg-black/10 dark:bg-white/15">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{ width: `${s.consistency}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{s.consistency}</span>
                  </div>
                </dd>
              </dl>
            </div>
          ))}
        </section>
      )}

      {/* Lap table */}
      <section className="mt-6">
        {sortedLaps.length === 0 ? (
          <p className="text-sm opacity-60">
            No laps yet. Add one above or load the sample data.
          </p>
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
