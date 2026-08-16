"use client";

import { TaskDrawer } from "@/components/task-drawer";
import { Avatar } from "@/components/ui/avatar";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockTasks } from "@/lib/mock-data";
import type { Metric, Paginated, Task } from "@/lib/types";
import {
  CalendarClock,
  Check,
  CheckCheck,
  CirclePlay,
  FileImage,
  Filter,
  MessageSquareText,
  RotateCcw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selected, setSelected] = useState<Task | null>(null);
  const [filter, setFilter] = useState("waiting_review");

  useEffect(() => {
    api<Paginated<Task>>("/tasks?per_page=100")
      .then((r) => {
        if (r?.data) setTasks(r.data);
      })
      .catch(() => {});
  }, []);

  const queue = useMemo(
    () =>
      tasks.filter((t) =>
        filter === "all"
          ? ["waiting_review", "account_review", "client_review", "need_revision"].includes(t.status)
          : t.status === filter
      ),
    [tasks, filter]
  );

  const metrics: Metric[] = [
    { key: "waiting", label: "بانتظار Art Director", value: tasks.filter((t) => t.status === "waiting_review").length },
    { key: "account", label: "مراجعة Account Manager", value: tasks.filter((t) => t.status === "account_review").length },
    { key: "client", label: "مراجعة العميل", value: tasks.filter((t) => t.status === "client_review").length },
    { key: "revision", label: "Need Revision", value: tasks.filter((t) => t.status === "need_revision").length },
  ];

  async function quick(task: Task, status: string) {
    try {
      await api(`/tasks/${task.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          status,
          comment: status === "art_approved" ? "Approved from review center" : "Please apply review comments",
          rating: status === "art_approved" ? 9 : undefined,
        }),
      });
    } catch {}
    setTasks((v) => v.map((t) => (t.id === task.id ? { ...t, status } : t)));
    toast.success(status === "art_approved" ? "تم اعتماد العمل" : "تم إرجاع العمل للتعديل");
  }

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Quality Gate"
        title="Approval Center"
        description="لا ينتقل أي محتوى أو تصميم أو فيديو إلى العميل قبل المرور على بوابة الجودة واعتماد المدير الفني."
        icon={CheckCheck}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard metric={m} index={i} key={m.key} />
        ))}
      </section>

      {/* Filter Tabs */}
      <div className="panel bg-[#141415] border border-white/7 p-4 rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
              placeholder="ابحث في قائمة المراجعة..."
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["waiting_review", "Art Review"],
              ["account_review", "Account Review"],
              ["client_review", "Client Review"],
              ["need_revision", "Revisions"],
              ["all", "الكل"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  filter === v ? "bg-[#facc15] text-black font-black" : "bg-[#1e1e20] text-zinc-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Approval Cards */}
      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {queue.map((task) => (
          <article
            key={task.id}
            className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-white/20 flex flex-col justify-between"
          >
            <div className="relative h-40 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 soft-grid">
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl text-[#facc15]">
                  {task.department === "video" ? <CirclePlay size={26} /> : <FileImage size={26} />}
                </span>
              </div>
              <div className="absolute right-3.5 top-3.5">
                <StatusBadge status={task.status} />
              </div>
              <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 backdrop-blur">
                {task.type.replaceAll("_", " ")}
              </div>
            </div>

            <div className="p-4.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{task.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {task.client?.name} • {task.platform}
                  </p>
                </div>
                <Avatar name={task.assignee?.name ?? "User"} size="sm" />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1c1c1f] p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <CalendarClock size={13} className="text-[#facc15]" />
                  {task.deadline
                    ? new Date(task.deadline).toLocaleString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                      })
                    : "—"}
                </div>
                <div className="flex items-center gap-1 text-[#facc15]">
                  <Star size={12} className="fill-[#facc15]" />
                  <span className="text-[10px] font-bold">Review Required</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => quick(task, "art_approved")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#facc15] text-xs font-black text-black hover:bg-[#fde047] transition"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => quick(task, "need_revision")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-rose-500/15 text-xs font-bold text-rose-300 border border-rose-500/20 hover:bg-rose-500/25 transition"
                >
                  <RotateCcw size={13} /> Revision
                </button>
                <button
                  onClick={() => setSelected(task)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1e1e20] text-xs font-bold text-zinc-300 border border-white/10 hover:bg-white/10 transition"
                >
                  <MessageSquareText size={13} /> Review
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {queue.length === 0 && (
        <div className="panel bg-[#141415] border border-white/7 grid h-52 place-items-center text-center rounded-2xl">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
              <CheckCheck size={22} />
            </span>
            <h3 className="mt-3 font-bold text-sm text-white">قائمة المراجعة فارغة</h3>
            <p className="mt-1 text-xs text-zinc-500">كل الأعمال في هذه المرحلة تمت مراجعتها.</p>
          </div>
        </div>
      )}

      <TaskDrawer task={selected} onClose={() => setSelected(null)} onUpdated={(u) => setTasks((v) => v.map((t) => (t.id === u.id ? u : t)))} />
    </div>
  );
}
