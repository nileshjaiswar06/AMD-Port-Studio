interface Props {
  value: "high" | "medium" | "low";
}

export function ConfidenceBadge({ value }: Props) {
  const styles = {
    high: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
    medium: "bg-amber-950/60 text-amber-300 border-amber-800/50",
    low: "bg-red-950/60 text-red-300 border-red-800/50",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${styles[value]}`}
    >
      Confidence: {value}
    </span>
  );
}