"use client";

import { useAuth } from "@/components/auth-provider";
import { TaskDrawer } from "@/components/task-drawer";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockTasks } from "@/lib/mock-data";
import type { Client, Paginated, Task, User } from "@/lib/types";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCode,
  FileImage,
  FileText,
  Filter,
  Folder,
  FolderPlus,
  Layers,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [team, setTeam] = useState<User[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<"all" | "carousel" | "design" | "branding" | "video">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "need_revision" | "in_progress" | "approved">("all");

  async function loadData() {
    setRefreshing(true);
    try {
      const [tasksRes, clientsRes, usersRes] = await Promise.all([
        api<Paginated<Task>>("/tasks?per_page=100"),
        api<Paginated<Client>>("/clients?per_page=100"),
        api<User[]>("/users"),
      ]);
      if (tasksRes?.data) setTasks(tasksRes.data);
      if (clientsRes?.data) setClients(clientsRes.data);
      if (usersRes) setTeam(usersRes);
    } catch {
      setTasks(mockTasks);
      setClients(mockClients);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      client_id: Number(fd.get("client_id")),
      assigned_to: fd.get("assigned_to") ? Number(fd.get("assigned_to")) : undefined,
      title: String(fd.get("title")),
      department: String(fd.get("department") || "design"),
      type: String(fd.get("type") || "design"),
      priority: String(fd.get("priority") || "high"),
      status: "in_progress",
      objective: String(fd.get("objective") || ""),
      buyer_persona: String(fd.get("buyer_persona") || ""),
      platform: String(fd.get("platform") || "Instagram"),
      deadline: fd.get("deadline") ? String(fd.get("deadline")) : undefined,
    };

    try {
      const created = await api<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((prev) => [created, ...prev]);
      toast.success("تم إنشاء المهمة وإسنادها بنجاح");
      setNewTaskOpen(false);
    } catch {
      toast.error("فشل إنشاء المهمة");
    }
  }

  const updateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      const matchSearch = (t.title + " " + (t.client?.name ?? "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      // Category
      if (selectedCategory !== "all") {
        const typeStr = (t.type + " " + t.department + " " + t.title).toLowerCase();
        if (selectedCategory === "carousel" && !typeStr.includes("carousel")) return false;
        if (selectedCategory === "design" && !typeStr.includes("design") && !typeStr.includes("visual")) return false;
        if (selectedCategory === "branding" && !typeStr.includes("brand") && !typeStr.includes("identity")) return false;
        if (selectedCategory === "video" && !typeStr.includes("video") && !typeStr.includes("reel") && !typeStr.includes("edit")) return false;
      }

      // Status
      if (statusFilter === "need_revision" && t.status !== "need_revision") return false;
      if (statusFilter === "in_progress" && !["in_progress", "brief_ready", "draft"].includes(t.status)) return false;
      if (statusFilter === "approved" && !["art_approved", "client_approved", "published", "done"].includes(t.status)) return false;

      return true;
    });
  }, [tasks, search, selectedCategory, statusFilter]);

  // Real performance metrics
  const completedCount = tasks.filter((t) => ["published", "done", "client_approved"].includes(t.status)).length;
  const needRevisionCount = tasks.filter((t) => t.status === "need_revision").length;
  const inProgressCount = tasks.filter((t) => ["in_progress", "waiting_review"].includes(t.status)).length;
  const qualityRate = Math.min(100, Math.round(((completedCount) / (tasks.length || 1)) * 100));

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Search & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في المهام والمشاريع..."
            className="h-10 w-full rounded-xl border border-white/8 bg-[#161618] pr-10 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>

          <PrimaryButton onClick={() => setNewTaskOpen(true)}>
            <Plus size={15} /> إضافة مهمة / مشروع جديد
          </PrimaryButton>
        </div>
      </div>

      {/* Real Performance Summary Slider / Widget */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">قيد التنفيذ والمراجعة</span>
            <strong className="text-2xl font-black text-white block mt-1">{inProgressCount}</strong>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">مهام نشطة في الفريق</span>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
            <Sparkles size={20} />
          </span>
        </div>

        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">تحتاج تعديلات (Needs Revision)</span>
            <strong className="text-2xl font-black text-rose-400 block mt-1">{needRevisionCount}</strong>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">عادت للمنفذ لتطبيق الملاحظات</span>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-400">
            <RotateCcw size={20} />
          </span>
        </div>

        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">الأعمال المعتمدة والمكتملة</span>
            <strong className="text-2xl font-black text-emerald-400 block mt-1">{completedCount}</strong>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">اعتماد Art Director & Client</span>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={20} />
          </span>
        </div>

        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">معدل الإنجاز والجودة</span>
            <strong className="text-2xl font-black text-[#facc15] block mt-1">{qualityRate}%</strong>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${qualityRate}%` }} />
            </div>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
            <Award size={20} />
          </span>
        </div>
      </section>

      {/* Category & Status Filter Tabs (Senior Designer & Team) */}
      <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-zinc-500 pl-2">القسم / التصنيف:</span>
          {[
            ["all", "الكل", Layers],
            ["carousel", "كابشن وكاروسيل (Carousel)", FileText],
            ["design", "تصاميم سوشيال (Design)", Palette],
            ["branding", "هوية بصرية (Branding)", Sparkles],
            ["video", "فيديو وريلز (Video/Reels)", Video],
          ].map(([key, label, Icon]: any) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedCategory === key
                  ? "bg-[#facc15] text-black font-black"
                  : "bg-[#1a1a1c] text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold text-zinc-500 pl-2">الحالة:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              statusFilter === "all" ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            الكل ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("need_revision")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              statusFilter === "need_revision" ? "bg-rose-500/20 text-rose-300 font-black" : "text-rose-400/70 hover:text-rose-300"
            }`}
          >
            Needs Revision ({needRevisionCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              statusFilter === "in_progress" ? "bg-[#facc15]/20 text-[#facc15] font-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              statusFilter === "approved" ? "bg-emerald-500/20 text-emerald-300 font-black" : "text-emerald-400/70 hover:text-emerald-300"
            }`}
          >
            Approved ({completedCount})
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelected(t)}
            className="group cursor-pointer rounded-2xl border border-white/7 bg-[#161618] p-4.5 transition hover:-translate-y-1 hover:border-white/15 hover:bg-[#1a1a1d] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#facc15]/15 text-[#facc15]">
                    <Folder size={15} />
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {t.department}
                  </span>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <strong className="block text-sm font-bold text-white leading-snug group-hover:text-[#facc15] transition">
                {t.title}
              </strong>
              <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">
                {t.client?.name} • {t.objective || "مهمة إبداعية معتمدة"}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Avatar name={t.assignee?.name || "Unassigned"} size="sm" />
                <span className="text-zinc-300 font-medium">{t.assignee?.name || "غير مسند"}</span>
              </div>
              <span className="font-mono text-zinc-400">
                {t.deadline ? new Date(t.deadline).toLocaleDateString("ar-EG") : "—"}
              </span>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full panel bg-[#141415] border border-white/7 rounded-2xl p-12 text-center text-xs text-zinc-500">
            لا توجد مهام مطابقة لخيارات الفلترة الحالية.
          </div>
        )}
      </section>

      {/* MODAL: ADD NEW TASK / PROJECT */}
      <Modal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} title="إضافة مهمة / مشروع جديد">
        <form onSubmit={handleCreateTask} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="عنوان المهمة" className="md:col-span-2">
            <input name="title" required placeholder="مثال: تصاميم كاروسيل اليوم الوطني" className={inputClass} />
          </Field>

          <Field label="العميل">
            <select name="client_id" required className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="المسؤول عن التنفيذ">
            <select name="assigned_to" className={inputClass}>
              <option value="">-- غير مسند حالياً --</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.job_title || u.role})
                </option>
              ))}
            </select>
          </Field>

          <Field label="القسم">
            <select name="department" className={inputClass}>
              <option value="design">التصميم (Design)</option>
              <option value="content">صناعة المحتوى (Content)</option>
              <option value="video">المونتاج والفيديو (Video)</option>
              <option value="production">الإنتاج والتصوير (Production)</option>
            </select>
          </Field>

          <Field label="نوع العمل">
            <select name="type" className={inputClass}>
              <option value="carousel">Carousel Post</option>
              <option value="social_design">Social Media Graphic</option>
              <option value="brand_visual">Brand Visual</option>
              <option value="reel_edit">Short-form Reel Edit</option>
              <option value="copywriting">Copywriting & Script</option>
            </select>
          </Field>

          <Field label="الأولوية">
            <select name="priority" className={inputClass}>
              <option value="medium">متوسطة (Medium)</option>
              <option value="high">عالية (High)</option>
              <option value="urgent">عاجلة (Urgent)</option>
              <option value="low">منخفضة (Low)</option>
            </select>
          </Field>

          <Field label="الموعد النهائي (Deadline)">
            <input name="deadline" type="datetime-local" className={inputClass} />
          </Field>

          <Field label="الهدف من المحتوى (Objective)" className="md:col-span-2">
            <textarea name="objective" placeholder="ما هي الرسالة والهدف الإعلاني المطلوب تحقيقه؟..." className={textareaClass} />
          </Field>

          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setNewTaskOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Plus size={14} /> إنشاء المهمة
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Task Drawer */}
      <TaskDrawer task={selected} onClose={() => setSelected(null)} onUpdated={updateTask} />
    </div>
  );
}
