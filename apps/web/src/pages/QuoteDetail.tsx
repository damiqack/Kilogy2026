import { Card, Result } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { QuoteTable } from "../components/QuoteTable";
import { useStore } from "../data/store";
import { dateTime, place } from "../lib/format";

export function QuoteDetailPage() {
  const { id } = useParams();
  const { quotes, book } = useStore();
  const navigate = useNavigate();
  const q = quotes.find((x) => x.id === id);
  if (!q) return <Result status="404" title="Quote not found" extra={<Link to="/quotes">Back to quotes</Link>} />;
  return (
    <>
      <PageHeader
        title="Quote comparison"
        subtitle={`${place(q.request.origin)} → ${place(q.request.destination)} · ${q.request.package.weight_kg} kg · ${dateTime(q.createdAt)}`}
        crumbs={[{ title: "Quotes", path: "/quotes" }]}
      />
      <Card size="small"><QuoteTable options={q.options} onBook={(o) => navigate(`/shipments/${book(q, o).id}`)} /></Card>
    </>
  );
}
