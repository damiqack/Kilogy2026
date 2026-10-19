import type { Mode } from "../data/types";

/** Small line icons for transport modes (ship, plane, truck, train). */
const PATHS: Record<Mode, string> = {
  ocean: "M3 15l1.5 4h15L21 15H3zm3-1V9h5V5h2v4h5v5M8 11h2m4 0h2M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1",
  air: "M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5v5.5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5V13l8 2.5z",
  road: "M2 6h12v10H2zM14 9h4l3 3.5V16h-7M5.5 19a1.8 1.8 0 1 0 0-.01M17.5 19a1.8 1.8 0 1 0 0-.01",
  rail: "M6 3h12v12H6zM6 10h12M9 15l-3 5m9-5 3 5M9 7h.01M15 7h.01",
};
const LABEL: Record<Mode, string> = { ocean: "Ocean", air: "Air", road: "Road", rail: "Rail" };

export function ModeIcon({ mode, size = 18 }: { mode: Mode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[mode]} />
    </svg>
  );
}

export function ModeLabel({ mode }: { mode: Mode }) {
  return (
    <span className="kmode"><ModeIcon mode={mode} /> {LABEL[mode]}</span>
  );
}

/** Carrier name set as a small colored wordmark (text only; no third-party logos are bundled). */
const CARRIER_COLORS: Record<string, string> = {
  dhl: "#d40511", fedex: "#4d148c", ups: "#5a3a1a", ethiopian: "#0a7b4a", canadapost: "#c8102e", maersk: "#0a6ebd", gig: "#0f766e",
};
export function CarrierMark({ id, name }: { id: string; name: string }) {
  return (
    <span className="kcarrier">
      <span className="kcarrier-dot" style={{ background: CARRIER_COLORS[id] ?? "#64748b" }} aria-hidden />
      {name}
    </span>
  );
}
