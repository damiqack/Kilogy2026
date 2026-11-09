import { ArrowDownOutlined, ArrowUpOutlined, DownloadOutlined, DownOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, FileWordOutlined, HistoryOutlined } from "@ant-design/icons";
import { App, Button, Card, Checkbox, DatePicker, Dropdown, Empty, Segmented, Select, Space, Table, Tooltip } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import logo from "../assets/brand/kilogy-logo.png";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { COUNTRIES } from "../config/reference";
import { useAuth } from "../data/auth";
import { useStore } from "../data/store";
import { buildReport, formatCell, periodFor, type ReportData } from "../lib/reports/build";
import { exportReport, FORMATS, type ExportFormat } from "../lib/reports/export";
import { ALL_CATEGORIES, CATEGORY_LABEL, type PeriodType, type ReportCategory, type ReportParams } from "../lib/reports/types";
import { useUrlFilters } from "../lib/useUrlFilters";
import "./reports.css";

const KEYS = ["type", "date", "from", "to", "cat", "carrier", "mode", "dest"] as const;
const TYPES: { value: PeriodType; label: string }[] = [
  { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }, { value: "custom", label: "Custom range" },
];
const FORMAT_ICON: Record<ExportFormat, React.ReactNode> = {
  pdf: <FilePdfOutlined />, xlsx: <FileExcelOutlined />, docx: <FileWordOutlined />, csv: <FileTextOutlined />, json: <FileTextOutlined />,
};
const COUNTRY = new Map(COUNTRIES);
const HISTORY_KEY = "kilogy.reportHistory";

interface HistoryItem { id: string; at: string; by: string; format: ExportFormat; periodLabel: string; params: ReportParams }

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

