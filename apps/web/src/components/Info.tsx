export function Info({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
      {sub && <span className="caption">{sub}</span>}
    </div>
  );
}
