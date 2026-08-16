"use client";

import { CashFlowChart } from "@/components/charts";
import { Avatar } from "@/components/ui/avatar";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { mockEmployees, mockTasks } from "@/lib/mock-data";
import type { Metric } from "@/lib/types";
import {
  CalendarRange,
  CheckCircle2,
  Download,
  Gauge,
  Search,
  TimerOff,
  Trophy,
} from "lucide-react";

const trend = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month, i) => ({
  month,
  value: 7.4 + i * 0.22 + (i % 2 ? 0.1 : 0),
}));

export default function QualityPage() {
  const late = mockTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && !["done", "published"].includes(t.status)
  ).length;

  const metrics: Metric[] = [
    { key: "quality", label: "Quality Score", value: 8.7, format: "score", change: 6.2 },
    { key: "late", label: "Late Tasks", value: late, change: -12 },
    { key: "done", label: "Completed Tasks", value: 184, change: 18.2 },
    { key: "revision", label: "Revision Rate", value: 12.4, format: "percent", change: -4.8 },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Quality & Performance"
        title="Performance Intelligence"
        description="قياس الجودة، سرعة التنفيذ، التأخير، نسب التعديل وتقييم كل موظف أسبوعيًا وشهريًا."
        icon={Gauge}
        action={
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fde047]">
            <Download size={14} /> تقرير شهري
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">QUALITY TREND</span>
              <h2 className="mt-0.5 text-base font-bold text-white">تطور متوسط الجودة</h2>
            </div>
            <CalendarRange size={18} className="text-zinc-500" />
          </div>
          <CashFlowChart data={trend} />
        </article>

        <article className="panel bg-[#141415] border border-[#facc15]/30 p-6 rounded-2xl relative overflow-hidden gold-glow-subtle flex flex-col justify-between">
          <div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
              <Trophy size={20} />
            </span>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#facc15]">
              Employee of the month
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={mockEmployees[0].name} size="lg" framed />
              <div>
                <h3 className="text-lg font-black text-white">{mockEmployees[0].name}</h3>
                <p className="text-xs text-zinc-400">{mockEmployees[0].job_title}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { l: "Quality", v: "9.5" },
              { l: "Tasks", v: "34" },
              { l: "Late", v: "0" },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-[#1c1c1f] p-2.5 text-center border border-white/5">
                <strong className="text-lg font-black text-[#facc15]">{x.v}</strong>
                <span className="mt-0.5 block text-[9px] text-zinc-500">{x.l}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Scorecard Table */}
      <section className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-white/7 p-4 md:flex-row md:items-center">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">SCORECARD</span>
            <h2 className="mt-0.5 text-base font-bold text-white">أداء الموظفين</h2>
          </div>
          <div className="relative mr-auto w-full md:w-64">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] pr-9 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
              placeholder="ابحث عن موظف..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-right">
            <thead className="bg-[#121213] text-[10px] text-zinc-500 uppercase">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Tasks</th>
                <th className="p-3.5">Completed</th>
                <th className="p-3.5">Late</th>
                <th className="p-3.5">Speed</th>
                <th className="p-3.5">Quality</th>
                <th className="p-3.5">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockEmployees.map((e, i) => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
                      <Avatar name={e.name} size="sm" />
                      <div>
                        <strong className="block text-xs font-bold text-white">{e.name}</strong>
                        <span className="text-[10px] text-zinc-500">{e.job_title}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-xs font-bold text-zinc-300">{e.tasks_count}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 size={13} />
                      {e.completed_count}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        e.late_count ? "text-rose-400" : "text-zinc-500"
                      }`}
                    >
                      <TimerOff size={13} />
                      {e.late_count}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="h-1.5 w-20 rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-[#facc15]"
                        style={{ width: `${78 + (i % 4) * 5}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-3.5 text-xs font-black text-[#facc15]">{e.quality_score}/10</td>
                  <td className="p-3.5">
                    <ProgressRing
                      value={Math.round(e.quality_score * 10)}
                      size={36}
                      strokeWidth={3}
                      label={e.quality_score.toFixed(1)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
