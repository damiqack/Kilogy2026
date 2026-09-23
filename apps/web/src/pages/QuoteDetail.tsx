import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QuoteTable } from "../components/QuoteTable";
import { useStore } from "../data/store";
import { dateTime, place } from "../lib/format";

export function QuoteDetail() {
  const { id } = useParams();
  const { quotes, book } = useStore();
  const navigate = useNavigate();
  const q = quotes.find((x) => x.id === id);
  if (!q) return <div className="card empty">Quote not found. <Link to="/quotes">Back to quotes</Link></div>;
  return (
    <>
      <Link to="/quotes" className="small row" style={{ gap: 6 }}><ArrowLeft size={15} aria-hidden /> All quotes</Link>
      <div className="page-head">
        <div>
          <h1>AI Quote Comparison</h1>
          <p className="sub">{place(q.request.origin)} → {place(q.request.destination)} · {q.request.package.weight_kg} kg · requested {dateTime(q.createdAt)}</p>
        </div>
      </div>
      <section className="card">
        <QuoteTable options={q.options} onBook={(o) => navigate(`/shipments/${book(q, o).id}`)} />
      </section>
    </>
  );
}
