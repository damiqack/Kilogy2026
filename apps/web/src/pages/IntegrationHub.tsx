import { ApiOutlined, CheckOutlined, ExportOutlined, MinusOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Modal, Segmented, Select, Table, Tag, Tooltip } from "antd";
import { useState } from "react";
import { FilterBar, NoMatches } from "../components/FilterBar";
import { Indicator, type Tone } from "../components/Indicator";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import {
  ACCESS_LABEL, CAPABILITIES, CAPABILITY_HINT, CAPABILITY_LABEL, CATEGORIES, CATEGORY_LABEL, PHASES, PROVIDERS,
  type Access, type Capability, type Category, type Provider,
} from "../config/integrations";
import { useUrlFilters } from "../lib/useUrlFilters";
import "./integrations.css";

const KEYS = ["view", "cat", "phase", "cap", "access", "q"] as const;
const VIEWS = [
  { value: "providers", label: "Providers" },
  { value: "capabilities", label: "Capabilities" },
  { value: "roadmap", label: "Roadmap" },
];
const ACCESS_TONE: Record<Access, Tone> = {
  self_serve: "success", account_required: "info", agreement_required: "warning", license_required: "warning", unconfirmed: "error",
};
const READY: Access[] = ["self_serve", "account_required"];

/** The KILOGY API Integration Hub: every provider, what it can do, how to get access, and when it is planned. */
export function IntegrationHubPage() {
  const f = useUrlFilters(KEYS);
  const [adding, setAdding] = useState(false);
  const view = VIEWS.some((v) => v.value === f.get("view")) ? f.get("view") : "providers";
  const cat = CATEGORIES.includes(f.get("cat") as Category) ? (f.get("cat") as Category) : "all";
  const phases = f.getList("phase").map(Number);
  const caps = f.getList("cap") as Capability[];
  const access = f.getList("access") as Access[];
  const q = f.get("q").trim().toLowerCase();

  // Every filter except category, so the category tabs can show their counts.
  const base = PROVIDERS.filter((p) =>
    (!q || `${p.name} ${CATEGORY_LABEL[p.category]} ${p.modes.join(" ")}`.toLowerCase().includes(q))
    && (!phases.length || phases.includes(p.phase))
    && caps.every((c) => p.capabilities.includes(c))
    && (!access.length || access.includes(p.access)));
  const rows = base.filter((p) => cat === "all" || p.category === cat);
  const filterCount = f.activeCount - (f.get("view") ? 1 : 0);
  const clear = () => f.setMany({ cat: null, phase: null, cap: null, access: null, q: null });
  const ready = PROVIDERS.filter((p) => READY.includes(p.access)).length;

  return (
    <>
      <PageHeader
        title="Integration Hub"
        subtitle="Every carrier, forwarder and logistics platform KILOGY connects to, through one API."
        extra={<Button icon={<PlusOutlined />} onClick={() => setAdding(true)}>Add a provider</Button>}
      />

      <ul className="khub-stats" aria-label="Integration summary">
        <li><b>{PROVIDERS.length}</b><span>providers in the hub</span></li>
        <li><b>{ready}</b><span>ready to build with a developer or shipping account</span></li>
        <li><b>{PROVIDERS.length - ready}</b><span>need an agreement, licence or confirmation</span></li>
        <li><b>0 live</b><span>all {PROVIDERS.length} answer from sandbox until credentials are added</span></li>
      </ul>

      <Segmented className="khub-views" aria-label="View" value={view} options={VIEWS} onChange={(v) => f.set("view", v === "providers" ? null : String(v))} />

      {view !== "roadmap" && (
        <Card size="small">
          <FilterBar shown={rows.length} total={PROVIDERS.length} noun="providers" onClear={clear} canClear={filterCount > 0}>
            <Segmented
              aria-label="Provider category"
              value={cat}
              onChange={(v) => f.set("cat", v === "all" ? null : String(v))}
              options={[
                { value: "all", label: `All (${base.length})` },
                ...CATEGORIES.map((c) => ({ value: c, label: `${CATEGORY_LABEL[c]} (${base.filter((p) => p.category === c).length})` })),
              ]}
            />
            <Input className="kfilters-search" allowClear prefix={<SearchOutlined />} placeholder="Provider, category or mode"
              aria-label="Filter providers by text" value={f.get("q")} onChange={(e) => f.set("q", e.target.value)} />
            <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Filter by capability" placeholder="Any capability"
              options={CAPABILITIES.map((c) => ({ value: c, label: CAPABILITY_LABEL[c] }))} value={caps} onChange={(v) => f.set("cap", v)} />
            <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Filter by access" placeholder="Any access"
              options={(Object.keys(ACCESS_LABEL) as Access[]).map((a) => ({ value: a, label: ACCESS_LABEL[a] }))} value={access} onChange={(v) => f.set("access", v)} />
            <Select mode="multiple" allowClear aria-label="Filter by roadmap phase" placeholder="Any phase"
              options={PHASES.map((p) => ({ value: String(p.phase), label: `Phase ${p.phase}: ${p.name}` }))} value={phases.map(String)} onChange={(v) => f.set("phase", v)} />
          </FilterBar>
          {view === "providers" ? <ProviderTable rows={rows} onClear={clear} /> : <CapabilityMatrix rows={rows} onClear={clear} />}
        </Card>
      )}

      {view === "roadmap" && <Roadmap />}

      <Modal open={adding} onCancel={() => setAdding(false)} title="Add a provider" footer={<Button type="primary" onClick={() => setAdding(false)}>Done</Button>} width={640}>
        <p>New partners plug into the hub without changes to the core platform. A developer:</p>
        <ol className="khub-steps">
          <li>
            Creates one connector file in <code>services/api/src/hub/providers/</code> with <code>defineProvider()</code>: the provider's
            manifest (modes, regions, capabilities, credentials) and its API mapping.
          </li>
          <li>Adds it to the list in <code>providers/index.ts</code> and to this page's catalogue in <code>config/integrations.ts</code>.</li>
          <li>Sets its credentials as environment variables, runs the connector tests against the provider's sandbox, then switches it to live.</li>
        </ol>
        <pre className="khub-code">{`export default defineProvider({
  manifest: {
    id: "acme", name: "Acme Freight", category: "forwarding",
    modes: ["air"], regions: ["*"], phase: 3,
    capabilities: ["rates", "tracking"],
    access: "self_serve", credentials: ["HUB_ACME_API_KEY"],
  },
  refPrefix: "ACME",
  sandbox: { services: [/* priced services */] },
  live: (env) => ({ /* getRates, track: real API calls */ }),
});`}</pre>
        <p className="ktiny">Until its credentials are set, a new provider answers from sandbox data so the dashboards can be tested end to end.</p>
      </Modal>
    </>
  );
}

