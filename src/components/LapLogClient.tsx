"use client";

import dynamic from "next/dynamic";

// LapLog reads saved laps from localStorage, which only exists in the
// browser. Skipping server rendering for it avoids hydration mismatches.
const LapLog = dynamic(() => import("./LapLog"), {
  ssr: false,
  loading: () => (
    <p className="mx-auto max-w-4xl px-4 py-10 text-sm opacity-60">Loading…</p>
  ),
});

export default LapLog;
