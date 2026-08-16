"use client";

import { Avatar } from "@/components/ui/avatar";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockEmployees } from "@/lib/mock-data";
import type { Metric } from "@/lib/types";
import {
  CalendarDays,
  Check,
  Clock3,
  Contact,
  Download,
  Gift,
  MoreHorizontal,
  Plus,
  Search,
  UserCheck,
  UserMinus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const attendance = mockEmployees.map((e, i) => ({
  id: i + 1,
  user: e,
  date: new Date().toISOString(),
  check_in: `09:${String((i * 4) % 32).padStart(2, "0")}`,
  check_out: i % 5 === 0 ? "—" : `17:${String((i * 3) % 30).padStart(2, "0")}`,
  status: i % 8 === 0 ? "absent" : "present",
  minutes_late: (i * 4) % 32,
}));

const leaves = [
  {
    id: 1,
    user: mockEmployees[2],
    type: "إجازة سنوية",
    starts_at: "2026-08-05",
    ends_at: "2026-08-07",
    days: 3,
    status: "pending",
  },
  {
    id: 2,
    user: mockEmployees[5],
    type: "إجازة مرضية",
    starts_at: "2026-07-30",
    ends_at: "2026-07-30",
    days: 1,
    status: "approved",
  },
];

export default function HRPage() {
  const [tab, setTab] = useState("attendance");
  const [leaveRows, setLeaveRows] = useState(leaves);

  const metrics: Metric[] = [
    { key: "employees", label: "إجمالي الموظفين", value: mockEmployees.length + 2, change: 4.2 },
    { key: "present", label: "الحضور اليوم", value: attendance.filter((a) => a.status === "present").length },
    { key: "late", label: "المتأخرون", value: attendance.filter((a) => a.minutes_late > 15).length },
    { key: "leaves", label: "طلبات الإجازة", value: leaveRows.filter((l) => l.status === "pending").length },
  ];

  function review(id: number, status: "approved" | "rejected") {
    setLeaveRows((v) => v.map((l) => (l.id === id ? { ...l, status } : l)));
    api(`/hr/leaves/${id}`, { method: "PUT", body: JSON.stringify({ status }) }).catch(() => {});
    toast.success(status === "approved" ? "تمت الموافقة على الإجازة" : "تم رفض طلب الإجازة");
  }

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Human Resources"
        title="People Operations"
        description="الحضور والانصراف، الإجازات، العقود، الجزاءات، المكافآت والرواتب."
        icon={Contact}
        action={
          <div className="flex gap-2">
            <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5">
              <Download size={14} className="text-[#facc15]" /> تقرير الحضور
            </button>
            <button className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fde047]">
              <Plus size={14} /> موظف جديد
            </button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["attendance", "الحضور"],
                ["leaves", "الإجازات"],
                ["payroll", "الرواتب"],
                ["contracts", "العقود"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    tab === v ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-400 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="relative mr-auto w-full md:w-60">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] pr-9 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                placeholder="بحث..."
              />
            </div>
          </div>

          {tab === "attendance" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right">
                <thead className="bg-[#121213] text-[10px] text-zinc-500 uppercase">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Check in</th>
                    <th className="p-3.5">Check out</th>
                    <th className="p-3.5">Late</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.user.name} size="sm" />
                          <div>
                            <strong className="block text-xs font-bold text-white">{a.user.name}</strong>
                            <span className="text-[10px] text-zinc-500">{a.user.job_title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-xs text-zinc-400">{a.user.role.replaceAll("_", " ")}</td>
                      <td className="p-3.5 text-xs font-bold text-zinc-200">{a.check_in}</td>
                      <td className="p-3.5 text-xs font-bold text-zinc-200">{a.check_out}</td>
                      <td className="p-3.5">
                        <span className={`text-xs ${a.minutes_late > 15 ? "text-rose-400 font-bold" : "text-zinc-500"}`}>
                          {a.minutes_late} min
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="p-3.5">
                        <button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "leaves" ? (
            <div className="space-y-3 p-4">
              {leaveRows.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/7 bg-[#1c1c1f] p-3.5 sm:flex-row sm:items-center"
                >
                  <Avatar name={l.user.name} size="sm" />
                  <div className="flex-1">
                    <strong className="text-xs font-bold text-white">{l.user.name}</strong>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {l.type} • {l.starts_at} → {l.ends_at} • {l.days} أيام
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                  {l.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => review(l.id, "approved")}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#facc15] text-black hover:bg-[#fde047]"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => review(l.id, "rejected")}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center text-center p-6">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <CalendarDays size={20} />
                </span>
                <h3 className="mt-3 font-bold text-sm text-white">
                  {tab === "payroll" ? "الرواتب والمكافآت" : "عقود الموظفين"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">الهيكل جاهز لإضافة السجلات ومرفقات العقود والتقارير.</p>
              </div>
            </div>
          )}
        </article>

        <aside className="space-y-4">
          <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">TODAY OVERVIEW</span>
            <h2 className="mt-0.5 text-base font-bold text-white">ملخص اليوم</h2>
            <div className="mt-4 space-y-2.5">
              {[
                {
                  icon: UserCheck,
                  label: "حاضر",
                  value: attendance.filter((a) => a.status === "present").length,
                  color: "text-[#facc15]",
                },
                {
                  icon: Clock3,
                  label: "تأخير",
                  value: attendance.filter((a) => a.minutes_late > 15).length,
                  color: "text-amber-400",
                },
                {
                  icon: UserMinus,
                  label: "غائب",
                  value: attendance.filter((a) => a.status === "absent").length,
                  color: "text-rose-400",
                },
                { icon: Gift, label: "مكافآت معلقة", value: 3, color: "text-[#facc15]" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-[#1c1c1f] p-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg bg-white/5 ${color}`}>
                    <Icon size={16} />
                  </span>
                  <span className="flex-1 text-xs font-semibold text-zinc-300">{label}</span>
                  <strong className="text-base font-black text-white">{value}</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
