/** A generated report: the same structure feeds the on-screen preview and every export format. */

export type PeriodType = "weekly" | "monthly" | "annual" | "custom";

export type ReportCategory = "operations" | "orders" | "carriers" | "transactions" | "financial" | "users" | "system";

export const CATEGORY_LABEL: Record<ReportCategory, string> = {
  operations: "Logistics operations",
  orders: "Orders and bookings",
  carriers: "Carrier performance",
  transactions: "Transactions",
  financial: "Financial performance",
  users: "Users and accounts",
  system: "System activity",
};
export const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as ReportCategory[];

export interface ReportFilters {
  carriers: string[];
  modes: string[];
  destinations: string[];
}

export interface ReportParams {
  periodType: PeriodType;
  /** Inclusive range, ISO dates (YYYY-MM-DD) */
  from: string;
  to: string;
  categories: ReportCategory[];
  filters: ReportFilters;
}

export type Cell = string | number;
export interface ReportTable {
  title: string;
  columns: string[];
  /** Column kinds drive alignment and number formats in exports. */
  kinds?: ("text" | "int" | "money" | "pct" | "num")[];
  rows: Cell[][];
  /** Optional totals row, same length as columns */
  total?: Cell[];
  note?: string;
}

export interface ReportSection {
  id: ReportCategory;
  title: string;
  intro: string;
  tables: ReportTable[];
}

export interface Kpi {
  label: string;
  value: number;
  display: string;
  /** Percent change vs the previous period of the same length; null when there's nothing to compare. */
  change: number | null;
  /** The same measure for the previous period, formatted. */
  previousDisplay: string;
  /** true when a rise is bad (e.g. exceptions) */
  invert?: boolean;
}

export interface Report {
  title: string;
  periodLabel: string;
  previousLabel: string;
  from: string;
  to: string;
  generatedAt: string;
  generatedBy: string;
  filtersLabel: string[];
  currency: string;
  kpis: Kpi[];
  summary: string[];
  sections: ReportSection[];
}
