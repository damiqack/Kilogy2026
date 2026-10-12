import { Alert, Button, Card, Checkbox, Col, Collapse, Descriptions, Flex, Form, Input, InputNumber, Row, Segmented, Select, Slider, Steps, Switch, Typography } from "antd";
import { ToneTag } from "../components/ToneTag";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { QuoteTable } from "../components/QuoteTable";
import { RouteText } from "../components/RouteText";
import { RiskTag } from "../components/StatusTag";
import { COMMODITIES, COUNTRIES } from "../config/reference";
import { inlineSuggestions, requestQuote } from "../data/ai";
import { useStore } from "../data/store";
import type { Location, Preferences, Quote, QuoteRequest, RankedOption, ServiceLevel } from "../data/types";
import { date, kg } from "../lib/format";
import { cad } from "../lib/money";

const PRESETS: Record<string, Preferences> = {
  Balanced: { cost: 35, speed: 30, carbon: 20, reliability: 15 },
  "Lowest cost": { cost: 80, speed: 5, carbon: 5, reliability: 10 },
  Fastest: { cost: 5, speed: 80, carbon: 0, reliability: 15 },
  "Lowest CO₂": { cost: 15, speed: 5, carbon: 70, reliability: 10 },
};

function parseLoc(v: string | null, fallback: Location): Location {
  if (!v) return fallback;
  const [country, city] = v.split(":");
  return { country, city };
}