/** Admin reports at /reports: weekly, monthly, annual or custom reports, previewed on screen and downloadable in five formats. */
export function ReportsPage() {
  const { message } = App.useApp();
  const store = useStore();
  const { user, team, allHistory } = useAuth();
  const f = useUrlFilters(KEYS);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => readJson(HISTORY_KEY, []));

  const type = (TYPES.some((t) => t.value === f.get("type")) ? f.get("type") : "monthly") as PeriodType;
  const anchor = f.get("date") ? dayjs(f.get("date")) : dayjs();
  const customFrom = f.get("from") ? dayjs(f.get("from")) : dayjs().subtract(29, "day");
  const customTo = f.get("to") ? dayjs(f.get("to")) : dayjs();
  const period = type === "custom" ? periodFor("custom", customFrom, customTo) : periodFor(type, anchor);
  const categories = (f.getList("cat").length ? f.getList("cat") : ALL_CATEGORIES).filter((c): c is ReportCategory => ALL_CATEGORIES.includes(c as ReportCategory));

  const params: ReportParams = {
    periodType: type, from: period.from.format("YYYY-MM-DD"), to: period.to.format("YYYY-MM-DD"), categories,
    filters: { carriers: f.getList("carrier"), modes: f.getList("mode"), destinations: f.getList("dest") },
  };
  const data: ReportData = useMemo(() => ({
    shipments: store.shipments, payments: store.payments, paymentMethods: store.paymentMethods, quotes: store.quotes, documents: store.documents,
    team, signIns: allHistory, inquiries: readJson(`kilogy.inquiries`, []), generatedBy: user ? `${user.name} (${user.email})` : "Kilogy",
  }), [store, team, allHistory, user]);
  const report = useMemo(() => buildReport(data, params, period.label), [data, JSON.stringify(params), period.label]);

  const options = useMemo(() => ({
    carriers: [...new Set(store.shipments.map((s) => s.selected.carrier_name))].sort().map((v) => ({ value: v, label: v })),
    modes: [...new Set(store.shipments.map((s) => s.selected.route?.primary_mode ?? "air"))].map((v) => ({ value: v, label: modeLabel(v) })),
    dests: [...new Set(store.shipments.map((s) => s.destination.country))].sort().map((v) => ({ value: v, label: COUNTRY.get(v) ?? v })),
  }), [store.shipments]);

  async function download(format: ExportFormat, p: ReportParams = params, label = period.label) {
    setBusy(format);
    try {
      const r = p === params ? report : buildReport(data, p, label);
      await exportReport(r, format);
      const item: HistoryItem = { id: Math.random().toString(36).slice(2, 10), at: new Date().toISOString(), by: user?.name ?? "Kilogy", format, periodLabel: label, params: p };
      const next = [item, ...history].slice(0, 12);
      setHistory(next);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      message.success(`${FORMATS.find((x) => x.value === format)!.label} report downloaded`);
    } catch (e) {
      console.error(e);
      message.error("The report couldn't be created. Try again or choose another format.");
    } finally {
      setBusy(null);
    }
  }

  const picker = type === "custom" ? (
    <DatePicker.RangePicker aria-label="Report dates" allowClear={false} value={[customFrom, customTo]} format="MMM D, YYYY"
      disabledDate={(d) => d.isAfter(dayjs().endOf("day"))}
      onChange={(v) => v?.[0] && v[1] && f.setMany({ from: v[0].format("YYYY-MM-DD"), to: v[1].format("YYYY-MM-DD") })} />
  ) : (
    <DatePicker aria-label="Report period" allowClear={false} picker={type === "weekly" ? "week" : type === "monthly" ? "month" : "year"}
      value={anchor} disabledDate={(d) => d.isAfter(dayjs().endOf("day"))}
      format={type === "weekly" ? (d: Dayjs) => periodFor("weekly", d).label.replace("Week of ", "") : type === "monthly" ? "MMMM YYYY" : "YYYY"}
      onChange={(d) => d && f.set("date", d.format("YYYY-MM-DD"))} />
  );

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate, review and download platform reports for internal management."
        extra={
          <Space wrap>
            <Button type="primary" icon={<FilePdfOutlined />} loading={busy === "pdf"} onClick={() => download("pdf")}>Download PDF</Button>
            <Dropdown trigger={["click"]} menu={{
              items: FORMATS.map((x) => ({ key: x.value, icon: FORMAT_ICON[x.value], label: <div className="krep-fmt"><b>{x.label}</b><span>{x.hint}</span></div> })),
              onClick: ({ key }) => download(key as ExportFormat),
            }}>
              <Button icon={<DownloadOutlined />} loading={!!busy && busy !== "pdf"}>Other formats <DownOutlined /></Button>
            </Dropdown>
          </Space>
        } />

      <Card size="small" className="krep-builder">
        <div className="krep-row">
          <div className="krep-field"><span>Report type</span>
            <Segmented aria-label="Report type" value={type} options={TYPES}
              onChange={(v) => f.setMany({ type: v === "monthly" ? null : String(v), date: null, from: null, to: null })} />
          </div>
          <div className="krep-field"><span>Period</span>{picker}</div>
        </div>
        <div className="krep-field"><span>Sections</span>
          <Space wrap size={[16, 4]}>
            <Checkbox.Group value={categories} onChange={(v) => { if (v.length) f.set("cat", v.length === ALL_CATEGORIES.length ? null : (v as string[])); }}
              options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c], disabled: categories.length === 1 && categories[0] === c }))} />
            {categories.length < ALL_CATEGORIES.length && <Button size="small" type="link" onClick={() => f.set("cat", null)}>Select all</Button>}
          </Space>
        </div>
        <div className="krep-row">
          <div className="krep-field"><span>Carriers</span><Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All carriers" aria-label="Carriers" options={options.carriers} value={params.filters.carriers} onChange={(v) => f.set("carrier", v)} /></div>
          <div className="krep-field"><span>Transport modes</span><Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All modes" aria-label="Transport modes" options={options.modes} value={params.filters.modes} onChange={(v) => f.set("mode", v)} /></div>
          <div className="krep-field"><span>Destinations</span><Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All destinations" aria-label="Destinations" options={options.dests} value={params.filters.destinations} onChange={(v) => f.set("dest", v)} /></div>
          {f.activeCount > 0 && <Button type="link" className="krep-reset" onClick={f.clear}>Reset</Button>}
        </div>
      </Card>

      <article className="krep-doc" aria-label="Report preview">
        <header className="krep-head">
          <img src={logo} alt="KILOGY" height={30} />
          <div>
            <h2>{report.title.replace(/^KILOGY /, "").replace(/^\w/, (c) => c.toUpperCase())}</h2>
            <p className="krep-period">{report.periodLabel}</p>
            <p className="ktiny">Compared with {report.previousLabel} · {report.filtersLabel.join(" · ")} · Amounts in CAD</p>
          </div>
        </header>

        <ul className="krep-kpis">
          {report.kpis.map((k) => {
            const good = k.change == null || k.change === 0 ? null : (k.change > 0) !== !!k.invert;
            return (
              <li key={k.label}>
                <span>{k.label}</span>
                <b>{k.display}</b>
                {k.change != null && (
                  <small className={good == null ? "" : good ? "is-good" : "is-bad"}>
                    {k.change > 0 ? <ArrowUpOutlined /> : k.change < 0 ? <ArrowDownOutlined /> : null} {Math.abs(k.change) > 300 ? `from ${k.previousDisplay}` : `${Math.abs(k.change)}%`} vs previous period
                  </small>
                )}
              </li>
            );
          })}
        </ul>

        <section className="krep-summary">
          <h3>Summary</h3>
          <ul>{report.summary.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>

        {report.sections.map((sec) => (
          <section key={sec.id} className="krep-section">
            <h3>{sec.title}</h3>
            <p className="krep-intro">{sec.intro}</p>
            {sec.tables.map((t) => (
              <div key={t.title} className="krep-table">
                <h4>{t.title}</h4>
                {t.rows.length ? (
                  <Table size="small" rowKey={(_, i) => String(i)} scroll={{ x: "max-content" }}
                    pagination={t.rows.length > 10 ? { pageSize: 10, size: "small", hideOnSinglePage: true } : false}
                    dataSource={t.rows.map((r) => Object.fromEntries(r.map((v, i) => [i, v])))}
                    columns={t.columns.map((c, i) => ({ title: c, dataIndex: i, align: (t.kinds?.[i] ?? "text") === "text" ? "left" : "right",
                      render: (v: string | number) => formatCell(v, t.kinds?.[i]) }))}
                    summary={t.total ? () => (
                      <Table.Summary.Row className="krep-total">
                        {t.total!.map((v, i) => <Table.Summary.Cell key={i} index={i} align={(t.kinds?.[i] ?? "text") === "text" ? "left" : "right"}>{formatCell(v, t.kinds?.[i])}</Table.Summary.Cell>)}
                      </Table.Summary.Row>
                    ) : undefined} />
                ) : <p className="krep-empty">{t.note ?? "No data for this period."}</p>}
                {t.note && t.rows.length > 0 && <p className="ktiny">{t.note}</p>}
              </div>
            ))}
          </section>
        ))}
        {report.sections.length === 0 && <Empty description="Choose at least one section to include in the report." />}
        <footer className="krep-foot">Generated {dayjs(report.generatedAt).format("MMM D, YYYY h:mm A")} by {report.generatedBy} · Internal use only</footer>
      </article>

      <Card size="small" title={<span><HistoryOutlined /> Recent downloads</span>} className="krep-history">
        {history.length ? (
          <Table<HistoryItem> size="small" rowKey="id" pagination={false} dataSource={history} scroll={{ x: 640 }}
            columns={[
              { title: "Downloaded", dataIndex: "at", render: (v: string) => dayjs(v).format("MMM D, h:mm A") },
              { title: "Period", dataIndex: "periodLabel" },
              { title: "Sections", key: "s", render: (_, h) => (h.params.categories.length === ALL_CATEGORIES.length ? "All" : h.params.categories.map((c) => CATEGORY_LABEL[c]).join(", ")) },
              { title: "Format", dataIndex: "format", render: (v: ExportFormat) => <span className="krep-badge">{FORMAT_ICON[v]} {v.toUpperCase()}</span> },
              { title: "By", dataIndex: "by" },
              { title: "", key: "a", align: "right", render: (_, h) => (
                <Tooltip title="Rebuilt from the latest data"><Button size="small" onClick={() => download(h.format, h.params, h.periodLabel)}>Download again</Button></Tooltip>
              ) },
            ]} />
        ) : <p className="ktiny" style={{ margin: 0 }}>Reports you download appear here so you can get them again.</p>}
      </Card>
    </>
  );
}
