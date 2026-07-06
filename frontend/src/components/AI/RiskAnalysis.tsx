import type { AnalyzeResponse } from "@/types/analysis";
import { AlertTriangle, AlertCircle, ShieldAlert, ShieldCheck,
} from "lucide-react";

interface RiskAnalysisProps {
  data: AnalyzeResponse;
}

function getRiskLevel(score: number) {
  if (score >= 80) {
    return {
      label: "Low Risk",
      color: "text-emerald-400",
      border: "border-emerald-800",
      bg: "bg-emerald-950/20",
      icon: ShieldCheck,
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate Risk",
      color: "text-yellow-400",
      border: "border-yellow-800",
      bg: "bg-yellow-950/20",
      icon: AlertTriangle,
    };
  }

  if (score >= 40) {
    return {
      label: "High Risk",
      color: "text-orange-400",
      border: "border-orange-800",
      bg: "bg-orange-950/20",
      icon: AlertCircle,
    };
  }

  return {
    label: "Critical Risk",
    color: "text-red-400",
    border: "border-red-800",
    bg: "bg-red-950/20",
    icon: ShieldAlert,
  };
}

export function RiskAnalysis({ data }: RiskAnalysisProps) {
  const compatibility =
    data.findings?.compatibility?.score ??
    data.analysis?.compatibilityScore ??
    0;

  const blockers = data.blockers ?? [];
  const risk = getRiskLevel(compatibility);
  // const risk = getRiskLevel(data.metrics?.riskScore ?? compatibility);
  
  const Icon = risk.icon;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Risk Analysis
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Migration Risk Assessment
          </h3>
        </div>

        <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${risk.bg} ${risk.border} border`}>
          <Icon className={`h-5 w-5 ${risk.color}`} />
          <span className={`font-medium ${risk.color}`}>
            {risk.label}
          </span>
        </div>
      </div>

      <p className="mt-4 text-zinc-400">
        The following issues require attention before the repository can be
        considered production-ready on AMD ROCm.
      </p>

      {blockers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300">
                No critical blockers detected
              </p>
              <p className="text-sm text-emerald-400">
                Repository appears ready for migration.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {blockers.map((blocker, index) => (
            <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-white">
                    {blocker.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {blocker.detail}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    blocker.severity === "critical"
                      ? "bg-red-950 text-red-300"
                      : blocker.severity === "high"
                      ? "bg-orange-950 text-orange-300"
                      : blocker.severity === "medium"
                      ? "bg-yellow-950 text-yellow-300"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {blocker.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}