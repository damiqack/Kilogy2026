import { Button } from "antd";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  shown: number;
  total: number;
  /** Plural noun for the count line, e.g. "shipments" */
  noun: string;
  onClear: () => void;
  /** Show "Clear filters" only when at least one filter is set. */
  canClear: boolean;
}

/** Row of filter controls above a table, with a "Showing X of Y" count and a clear button. */
export function FilterBar({ children, shown, total, noun, onClear, canClear }: Props) {
  return (
    <div className="kfilters">
      <div className="kfilters-controls">{children}</div>
      <div className="kfilters-summary" aria-live="polite">
        <span>Showing <b>{shown}</b> of {total} {noun}</span>
        {canClear && <Button type="link" size="small" onClick={onClear}>Clear filters</Button>}
      </div>
    </div>
  );
}

/** Empty-table message used when filters hide every row. */
export function NoMatches({ noun, onClear }: { noun: string; onClear: () => void }) {
  return (
    <div className="kfilters-empty">
      <b>No {noun} match these filters</b>
      <Button size="small" onClick={onClear}>Clear filters</Button>
    </div>
  );
}
