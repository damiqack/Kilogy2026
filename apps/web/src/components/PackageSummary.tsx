import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import "./package.css";
import { Tooltip } from "antd";
import type { PackageSpec } from "../data/types";
import { cad } from "../lib/money";
import { COMMODITY_NOTES, COURIER_MAX_GIRTH_CM, COURIER_MAX_KG, COURIER_MAX_LENGTH_CM, packageFacts, VOLUMETRIC_DIVISOR } from "../lib/package";

/** Isometric box drawn to the package's proportions (original artwork). */
function BoxArt({ l, w, h }: { l: number; w: number; h: number }) {
  const max = Math.max(l, w, h, 1);
  // Keep very thin sides visible while preserving the box's overall shape.
  const L = 0.3 + (0.7 * l) / max, W = 0.3 + (0.7 * w) / max, H = 0.3 + (0.7 * h) / max;
  const c = Math.cos(Math.PI / 6);
  const P = (x: number, y: number, z: number): [number, number] => [(x - y) * c, (x + y) * 0.5 - z];
  const corners = [[0, 0, 0], [L, 0, 0], [0, W, 0], [L, W, 0], [0, 0, H], [L, 0, H], [0, W, H], [L, W, H]].map(([x, y, z]) => P(x, y, z));
  const xs = corners.map((q) => q[0]), ys = corners.map((q) => q[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), spanX = Math.max(...xs) - minX, spanY = Math.max(...ys) - minY;
  const k = Math.min(116 / spanX, 96 / spanY);
  const offX = 12 + (116 - spanX * k) / 2, offY = 12 + (96 - spanY * k) / 2;
  const T = (x: number, y: number, z: number) => { const [sx, sy] = P(x, y, z); return `${(offX + (sx - minX) * k).toFixed(1)},${(offY + (sy - minY) * k).toFixed(1)}`; };
  const face = (pts: [number, number, number][]) => pts.map((q) => T(...q)).join(" ");
  return (
    <svg viewBox="0 0 140 120" width="120" height="103" aria-hidden className="kpkg-box">
      <polygon points={face([[L, 0, 0], [L, W, 0], [L, W, H], [L, 0, H]])} fill="#d9b080" stroke="#7c5a32" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={face([[0, W, 0], [L, W, 0], [L, W, H], [0, W, H]])} fill="#e9c9a0" stroke="#7c5a32" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={face([[0, 0, H], [L, 0, H], [L, W, H], [0, W, H]])} fill="#f4dcb8" stroke="#7c5a32" strokeWidth="1.2" strokeLinejoin="round" />
      <polyline points={face([[L / 2, 0, H], [L / 2, W, H], [L / 2, W, H * 0.55]])} fill="none" stroke="#b08955" strokeWidth="4" opacity="0.75" />
    </svg>
  );
}

const Hint = ({ text }: { text: string }) => (
  <Tooltip title={text}><InfoCircleOutlined className="kpkg-hint" aria-label={text} tabIndex={0} /></Tooltip>
);

/** Live package summary for the quote flow: weights, size class, limits and handling notes. */
export function PackageSummary({ pkg, commodity, compact = false }: { pkg: PackageSpec; commodity: string; compact?: boolean }) {
  const d = pkg.dimensions ?? { l: 1, w: 1, h: 1 };
  const f = packageFacts(pkg);
  const note = COMMODITY_NOTES[commodity];

  if (compact) {
    return (
      <div className="kpkg-strip">
        <b>Package</b>
        <span>{f.actualKg} kg</span>
        <span>{d.l} × {d.w} × {d.h} cm</span>
        <span>Chargeable <b>{f.chargeableKg} kg</b>{f.billedOn === "volumetric" && " (by size)"}</span>
        <span>{f.sizeClass}</span>
        <span>{commodity}</span>
        {pkg.value_usd ? <span>Declared {cad(pkg.value_usd)}</span> : null}
      </div>
    );
  }

  return (
    <section className="kpkg" aria-label="Package summary">
      <div className="kpkg-head">
        <BoxArt l={d.l} w={d.w} h={d.h} />
        <div>
          <span className={`kpkg-class${f.overCourierLimits ? " is-freight" : ""}`}>{f.sizeClass}</span>
          <div className="kpkg-big">{f.chargeableKg} kg</div>
          <div className="ktiny">chargeable weight</div>
        </div>
      </div>
      <dl>
        <dt>Actual weight</dt><dd>{f.actualKg} kg</dd>
        <dt>Dimensions</dt><dd>{d.l} × {d.w} × {d.h} cm</dd>
        <dt>Volume</dt><dd>{f.volumeL < 1000 ? `${f.volumeL} L` : `${(f.volumeL / 1000).toFixed(2)} m³`}</dd>
        <dt>Volumetric weight <Hint text={`Length × width × height in cm ÷ ${VOLUMETRIC_DIVISOR}. Carriers bill whichever is higher: this or the actual weight.`} /></dt>
        <dd className={f.billedOn === "volumetric" ? "is-billed" : ""}>{f.volumetricKg} kg</dd>
        <dt>Length + girth <Hint text={`Longest side plus twice the other two. Couriers accept up to ${COURIER_MAX_GIRTH_CM} cm.`} /></dt>
        <dd>{f.lengthPlusGirthCm} cm</dd>
        <dt>Contents</dt><dd>{commodity}</dd>
        {pkg.value_usd ? <><dt>Declared value</dt><dd>{cad(pkg.value_usd)}</dd></> : null}
      </dl>
      <ul className="kpkg-notes">
        {f.billedOn === "volumetric" && (
          <li><InfoCircleOutlined /> Billed by size: the box is large for its weight. A smaller box would lower the price.</li>
        )}
        {f.overCourierLimits && (
          <li className="is-warn"><WarningOutlined /> Over courier limits ({COURIER_MAX_KG} kg, {COURIER_MAX_LENGTH_CM} cm longest side or {COURIER_MAX_GIRTH_CM} cm length + girth). Quotes will favour freight services.</li>
        )}
        {note && <li><InfoCircleOutlined /> {note}</li>}
        {!pkg.value_usd && <li><InfoCircleOutlined /> Add a declared value so customs paperwork and insurance can be prepared.</li>}
      </ul>
    </section>
  );
}
