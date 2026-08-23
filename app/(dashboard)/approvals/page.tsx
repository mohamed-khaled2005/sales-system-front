"use client";

import { useAuth } from "@/components/auth-provider";
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selected, setSelected] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"waiting_review" | "art_approved" | "need_revision" | "all">("waiting_review");
  const [search, setSearch] = useState("");

  const isArtDirector = user?.role === "art_director" || user?.role === "ceo" || user?.role === "admin";

  async function loadTasks() {
    try {
      const res = await api<Paginated<Task>>("/tasks?per_page=100");
      if (res?.data) setTasks(res.data);
    } catch {
      setTasks(mockTasks);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const queue = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = (t.title + " " + (t.client?.name ?? "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filter === "waiting_review") return t.status === "waiting_review";
      if (filter === "art_approved") return ["art_approved", "client_review", "client_approved", "published", "done"].includes(t.status);
      if (filter === "need_revision") return t.status === "need_revision";
      return ["waiting_review", "art_approved", "need_revision", "account_review", "client_review"].includes(t.status);
    });
  }, [tasks, filter, search]);

  const metrics: Metric[] = [
    { key: "waiting", label: "بانتظار اعتماد المدير الفني", value: tasks.filter((t) => t.status === "waiting_review").length },
    { key: "revision", label: "تحت التعديل (Needs Revision)", value: tasks.filter((t) => t.status === "need_revision").length },
    { key: "art_approved", label: "معتمد من المدير الفني", value: tasks.filter((t) => !!t.art_director_approved_at).length },
    { key: "completed", label: "إجمالي الأعمال المنفذة", value: tasks.filter((t) => ["published", "done"].includes(t.status)).length },
  ];

  async function quickApprove(task: Task) {
    if (!isArtDirector) {
      toast.error("صلاحية الاعتماد الفني مخصصة للمدير الفني فقط.");
      return;
    }
    try {
      const res = await api<Task>(`/tasks/${task.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          status: "art_approved",
          comment: "معتمد من المدير الفني",
          rating: 10,
        }),
      });
      setTasks((v) => v.map((t) => (t.id === task.id ? res : t)));
      toast.success("تم اعتماد العمل الفني وإرساله للأكونت");
    } catch (err: any) {
      toast.error(err?.message || "فشل الاعتماد");
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Art Direction & Creative Quality"
        title="Art Director Approval Center"
        description="الجهة المسؤولة والمخولة حصرياً بمراجعة الأعمال الإبداعية واعتمادها أو طلب التعديلات عليها."
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
              placeholder="ابحث في قائمة المراجعة..."
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["waiting_review", "بانتظار المراجعة الفنية (Pending Review)"],
              ["art_approved", "الأعمال المعتمدة (Approved)"],
              ["need_revision", "مطلوب تعديلات (Needs Revision)"],
              ["all", "الكل"],
            ].map(([v, l]: any) => (
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
                  <h3 className="text-sm font-bold text-white leading-snug">{task.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {task.client?.name} • {task.platform || "Social Media"}
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
                  <span className="text-[10px] font-bold">
                    {task.art_director_approved_at ? "Art Approved" : "Review Needed"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {task.status === "waiting_review" && isArtDirector && (
                  <button
                    onClick={() => quickApprove(task)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#facc15] text-xs font-black text-black hover:bg-[#fde047] transition"
                  >
                    <Check size={14} /> Approve
                  </button>
                )}
                <button
                  onClick={() => setSelected(task)}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1e1e20] text-xs font-bold text-zinc-200 border border-white/10 hover:bg-white/10 transition ${
                    task.status === "waiting_review" && isArtDirector ? "" : "col-span-2"
                  }`}
                >
                  <MessageSquareText size={13} /> فحص ومراجعة العمل
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
            <p className="mt-1 text-xs text-zinc-500">كل الأعمال في هذا التصنيف تمت مراجعتها.</p>
          </div>
        </div>
      )}

      <TaskDrawer
        task={selected}
        onClose={() => setSelected(null)}
        onUpdated={(u) => setTasks((v) => v.map((t) => (t.id === u.id ? u : t)))}
      />
    </div>
  );
}
