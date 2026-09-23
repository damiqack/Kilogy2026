import type { RankedOption } from "../data/types";

const LABELS: [keyof RankedOption["ai_scores"], string][] = [
  ["cost", "Cost"], ["speed", "Speed"], ["carbon", "Carbon"], ["reliability", "Reliability"],
];

export function ScoreBars({ scores }: { scores: RankedOption["ai_scores"] }) {
  return (
    <div className="score-grid">
      {LABELS.map(([k, label]) => (
        <div className="score-item" key={k}>
          <div className="row-between"><span className="muted">{label}</span><span className="num strong">{Math.round(scores[k])}</span></div>
          <div className="meter" role="meter" aria-label={`${label} score`} aria-valuenow={Math.round(scores[k])} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.max(3, scores[k])}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AiScore({ value }: { value: number }) {
  return <span className="score" aria-label={`AI score ${Math.round(value)} out of 100`}>{Math.round(value)}<small>/ 100</small></span>;
}
