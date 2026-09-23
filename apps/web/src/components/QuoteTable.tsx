import { ChevronDown, ChevronRight, Leaf, Star } from "lucide-react";
import { Fragment, useState } from "react";
import type { RankedOption } from "../data/types";
import { date, days, kg } from "../lib/format";
import { cad } from "../lib/money";
import { RiskBadge, Tag } from "./Badges";
import { RouteLegs } from "./RouteLegs";
import { AiScore, ScoreBars } from "./ScoreBars";

/** AI Quote Comparison table (spec 3.3). Rows expand to show the score breakdown. */
export function QuoteTable({ options, onBook, busyId }: { options: RankedOption[]; onBook?: (o: RankedOption) => void; busyId?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const key = (o: RankedOption) => `${o.carrier_id}-${o.service}`;

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Carrier quotes ranked by AI score</caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: 36 }}><span className="sr-only">Details</span></th>
            <th scope="col">Carrier</th>
            <th scope="col">Service</th>
            <th scope="col" className="right">Price (CAD)</th>
            <th scope="col">ETA</th>
            <th scope="col" className="hide-sm">CO₂e</th>
            <th scope="col">AI Score</th>
            <th scope="col" className="right">Action</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o) => {
            const k = key(o);
            const isOpen = open === k;
            return (
              <Fragment key={k}>
                <tr className={o.rank === 1 ? "best-row" : undefined}>
                  <td>
                    <button className="expand-btn" onClick={() => setOpen(isOpen ? null : k)} aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} details for ${o.carrier_name}`}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {o.rank === 1 && <Star size={15} className="star" fill="currentColor" aria-label="Top pick" />}
                      <span className="strong">{o.carrier_name}</span>
                    </div>
                    {!!o.tags?.length && <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>{o.tags.map((t) => <Tag key={t} tag={t} />)}</div>}
                  </td>
                  <td>{o.service_name ?? o.service}</td>
                  <td className="right num strong">{cad(o.price_usd)}</td>
                  <td className="num">{days(Math.round(o.transit_days))}</td>
                  <td className="num hide-sm"><span className="row" style={{ gap: 4 }}><Leaf size={13} color="var(--success)" aria-hidden /> {kg(o.co2_kg)}</span></td>
                  <td><AiScore value={o.ai_score} /></td>
                  <td className="right">
                    {onBook && (
                      <button className="btn btn-primary btn-sm" onClick={() => onBook(o)} disabled={busyId === k} aria-label={`Book ${o.carrier_name} ${o.service_name ?? o.service}`}>
                        BOOK
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="quote-detail">
                    <td />
                    <td colSpan={7}>
                      <div className="grid g-2" style={{ gap: 20, padding: "4px 0" }}>
                        <div className="stack" style={{ gap: 10 }}>
                          <span className="label">Why this score</span>
                          <ScoreBars scores={o.ai_scores} />
                        </div>
                        <div className="stack" style={{ gap: 10 }}>
                          <span className="label">Route</span>
                          {o.route && <RouteLegs legs={o.route.legs} />}
                          <div className="row wrap small muted" style={{ gap: 12 }}>
                            <span>AI ETA {date(o.risk.eta.earliest)} – {date(o.risk.eta.latest)}</span>
                            <RiskBadge level={o.risk.level} score={o.risk.score} />
                            <span>Carrier cost {cad(o.pricing.carrier_cost_usd)} · margin {o.pricing.margin_pct}%</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
