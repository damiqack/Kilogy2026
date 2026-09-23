import { Leaf, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiskBadge, Tag } from "../components/Badges";
import { RouteLegs } from "../components/RouteLegs";
import { ScoreBars } from "../components/ScoreBars";
import { requestQuote } from "../data/ai";
import { useStore } from "../data/store";
import type { Preferences, Quote, QuoteRequest, RankedOption, ServiceLevel } from "../data/types";
import { date, days, kg, usd } from "../lib/format";

const COUNTRIES = [
  ["CA", "Canada"], ["US", "United States"], ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"],
  ["ZA", "South Africa"], ["EG", "Egypt"], ["GB", "United Kingdom"], ["FR", "France"], ["DE", "Germany"],
  ["NL", "Netherlands"], ["AE", "United Arab Emirates"], ["IN", "India"], ["CN", "China"], ["BR", "Brazil"],
];

// Default request = the example from the architecture doc (section 2.3).
const DEFAULT: QuoteRequest = {
  origin: { country: "CA", city: "Montreal", postalCode: "H3A1A1" },
  destination: { country: "NG", city: "Lagos" },
  package: { weight_kg: 10, dimensions: { l: 30, w: 20, h: 15 } },
  service_type: ["express", "standard"],
  ai_optimize: true,
  preferences: { cost: 35, speed: 30, carbon: 20, reliability: 15 },
};

const PRESETS: { label: string; prefs: Preferences }[] = [
  { label: "Balanced", prefs: { cost: 35, speed: 30, carbon: 20, reliability: 15 } },
  { label: "Cheapest", prefs: { cost: 80, speed: 5, carbon: 5, reliability: 10 } },
  { label: "Fastest", prefs: { cost: 5, speed: 80, carbon: 0, reliability: 15 } },
  { label: "Greenest", prefs: { cost: 15, speed: 5, carbon: 70, reliability: 10 } },
];