export function NewShipmentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { saveQuote, book } = useStore();
  const [step, setStep] = useState(0);
  const [req, setReq] = useState<QuoteRequest>(() => ({
    origin: parseLoc(params.get("from"), { country: "CA", city: "Montreal", postalCode: "H3A1A1" }),
    destination: parseLoc(params.get("to"), { country: "NG", city: "Lagos" }),
    package: { weight_kg: 10, dimensions: { l: 30, w: 20, h: 15 } },
    service_type: ["express", "standard"],
    ai_optimize: true,
    preferences: PRESETS.Balanced,
  }));
  const [street, setStreet] = useState({ origin: "845 Sherbrooke St W", destination: "" });
  const [commodity, setCommodity] = useState(COMMODITIES[1]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selected, setSelected] = useState<RankedOption | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof QuoteRequest>(k: K, v: QuoteRequest[K]) => setReq((r) => ({ ...r, [k]: v }));
  const notes = useMemo(() => inlineSuggestions(req), [req]);
  const dims = req.package.dimensions!;
  const preset = Object.entries(PRESETS).find(([, p]) => JSON.stringify(p) === JSON.stringify(req.preferences))?.[0];

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

  const address = (side: "origin" | "destination") => {
    const loc = req[side];
    return (
      <Card size="small" title={side === "origin" ? "Ship from" : "Ship to"}>
        <Row gutter={12}>
          <Col xs={24} md={10}>
            <Form.Item label="Country" required htmlFor={`${side}-country`}>
              <Select id={`${side}-country`} showSearch optionFilterProp="label" value={loc.country} options={COUNTRIES.map(([v, label]) => ({ value: v, label }))} onChange={(v) => set(side, { ...loc, country: v })} />
            </Form.Item>
          </Col>
          <Col xs={12} md={7}>
            <Form.Item label="City" required htmlFor={`${side}-city`}>
              <Input id={`${side}-city`} value={loc.city} onChange={(e) => set(side, { ...loc, city: e.target.value })} />
            </Form.Item>
          </Col>
          <Col xs={12} md={7}>
            <Form.Item label="Postal code" htmlFor={`${side}-postal`}>
              <Input id={`${side}-postal`} value={loc.postalCode} onChange={(e) => set(side, { ...loc, postalCode: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Street address" style={{ marginBottom: 0 }} htmlFor={`${side}-street`}>
              <Input id={`${side}-street`} value={street[side]} onChange={(e) => setStreet({ ...street, [side]: e.target.value })} autoComplete="street-address" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="New shipment" crumbs={[{ title: "Shipments", path: "/shipments" }]} />
      <Steps current={step} size="small" style={{ marginBottom: 16 }}
        items={[{ title: "Addresses" }, { title: "Package" }, { title: "Compare quotes" }, { title: "Review and book" }]} />

      <Form layout="vertical" requiredMark="optional" component="div">
        {step === 0 && (
          <Flex vertical gap={16}>
            <Row gutter={16}>
              <Col xs={24} lg={12}>{address("origin")}</Col>
              <Col xs={24} lg={12}>{address("destination")}</Col>
            </Row>
            <Flex justify="flex-end">
              <Button type="primary" disabled={!req.origin.city || !req.destination.city} onClick={() => setStep(1)}>Continue</Button>
            </Flex>
          </Flex>
        )}

        {step === 1 && (
          <Card size="small">
            <Row gutter={12}>
              <Col xs={12} md={4}><Form.Item label="Weight (kg)" required htmlFor="pkg-weight"><InputNumber id="pkg-weight" min={0.1} step={0.5} value={req.package.weight_kg} onChange={(v) => set("package", { ...req.package, weight_kg: v ?? 0 })} style={{ width: "100%" }} /></Form.Item></Col>
              {(["l", "w", "h"] as const).map((d) => (
                <Col xs={12} md={4} key={d}>
                  <Form.Item label={{ l: "Length (cm)", w: "Width (cm)", h: "Height (cm)" }[d]} required htmlFor={`pkg-${d}`}>
                    <InputNumber id={`pkg-${d}`} min={1} value={dims[d]} onChange={(v) => set("package", { ...req.package, dimensions: { ...dims, [d]: v ?? 1 } })} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              ))}
              <Col xs={24} md={8}><Form.Item label="Commodity" htmlFor="pkg-commodity"><Select id="pkg-commodity" value={commodity} options={COMMODITIES.map((c) => ({ value: c, label: c }))} onChange={setCommodity} /></Form.Item></Col>
              <Col xs={24} md={12}>
                <Form.Item label="Service levels" required>
                  <Checkbox.Group value={req.service_type} onChange={(v) => set("service_type", v as ServiceLevel[])}
                    options={[{ label: "Express", value: "express" }, { label: "Standard", value: "standard" }, { label: "Economy", value: "economy" }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Price optimization">
                  <Switch aria-label="Price optimization" checked={req.ai_optimize} onChange={(v) => set("ai_optimize", v)} />
                </Form.Item>
              </Col>
            </Row>

            {notes.map((n) => <Alert key={n} type="info" showIcon title={n} style={{ marginBottom: 8 }} />)}

            <Collapse size="small" style={{ margin: "8px 0 16px" }} items={[{
              key: "w",
              label: `Ranking weights${preset ? `: ${preset}` : ": Custom"}`,
              children: (
                <>
                  <Segmented options={Object.keys(PRESETS)} value={preset} onChange={(v) => set("preferences", PRESETS[String(v)])} style={{ marginBottom: 12 }} />
                  {(Object.keys(req.preferences) as (keyof Preferences)[]).map((k) => (
                    <Row key={k} align="middle" gutter={12}>
                      <Col flex="100px" style={{ textTransform: "capitalize" }}>{k}</Col>
                      <Col flex="auto"><Slider aria-label={`${k} weight`} min={0} max={100} value={req.preferences[k]} onChange={(v) => set("preferences", { ...req.preferences, [k]: v })} /></Col>
                      <Col flex="40px">{req.preferences[k]}</Col>
                    </Row>
                  ))}
                </>
              ),
            }]} />

            <Flex justify="space-between">
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button type="primary" loading={loading} disabled={!req.service_type.length} onClick={getQuotes}>Get quotes</Button>
            </Flex>
          </Card>
        )}
      </Form>

      {step === 2 && quote && (
        <Card
          size="small"
          title={`${quote.options.length} options · ${req.origin.city}, ${req.origin.country} → ${req.destination.city}, ${req.destination.country}`}
          extra={<ToneTag tone={quote.source === "ai-engine" ? "success" : "neutral"}>{quote.source === "ai-engine" ? "Routing engine" : "Sample rates"}</ToneTag>}
        >
          <QuoteTable options={quote.options} onBook={(o) => { setSelected(o); setStep(3); }} />
          <Flex justify="space-between" style={{ marginTop: 12 }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chargeable weight {quote.chargeable_weight_kg} kg. Prices in CAD.</Typography.Text>
          </Flex>
        </Card>
      )}

      {step === 3 && selected && (
        <Card size="small" title="Review">
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}
            items={[
              { key: "c", label: "Carrier", children: `${selected.carrier_name} · ${selected.service_name ?? selected.service}` },
              { key: "p", label: "Price", children: cad(selected.price_usd) },
              { key: "f", label: "From", children: [street.origin, req.origin.city, req.origin.country].filter(Boolean).join(", ") },
              { key: "t", label: "To", children: [street.destination, req.destination.city, req.destination.country].filter(Boolean).join(", ") },
              { key: "pk", label: "Package", children: `${req.package.weight_kg} kg · ${dims.l}×${dims.w}×${dims.h} cm · ${commodity}` },
              { key: "e", label: "Predicted delivery", children: `${date(selected.risk.eta.earliest)} – ${date(selected.risk.eta.latest)}` },
              { key: "r", label: "Delay risk", children: <RiskTag level={selected.risk.level} score={selected.risk.score} /> },
              { key: "co2", label: "Emissions", children: kg(selected.co2_kg) },
              { key: "route", label: "Route", span: "filled", children: selected.route ? <RouteText legs={selected.route.legs} /> : "–" },
            ]}
          />
          <Flex justify="space-between" style={{ marginTop: 16 }}>
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button type="primary" onClick={confirm}>Confirm booking</Button>
          </Flex>
        </Card>
      )}
    </>
  );
}
