import { Card, Result, Spin } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { QuoteTable } from "../components/QuoteTable";
import { getQuote } from "../data/api";
import { useStore } from "../data/store";
import type { Quote } from "../data/types";
import { dateTime, place } from "../lib/format";

export function QuoteDetailPage() {
  const { id } = useParams();
  const { quotes, book } = useStore();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(quotes.find((x) => x.id === id) ?? null);
  const [loading, setLoading] = useState(!quote);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id || quote) return;
    let cancelled = false;
    (async () => {
      try {
        const q = await getQuote(id);
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, quote]);

  if (loading) return <Spin style={{ display: "block", margin: "48px auto" }} />;
  if (error || !quote) {
    return <Result status="404" title="Quote not found" extra={<Link to="/quotes">Back to quotes</Link>} />;
  }

  return (
    <>
      <PageHeader
        title="Quote comparison"
        subtitle={`${place(quote.request.origin)} → ${place(quote.request.destination)} · ${quote.request.package.weight_kg} kg · ${dateTime(quote.createdAt)}`}
        crumbs={[{ title: "Quotes", path: "/quotes" }]}
      />
      <Card size="small">
        <QuoteTable
          options={quote.options}
          onBook={(o) => navigate(`/shipments/${book(quote, o).id}`)}
        />
      </Card>
    </>
  );
}