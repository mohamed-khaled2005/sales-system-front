"use client";

import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { mockEmployees } from "@/lib/mock-data";
import {
  Building2,
  Crown,
  Filter,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

const departments = [
  { name: "Sales", count: 5, score: 8.4, color: "#facc15" },
  { name: "Account Management", count: 4, score: 8.8, color: "#38bdf8" },
  { name: "Content", count: 6, score: 8.2, color: "#a78bfa" },
  { name: "Design", count: 5, score: 9.0, color: "#facc15" },
  { name: "Video", count: 4, score: 8.6, color: "#f472b6" },
  { name: "Production", count: 5, score: 8.1, color: "#fb923c" },
];

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Company Directory"
        title="Teams & Departments"
        description="هيكل الشركة، أعضاء كل قسم، الصلاحيات ومؤشرات الأداء الرئيسية."
        icon={Users}
        action={
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fde047]">
            <Plus size={14} /> إضافة عضو
          </button>
        }
      />

      {/* Departments Grid */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {departments.map((d, i) => (
          <article
            className="panel bg-[#141415] border border-white/7 relative overflow-hidden p-4 rounded-2xl transition hover:border-white/15"
            key={d.name}
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: d.color }} />
            <span
              className="grid h-9 w-9 place-items-center rounded-xl font-bold text-black"
              style={{ background: d.color }}
            >
              {i === 0 ? <Crown size={16} /> : <Building2 size={16} />}
            </span>
            <h3 className="mt-4 text-xs font-bold text-white truncate">{d.name}</h3>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <strong className="text-2xl font-black text-white">{d.count}</strong>
                <span className="mr-1 text-[10px] text-zinc-500">أعضاء</span>
              </div>
              <ProgressRing value={d.score * 10} size={36} strokeWidth={3} label={d.score.toFixed(1)} />
            </div>
          </article>
        ))}
      </section>

      {/* Search Bar */}
      <div className="panel bg-[#141415] border border-white/7 flex flex-col gap-3 p-4 md:flex-row md:items-center rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            placeholder="ابحث بالاسم أو المسمى الوظيفي..."
            className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
          />
        </div>
        <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1e1e20] px-4 text-xs font-bold text-zinc-300 hover:bg-white/5">
          <Filter size={14} className="text-[#facc15]" /> القسم والصلاحية
        </button>
      </div>

      {/* Team Members Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {mockEmployees.map((e, i) => (
          <article
            key={e.id}
            className="panel bg-[#141415] border border-white/7 group p-5 transition hover:-translate-y-0.5 hover:border-white/20 rounded-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <Avatar name={e.name} size="lg" framed={i === 0} />
                <button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <h3 className="mt-4 text-sm font-bold text-white group-hover:text-[#facc15] transition">{e.name}</h3>
              <p className="mt-0.5 text-xs text-zinc-400">{e.job_title}</p>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-[#facc15]/10 border border-[#facc15]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#facc15]">
                  {e.role.replaceAll("_", " ")}
                </span>
                {i < 3 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <Star size={10} className="fill-amber-300" /> Top
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#1a1a1c] p-2 border border-white/5">
                  <strong className="block text-xs font-bold text-white">{e.completed_count}</strong>
                  <span className="block text-[8px] text-zinc-500">Done</span>
                </div>
                <div className="rounded-lg bg-[#1a1a1c] p-2 border border-white/5">
                  <strong className="block text-xs font-bold text-white">{e.late_count}</strong>
                  <span className="block text-[8px] text-zinc-500">Late</span>
                </div>
                <div className="rounded-lg bg-[#1a1a1c] p-2 border border-white/5">
                  <strong className="block text-xs font-bold text-[#facc15]">{e.quality_score}</strong>
                  <span className="block text-[8px] text-zinc-500">Quality</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-zinc-500">
              <a href={`mailto:${e.email}`} className="hover:text-white flex items-center gap-1.5 truncate max-w-[170px]">
                <Mail size={12} className="text-[#facc15]" />
                {e.email}
              </a>
              <ShieldCheck size={14} className="text-zinc-600 shrink-0" />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
