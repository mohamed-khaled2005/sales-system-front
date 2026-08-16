import type { Metric } from "@/lib/types";
import { compact, money } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

function format(metric: Metric) {
  if (metric.format === "currency") return money(metric.value);
  if (metric.format === "percent") return `${metric.value}%`;
  if (metric.format === "score") return `${metric.value}/10`;
  return compact(metric.value);
}

export function MetricCard({ metric, index = 0 }: { metric: Metric; index?: number }) {
  const isPrimary = index === 0;

  return (
    <article
      className={`relative min-h-32 overflow-hidden rounded-2xl border p-4.5 transition hover:-translate-y-0.5 ${
        isPrimary
          ? "border-[#facc15]/30 bg-[#161618] gold-glow-subtle"
          : "border-white/7 bg-[#141415]"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-zinc-400">{metric.label}</p>
        {metric.change !== undefined && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              metric.change >= 0
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {metric.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
            {Math.abs(metric.change)}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <strong
          className={`text-2xl font-black tracking-tight sm:text-3xl ${
            isPrimary ? "text-[#facc15]" : "text-white"
          }`}
        >
          {format(metric)}
        </strong>
      </div>
    </article>
  );
}
