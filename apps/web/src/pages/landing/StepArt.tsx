/** Small line illustrations for the three homepage steps (original artwork, brand colors). */
const NAVY = "#0b1f4d", BLUE = "#2563eb", SKY = "#7fbde7";

export function QuoteArt() {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      <rect x="22" y="8" width="52" height="64" rx="6" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
      <path d="M32 24h32M32 34h24M32 44h28" stroke={SKY} strokeWidth="4" strokeLinecap="round" />
      <rect x="32" y="54" width="18" height="8" rx="3" fill={BLUE} />
      <circle cx="84" cy="44" r="18" fill="#eef4ff" stroke={BLUE} strokeWidth="2.5" />
      <path d="M84 33v22M79 38c0-3 10-3 10 0s-10 3-10 7 10 4 10 0" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BookArt() {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      <rect x="14" y="30" width="54" height="38" rx="4" fill="#f4d9b8" stroke={NAVY} strokeWidth="2.5" />
      <path d="M14 42h54M41 30v38" stroke={NAVY} strokeWidth="2" opacity="0.5" />
      <rect x="62" y="12" width="44" height="40" rx="6" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
      <path d="M62 24h44" stroke={NAVY} strokeWidth="2.5" />
      <path d="M72 8v8M96 8v8" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M73 38l7 6 14-14" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrackArt() {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      <path d="M14 62c18-2 22-24 40-26s26 14 44-6" fill="none" stroke={SKY} strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round" />
      <circle cx="14" cy="62" r="6" fill={NAVY} />
      <circle cx="54" cy="36" r="5" fill={BLUE} />
      <path d="M98 8c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14z" fill={BLUE} />
      <circle cx="98" cy="22" r="5" fill="#fff" />
    </svg>
  );
}

export const STEP_ART = [QuoteArt, BookArt, TrackArt];