export function NewQuote() {
  const [req, setReq] = useState<QuoteRequest>(DEFAULT);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const { saveQuote, book } = useStore();
  const navigate = useNavigate();

  const set = <K extends keyof QuoteRequest>(k: K, v: QuoteRequest[K]) => setReq((r) => ({ ...r, [k]: v }));
  const toggleService = (s: ServiceLevel) =>
    set("service_type", req.service_type.includes(s) ? req.service_type.filter((x) => x !== s) : [...req.service_type, s]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const q = await requestQuote(req);
      setQuote(q);
      saveQuote(q);
    } finally {
      setLoading(false);
    }
  }

  function onBook(o: RankedOption) {
    if (!quote) return;
    const s = book(quote, o);
    navigate(`/shipments/${s.id}`);
  }

  const dims = req.package.dimensions!;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>New quote</h1>
          <p>Compare carriers side by side. The AI engine ranks every option on cost, speed, carbon and reliability.</p>
        </div>
      </div>

      <form className="card card-pad stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="section-title">Route</div>
        <div className="form-grid">
          <Field label="Origin country">
            <select className="select" value={req.origin.country} onChange={(e) => set("origin", { ...req.origin, country: e.target.value })}>
              {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </Field>
          <Field label="Origin city"><input className="input" value={req.origin.city ?? ""} onChange={(e) => set("origin", { ...req.origin, city: e.target.value })} /></Field>
          <Field label="Destination country">
            <select className="select" value={req.destination.country} onChange={(e) => set("destination", { ...req.destination, country: e.target.value })}>
              {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </Field>
          <Field label="Destination city"><input className="input" value={req.destination.city ?? ""} onChange={(e) => set("destination", { ...req.destination, city: e.target.value })} /></Field>
        </div>

        <div className="section-title">Package</div>
        <div className="form-grid">
          <Field label="Weight (kg)"><input className="input" type="number" min={0.1} step={0.1} value={req.package.weight_kg} onChange={(e) => set("package", { ...req.package, weight_kg: +e.target.value })} /></Field>
          {(["l", "w", "h"] as const).map((d) => (
            <Field key={d} label={{ l: "Length (cm)", w: "Width (cm)", h: "Height (cm)" }[d]}>
              <input className="input" type="number" min={1} value={dims[d]} onChange={(e) => set("package", { ...req.package, dimensions: { ...dims, [d]: +e.target.value } })} />
            </Field>
          ))}
        </div>

        <div className="grid g-2" style={{ gap: 24 }}>
          <div className="stack" style={{ gap: 12 }}>
            <div className="section-title">Service levels</div>
            <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
              {(["express", "standard", "economy"] as ServiceLevel[]).map((s) => (
                <label key={s} className="check" style={{ textTransform: "capitalize" }}>
                  <input type="checkbox" checked={req.service_type.includes(s)} onChange={() => toggleService(s)} /> {s}
                </label>
              ))}
            </div>
            <label className="check"><input type="checkbox" checked={req.ai_optimize} onChange={(e) => set("ai_optimize", e.target.checked)} /> AI price optimization</label>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row-between">
              <div className="section-title">What matters most</div>
              <div className="row" style={{ gap: 4 }}>
                {PRESETS.map((p) => <button type="button" key={p.label} className="btn btn-sm" onClick={() => set("preferences", p.prefs)}>{p.label}</button>)}
              </div>
            </div>
            {(Object.keys(req.preferences) as (keyof Preferences)[]).map((k) => (
              <div key={k} className="slider-row">
                <span className="small" style={{ textTransform: "capitalize" }}>{k}</span>
                <input type="range" min={0} max={100} value={req.preferences[k]} onChange={(e) => set("preferences", { ...req.preferences, [k]: +e.target.value })} />
                <span className="small num faint">{req.preferences[k]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" disabled={loading || !req.service_type.length}>
            {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Get AI-ranked quotes
          </button>
        </div>
      </form>

      {quote && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{quote.options.length} options ranked</h2>
              <div className="small muted">Chargeable weight {quote.chargeable_weight_kg} kg · Quote {quote.id}</div>
            </div>
            <span className={`badge ${quote.source === "ai-engine" ? "b-green" : "b-amber"}`}>
              {quote.source === "ai-engine" ? "Live AI engine" : "Mock AI (start services/ai-engine for live results)"}
            </span>
          </div>
          {quote.options.length === 0 && <div className="empty">No carriers offer these service levels on this lane.</div>}
          {quote.options.map((o) => <OptionRow key={`${o.carrier_id}-${o.service}`} o={o} onBook={() => onBook(o)} />)}
        </div>
      )}
    </>
  );
}

function OptionRow({ o, onBook }: { o: RankedOption; onBook: () => void }) {
  return (
    <div className={`option${o.rank === 1 ? " top" : ""}`}>
      <div className="rank">{o.rank}</div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <h3>{o.carrier_name}</h3>
          <span className="badge" style={{ textTransform: "capitalize" }}>{o.service}</span>
          {o.tags?.map((t) => <Tag key={t} tag={t} />)}
        </div>
        {o.route && <RouteLegs legs={o.route.legs} />}
        <div className="row small muted" style={{ flexWrap: "wrap", gap: 12 }}>
          <span>{days(o.transit_days)}</span>
          <span className="row" style={{ gap: 4 }}><Leaf size={13} color="var(--green)" /> {kg(o.co2_kg)} CO₂e</span>
          <span>ETA {date(o.risk.eta.earliest)} – {date(o.risk.eta.latest)}</span>
          <RiskBadge level={o.risk.level} score={o.risk.score} />
        </div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row-between small"><span className="muted">AI score</span><strong className="num">{o.ai_score}</strong></div>
        <ScoreBars scores={o.ai_scores} />
      </div>
      <div className="stack" style={{ alignItems: "flex-end", gap: 6 }}>
        <div className="price">{usd(o.price_usd)}</div>
        <div className="small faint">margin {o.pricing.margin_pct}%</div>
        <button className="btn btn-primary btn-sm" onClick={onBook}>Book</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