function ProviderTable({ rows, onClear }: { rows: Provider[]; onClear: () => void }) {
  return (
    <Table<Provider>
      rowKey="id"
      size="small"
      dataSource={rows}
      pagination={false}
      scroll={{ x: 960 }}
      locale={{ emptyText: <NoMatches noun="providers" onClear={onClear} /> }}
      expandable={{ expandedRowRender: (p) => <ProviderDetail p={p} />, expandRowByClick: false }}
      columns={[
        {
          title: "Provider", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name),
          render: (_: string, p) => <div className="khub-name"><strong>{p.name}</strong><span>{CATEGORY_LABEL[p.category]}{p.dcsa ? " · DCSA" : ""}</span></div>,
        },
        { title: "Modes", dataIndex: "modes", render: (v: string[]) => v.map((m) => (m === "parcel" ? "Parcel" : modeLabel(m))).join(", ") },
        {
          title: "Capabilities", dataIndex: "capabilities", sorter: (a, b) => a.capabilities.length - b.capabilities.length,
          render: (v: Capability[]) => <span className="khub-caps">{v.map((c) => <Tag key={c}>{CAPABILITY_LABEL[c]}</Tag>)}</span>,
        },
        { title: "Access", dataIndex: "access", render: (v: Access) => <Indicator tone={ACCESS_TONE[v]}>{ACCESS_LABEL[v]}</Indicator> },
        { title: "Sandbox", dataIndex: "sandbox" },
        { title: "Phase", dataIndex: "phase", defaultSortOrder: "ascend", sorter: (a, b) => a.phase - b.phase || a.name.localeCompare(b.name), render: (v: number) => `Phase ${v}` },
        { title: "Connection", key: "conn", render: () => <Indicator tone="neutral">Sandbox</Indicator> },
      ]}
    />
  );
}

