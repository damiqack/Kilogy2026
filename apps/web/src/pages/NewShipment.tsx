import { ArrowLeft, ArrowRight, Loader2, Settings2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RiskBadge } from "../components/Badges";
import { Info } from "../components/Info";
import { QuoteTable } from "../components/QuoteTable";
import { RouteLegs } from "../components/RouteLegs";
import { inlineSuggestions, requestQuote } from "../data/ai";
import { useStore } from "../data/store";
import type { Location, Preferences, Quote, QuoteRequest, RankedOption, ServiceLevel } from "../data/types";
import { date, days, kg } from "../lib/format";
import { cad } from "../lib/money";

export const COUNTRIES: [string, string][] = [
  ["CA", "Canada"], ["US", "United States"], ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["SN", "Senegal"],
  ["ZA", "South Africa"], ["EG", "Egypt"], ["ET", "Ethiopia"], ["GB", "United Kingdom"], ["FR", "France"], ["DE", "Germany"],
  ["NL", "Netherlands"], ["AE", "United Arab Emirates"], ["IN", "India"], ["CN", "China"], ["BR", "Brazil"],
];
const COMMODITIES = ["General merchandise", "Consumer electronics", "Documents", "Apparel & textiles", "Auto parts", "Food (non-perishable)", "Medical supplies"];
const STEPS = ["Addresses", "Package details", "Compare AI quotes", "Review & book"];
const PRESETS: { label: string; prefs: Preferences }[] = [
  { label: "Balanced", prefs: { cost: 35, speed: 30, carbon: 20, reliability: 15 } },
  { label: "Cheapest", prefs: { cost: 80, speed: 5, carbon: 5, reliability: 10 } },
  { label: "Fastest", prefs: { cost: 5, speed: 80, carbon: 0, reliability: 15 } },
  { label: "Greenest", prefs: { cost: 15, speed: 5, carbon: 70, reliability: 10 } },
];

function parseLoc(v: string | null, fallback: Location): Location {
  if (!v) return fallback;
  const [country, city] = v.split(":");
  return { country, city };
}

