import type { RankedOption } from "../data/types";

const LABELS: [keyof RankedOption["ai_scores"], string][] = [
  ["cost", "Cost"], ["speed", "Speed"], ["carbon", "Carbon"], ["reliability", "Reliability"],
];

export function ScoreBars({ scores }: { scores: RankedOption["ai_scores"] }) {
  return (
    <div className="score-grid">
      {LABELS.map(([k, label]) => (
        <div className="score-item" key={k}>
          <div className="row-between"><span className="muted">{label}</span><span className="num">{Math.round(scores[k])}</span></div>
          <div className="bar"><span style={{ width: `${Math.max(3, scores[k])}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
