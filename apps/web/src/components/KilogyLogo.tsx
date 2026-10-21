import logoDark from "../assets/brand/kilogy-logo.png";
import logoWhite from "../assets/brand/kilogy-logo-white.png";

/** Kilogy wordmark with chevrons. `onDark` uses the white version for navy backgrounds. */
export function KilogyLogo({ height = 32, onDark = false }: { height?: number; onDark?: boolean }) {
  return <img src={onDark ? logoWhite : logoDark} alt="KILOGY" height={height} style={{ display: "block", height, width: "auto" }} />;
}
