import { Button, Card, Empty, Spin, Table, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { listQuotes } from "../data/api";
import { useStore } from "../data/store";
import type { Quote } from "../data/types";
import { dateTime, place } from "../lib/format";
import { cad } from "../lib/money";

export function QuotesPage() {
  const { quotes: localQuotes } = useStore();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>(localQuotes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listQuotes();
        if (!cancelled) setQuotes(list);
      } catch {
        if (!cancelled) {
          setQuotes(localQuotes);
          message.warning("API unavailable — showing local quotes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localQuotes]);

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle="Quotes are valid for 24 hours."
        extra={
          <Button type="primary" onClick={() => navigate("/shipments/new")}>
            New quote
          </Button>
        }
      />
      <Card size="small">
        <Spin spinning={loading}>
          <Table<Quote>
            rowKey="id"
            size="small"
            dataSource={quotes}
            locale={{ emptyText: <Empty description="No quotes yet" /> }}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            scroll={{ x: 800 }}
            columns={[
              {
                title: "Requested",
                dataIndex: "createdAt",
                render: (v: string, q) => <Link to={`/quotes/${q.id}`}>{dateTime(v)}</Link>,
              },
              {
                title: "Lane",
                key: "lane",
                render: (_, q) => `${place(q.request.origin)} → ${place(q.request.destination)}`,
              },
              {
                title: "Weight (kg)",
                key: "w",
                align: "right",
                render: (_, q) => q.request.package.weight_kg,
              },
              {
                title: "Options",
                key: "n",
                align: "right",
                render: (_, q) => q.options.length,
              },
              {
                title: "Top option",
                key: "best",
                render: (_, q) =>
                  q.options[0]
                    ? `${q.options[0].carrier_name} · ${q.options[0].service_name ?? q.options[0].service}`
                    : "–",
              },
              {
                title: "Lowest price (CAD)",
                key: "min",
                align: "right",
                render: (_, q) =>
                  q.options.length ? cad(Math.min(...q.options.map((o) => o.price_usd))) : "–",
              },
            ]}
          />
        </Spin>
      </Card>
    </>
  );
}