import { CARRIERS } from "../data/carriers";

/**
 * Carrier logo row for the homepage.
 *
 * Official logo files go in src/assets/carriers/, named by carrier id (dhl.svg, fedex.svg, ups.svg,
 * ethiopian.svg, canadapost.svg, maersk.svg, gig.svg; .png or .webp also work). Use each carrier's
 * own brand or media-kit files. Until a file is added, that carrier shows as a text wordmark.
 */
const FILES = import.meta.glob("../assets/carriers/*.{svg,png,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const logoFor = (id: string) => Object.entries(FILES).find(([path]) => path.split("/").pop()?.split(".")[0] === id)?.[1];

const COLORS: Record<string, string> = {
  dhl: "#d40511", fedex: "#4d148c", ups: "#5a3a1a", ethiopian: "#0a7b4a", canadapost: "#c8102e", maersk: "#0a6ebd", gig: "#0f766e",
};

export function CarrierLogos() {
  return (
    <ul className="klogos">
      {CARRIERS.map((c) => {
        const src = logoFor(c.id);
        return (
          <li key={c.id} title={`${c.name}: ${c.status === "planned" ? "planned integration" : "integration in testing"}`}>
            {src ? <img src={src} alt={c.name} /> : (
              <span className="klogos-word" style={{ color: COLORS[c.id] ?? "#0b1f4d" }}>{c.name.replace(/ \(.*\)$/, "")}</span>
            )}
            {c.status === "planned" && <span className="klogos-soon">Planned</span>}
          </li>
        );
      })}
    </ul>
  );
}