export function NewShipment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { saveQuote, book } = useStore();
  const [step, setStep] = useState(0);
  const [req, setReq] = useState<QuoteRequest>(() => ({
    // Defaults = the example request in docs/ARCHITECTURE.md section 2.3
    origin: parseLoc(params.get("from"), { country: "CA", city: "Montreal", postalCode: "H3A1A1" }),
    destination: parseLoc(params.get("to"), { country: "NG", city: "Lagos" }),
    package: { weight_kg: 10, dimensions: { l: 30, w: 20, h: 15 } },
    service_type: ["express", "standard"],
    ai_optimize: true,
    preferences: PRESETS[0].prefs,
  }));
  const [street, setStreet] = useState({ origin: "845 Sherbrooke St W", destination: "" });
  const [commodity, setCommodity] = useState(COMMODITIES[1]);
  const [showPrefs, setShowPrefs] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selected, setSelected] = useState<RankedOption | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof QuoteRequest>(k: K, v: QuoteRequest[K]) => setReq((r) => ({ ...r, [k]: v }));
  const tips = useMemo(() => inlineSuggestions(req), [req]);
  const dims = req.package.dimensions!;
  const addressesValid = !!(req.origin.city && req.destination.city && req.origin.country && req.destination.country);

  async function getQuotes() {
    setLoading(true);
    try {
      const q = await requestQuote(req);
      setQuote(q);
      saveQuote(q);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    if (!quote || !selected) return;
    const s = book(quote, selected, { street, commodity });
    navigate(`/shipments/${s.id}`);
  }

  const toggleService = (s: ServiceLevel) =>
    set("service_type", req.service_type.includes(s) ? req.service_type.filter((x) => x !== s) : [...req.service_type, s]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>New Shipment</h1>
          <p className="sub">Step {step + 1} of 4: {STEPS[step]}</p>
        </div>
      </div>

      <ol className="stepper" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="bar-seg" />
            <span className="step-label">{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form className="card card-pad stack" style={{ gap: 28 }} onSubmit={(e) => { e.preventDefault(); if (addressesValid) setStep(1); }}>
          <AddressBlock legend="Origin Address" loc={req.origin} street={street.origin}
            onLoc={(l) => set("origin", l)} onStreet={(v) => setStreet({ ...street, origin: v })} idp="o" />
          <AddressBlock legend="Destination Address" loc={req.destination} street={street.destination}
            onLoc={(l) => set("destination", l)} onStreet={(v) => setStreet({ ...street, destination: v })} idp="d" />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={!addressesValid}>Continue <ArrowRight size={16} aria-hidden /></button>
          </div>
        </form>
      )}

      {step === 1 && (
        <form className="card card-pad stack" style={{ gap: 24 }} onSubmit={(e) => { e.preventDefault(); getQuotes(); }}>
          <fieldset className="fieldset">
            <legend>Package Details</legend>
            <div className="form-grid-5">
              <Field id="w" label="Weight (kg)"><input id="w" className="input" type="number" min={0.1} step={0.1} required value={req.package.weight_kg} onChange={(e) => set("package", { ...req.package, weight_kg: +e.target.value })} /></Field>
              {(["l", "w", "h"] as const).map((d) => (
                <Field key={d} id={`dim-${d}`} label={{ l: "Length (cm)", w: "Width (cm)", h: "Height (cm)" }[d]}>
                  <input id={`dim-${d}`} className="input" type="number" min={1} required value={dims[d]} onChange={(e) => set("package", { ...req.package, dimensions: { ...dims, [d]: +e.target.value } })} />
                </Field>
              ))}
              <Field id="commodity" label="Commodity type">
                <select id="commodity" className="select" value={commodity} onChange={(e) => setCommodity(e.target.value)}>
                  {COMMODITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>

          {tips.length > 0 && (
            <div className="stack" aria-live="polite">
              {tips.map((t) => (
                <div key={t} className="ai-tip"><Sparkles size={18} className="ai-icon" aria-hidden /><div><strong>AI Suggestion:</strong> {t}</div></div>
              ))}
            </div>
          )}

          <fieldset className="fieldset">
            <legend>Service levels</legend>
            <div className="row wrap" style={{ gap: 20 }}>
              {(["express", "standard", "economy"] as ServiceLevel[]).map((s) => (
                <label key={s} className="check" style={{ textTransform: "capitalize" }}>
                  <input type="checkbox" checked={req.service_type.includes(s)} onChange={() => toggleService(s)} /> {s}
                </label>
              ))}
              <label className="check"><input type="checkbox" checked={req.ai_optimize} onChange={(e) => set("ai_optimize", e.target.checked)} /> AI price optimization</label>
            </div>
          </fieldset>

          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPrefs(!showPrefs)} aria-expanded={showPrefs} aria-controls="prefs">
              <Settings2 size={15} aria-hidden /> {showPrefs ? "Hide" : "Adjust"} AI ranking priorities
            </button>
            {showPrefs && (
              <div id="prefs" className="card-tint card-pad stack" style={{ gap: 12, marginTop: 10, borderRadius: 10 }}>
                <div className="row wrap" style={{ gap: 6 }}>
                  {PRESETS.map((p) => <button type="button" key={p.label} className="btn btn-sm" onClick={() => set("preferences", p.prefs)} aria-pressed={JSON.stringify(p.prefs) === JSON.stringify(req.preferences)}>{p.label}</button>)}
                </div>
                {(Object.keys(req.preferences) as (keyof Preferences)[]).map((k) => (
                  <div key={k} className="slider-row">
                    <label htmlFor={`pref-${k}`} className="small" style={{ textTransform: "capitalize" }}>{k}</label>
                    <input id={`pref-${k}`} type="range" min={0} max={100} value={req.preferences[k]} onChange={(e) => set("preferences", { ...req.preferences, [k]: +e.target.value })} />
                    <span className="small num faint">{req.preferences[k]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="row-between">
            <button type="button" className="btn" onClick={() => setStep(0)}><ArrowLeft size={16} aria-hidden /> Back</button>
            <button className="btn btn-primary" disabled={loading || !req.service_type.length}>
              {loading ? <Loader2 size={16} className="spin" aria-hidden /> : <Sparkles size={16} aria-hidden />} Get AI Quotes
            </button>
          </div>
        </form>
      )}

      {step === 2 && quote && (
        <section className="card" aria-labelledby="q-h">
          <div className="card-head">
            <div>
              <h2 id="q-h">AI Quote Comparison</h2>
              <div className="caption" style={{ marginTop: 2 }}>
                {req.origin.city}, {req.origin.country} → {req.destination.city}, {req.destination.country} · chargeable weight {quote.chargeable_weight_kg} kg · {quote.options.length} options
              </div>
            </div>
            <span className={`badge ${quote.source === "ai-engine" ? "b-success" : "b-warning"}`}>
              {quote.source === "ai-engine" ? "Live AI engine" : "Mock AI (engine offline)"}
            </span>
          </div>
          {quote.options.length ? (
            <QuoteTable options={quote.options} onBook={(o) => { setSelected(o); setStep(3); }} />
          ) : <div className="empty">No carriers offer these service levels on this lane.</div>}
          <div className="card-pad row-between" style={{ borderTop: "1px solid var(--border)" }}>
            <button className="btn" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden /> Edit package</button>
            <span className="caption">Prices in CAD. Scores combine cost, speed, carbon and reliability.</span>
          </div>
        </section>
      )}

      {step === 3 && selected && quote && (
        <section className="card" aria-labelledby="r-h">
          <div className="card-head"><h2 id="r-h">Review &amp; book</h2><span className="badge b-accent plain">Rank #{selected.rank} of {quote.options.length}</span></div>
          <div className="info-grid">
            <Info label="Carrier" value={selected.carrier_name} sub={selected.service_name ?? selected.service} />
            <Info label="Price" value={cad(selected.price_usd)} sub="CAD, taxes included" />
            <Info label="AI predicted ETA" value={date(selected.risk.eta.latest)} sub={days(Math.round(selected.transit_days))} />
            <Info label="AI risk score" value={<RiskBadge level={selected.risk.level} score={selected.risk.score} />} sub={`CO₂e ${kg(selected.co2_kg)}`} />
          </div>
          <div className="card-pad stack" style={{ gap: 12, borderTop: "1px solid var(--border)" }}>
            {selected.route && <RouteLegs legs={selected.route.legs} />}
            <div className="small muted">
              {street.origin && `${street.origin}, `}{req.origin.city}, {req.origin.country} → {street.destination && `${street.destination}, `}{req.destination.city}, {req.destination.country}
              {" · "}{req.package.weight_kg} kg · {dims.l}×{dims.w}×{dims.h} cm · {commodity}
            </div>
          </div>
          <div className="card-pad row-between" style={{ borderTop: "1px solid var(--border)" }}>
            <button className="btn" onClick={() => setStep(2)}><ArrowLeft size={16} aria-hidden /> Back to quotes</button>
            <button className="btn btn-primary" onClick={confirm}>Confirm &amp; book</button>
          </div>
        </section>
      )}
    </>
  );
}

function AddressBlock({ legend, loc, street, onLoc, onStreet, idp }: {
  legend: string; loc: Location; street: string; idp: string;
  onLoc: (l: Location) => void; onStreet: (v: string) => void;
}) {
  return (
    <fieldset className="fieldset">
      <legend>{legend}</legend>
      <div className="form-grid">
        <Field id={`${idp}-country`} label="Country">
          <select id={`${idp}-country`} className="select" value={loc.country} onChange={(e) => onLoc({ ...loc, country: e.target.value })}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </Field>
        <Field id={`${idp}-city`} label="City / Postal Code">
          <input id={`${idp}-city`} className="input" required value={[loc.city, loc.postalCode].filter(Boolean).join(" ")}
            onChange={(e) => {
              const v = e.target.value;
              const m = v.match(/^(.*?)(?:\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d))?$/i);
              onLoc({ ...loc, city: m?.[1] ?? v, postalCode: m?.[2] });
            }} />
        </Field>
        <div className="span-2">
          <Field id={`${idp}-street`} label="Street Address">
            <input id={`${idp}-street`} className="input" value={street} onChange={(e) => onStreet(e.target.value)} autoComplete="street-address" />
          </Field>
        </div>
      </div>
    </fieldset>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}</div>;
}
