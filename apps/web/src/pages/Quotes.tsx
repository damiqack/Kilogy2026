import { ArrowRight, Receipt, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AiScore } from "../components/ScoreBars";
import { useStore } from "../data/store";
import { dateTime, place } from "../lib/format";
import { cad } from "../lib/money";

export function Quotes() {
  const { quotes } = useStore();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Quotes</h1>
          <p className="sub">Get rates from every integrated carrier and compare them with AI scoring.</p>
        </div>
        <Link to="/shipments/new" className="btn btn-primary"><Sparkles size={17} aria-hidden /> Get AI Quotes</Link>
      </div>
      <section className="card">
        <div className="card-head"><h2>Recent quote requests</h2><span className="caption">Quotes are valid for 24 hours</span></div>
        {quotes.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Requested</th><th scope="col">Lane</th><th scope="col">Package</th><th scope="col">Best option</th><th scope="col" className="right">From (CAD)</th><th scope="col">Top AI score</th><th scope="col" /></tr></thead>
              <tbody>
                {quotes.map((q) => {
                  const best = q.options[0];
                  const cheapest = Math.min(...q.options.map((o) => o.price_usd));
                  return (
                    <tr key={q.id}>
                      <td className="num">{dateTime(q.createdAt)}</td>
                      <td>{place(q.request.origin)} → {place(q.request.destination)}</td>
                      <td className="num">{q.request.package.weight_kg} kg</td>
                      <td>{best ? `${best.carrier_name} · ${best.service_name ?? best.service}` : "—"}</td>
                      <td className="num right">{q.options.length ? cad(cheapest) : "—"}</td>
                      <td>{best && <AiScore value={best.ai_score} />}</td>
                      <td className="right"><Link to={`/quotes/${q.id}`} className="row small" style={{ justifyContent: "flex-end" }}>Compare <ArrowRight size={14} aria-hidden /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty stack" style={{ alignItems: "center" }}>
            <Receipt size={32} aria-hidden />
            <span>No quotes yet. Start one and the AI engine will rank every carrier for you.</span>
            <Link to="/shipments/new" className="btn btn-primary">Get AI Quotes</Link>
          </div>
        )}
      </section>
    </>
  );
}