function ProviderDetail({ p }: { p: Provider }) {
  return (
    <dl className="khub-detail">
      <div><dt>How to get access</dt><dd>{p.accessNote}</dd></div>
      <div><dt>Cost to use the API</dt><dd>{p.cost}</dd></div>
      <div><dt>Next step</dt><dd>{p.nextStep}</dd></div>
      <div>
        <dt>Credentials to go live</dt>
        <dd className="khub-env">{p.credentials.map((c) => <code key={c}>{c}</code>)}</dd>
      </div>
      {p.docsUrl && (
        <div>
          <dt>Documentation</dt>
          <dd><a href={p.docsUrl} target="_blank" rel="noreferrer">{p.docsUrl.replace(/^https:\/\//, "")} <ExportOutlined aria-label="opens in a new tab" /></a></dd>
        </div>
      )}
    </dl>
  );
}

function CapabilityMatrix({ rows, onClear }: { rows: Provider[]; onClear: () => void }) {
  return (
    <Table<Provider>
      rowKey="id"
      size="small"
      className="khub-matrix"
      dataSource={rows}
      pagination={false}
      scroll={{ x: 1000 }}
      locale={{ emptyText: <NoMatches noun="providers" onClear={onClear} /> }}
      columns={[
        { title: "Provider", dataIndex: "name", fixed: "left", width: 190, render: (v: string) => <strong>{v}</strong> },
        ...CAPABILITIES.map((c) => ({
          title: <Tooltip title={CAPABILITY_HINT[c]}><span>{CAPABILITY_LABEL[c]}</span></Tooltip>,
          key: c,
          align: "center" as const,
          render: (_: unknown, p: Provider) => (p.capabilities.includes(c)
            ? <CheckOutlined className="khub-yes" aria-label={`${p.name} supports ${CAPABILITY_LABEL[c].toLowerCase()}`} />
            : <MinusOutlined className="khub-no" aria-label={`${p.name} does not support ${CAPABILITY_LABEL[c].toLowerCase()}`} />),
        })),
      ]}
      summary={(data) => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}><strong>Providers</strong></Table.Summary.Cell>
          {CAPABILITIES.map((c, i) => (
            <Table.Summary.Cell key={c} index={i + 1} align="center">{data.filter((p) => p.capabilities.includes(c)).length}</Table.Summary.Cell>
          ))}
        </Table.Summary.Row>
      )}
    />
  );
}

function Roadmap() {
  return (
    <div className="khub-road">
      <Card size="small" className="khub-phase is-done">
        <div className="khub-phase-head"><ApiOutlined /><div><b>Hub core</b><span>Built in the prototype</span></div></div>
        <p>Connector contract, provider registry, normalized rates and tracking events, webhook receiver and this page.</p>
        <p className="khub-outcome">All {PROVIDERS.length} providers answer in sandbox mode.</p>
      </Card>
      {PHASES.map((ph) => {
        const list = PROVIDERS.filter((p) => p.phase === ph.phase);
        return (
          <Card size="small" key={ph.phase} className="khub-phase">
            <div className="khub-phase-head"><span className="khub-num">{ph.phase}</span><div><b>Phase {ph.phase}</b><span>{ph.name}</span></div></div>
            <p className="khub-gate"><b>Starts when:</b> {ph.gate}</p>
            <ul className="khub-plist">
              {list.map((p) => <li key={p.id}><span>{p.name}</span><Indicator tone={ACCESS_TONE[p.access]}>{ACCESS_LABEL[p.access]}</Indicator></li>)}
            </ul>
            <p className="khub-outcome">{ph.outcome}</p>
          </Card>
        );
      })}
    </div>
  );
}
