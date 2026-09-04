"use client";

import { useAuth } from "@/components/auth-provider";
import { TaskDrawer } from "@/components/task-drawer";
import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import type { Client, Metric, Paginated, Task, User } from "@/lib/types";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRight,
  Award,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  MessageSquareText,
  PanelTop,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { user } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"art_review" | "client_review" | "approved_archive">("art_review");

  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected for TaskDrawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Concurrency & In-Flight Request Locking (Solves double-click / failed to fetch bug)
  const [busyTaskIds, setBusyTaskIds] = useState<Record<number, boolean>>({});
  const [batchBusy, setBatchBusy] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  // Batch Selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Review & Rating Modal State (Custom approval with stars & feedback)
  const [reviewModalTask, setReviewModalTask] = useState<Task | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(10);
  const [approvalComment, setApprovalComment] = useState<string>("معتمد من المدير الفني - جودة إبداعية ممتازة");

  // Revision Modal State
  const [revisionModalTask, setRevisionModalTask] = useState<Task | null>(null);
  const [revisionReason, setRevisionReason] = useState<string>("");
  const [revisionCategory, setRevisionCategory] = useState<string>("visual_styling");

  // Client Feedback Modal State
  const [clientFeedbackModalTask, setClientFeedbackModalTask] = useState<Task | null>(null);
  const [clientFeedbackAction, setClientFeedbackAction] = useState<"client_approved" | "need_revision">("client_approved");
  const [clientFeedbackComment, setClientFeedbackComment] = useState<string>("");

  const isArtDirector = user?.role === "art_director" || user?.role === "ceo" || user?.role === "admin";
  const isAccountManager = user?.role === "account_manager" || user?.role === "ceo" || user?.role === "admin";

  // Load All Tasks from Backend API
  async function loadData() {
    setLoading(true);
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        api<Paginated<Task>>("/tasks?per_page=100"),
        api<Paginated<Client> | Client[]>("/clients?per_page=100"),
      ]);

      if (tasksRes?.data && Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data);
      } else {
        setTasks([]);
      }
      const clientList = (clientsRes as any)?.data || (Array.isArray(clientsRes) ? clientsRes : []);
      setClients(clientList);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter Tasks by Active Tab & Search Criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search Query Match
      const searchStr = (
        (t.title || "") + " " +
        (t.client?.name || "") + " " +
        (t.objective || "") + " " +
        (t.assignee?.name || "") + " " +
        (t.department || "")
      ).toLowerCase();
      if (search && !searchStr.includes(search.toLowerCase())) return false;

      // 2. Department & Priority & Client Filters
      if (departmentFilter !== "all" && t.department !== departmentFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (clientFilter !== "all" && t.client_id !== Number(clientFilter) && t.client?.id !== Number(clientFilter)) return false;

      // 3. Tab State Logic
      if (activeTab === "art_review") {
        return t.status === "waiting_review" || t.status === "need_revision";
      }
      if (activeTab === "client_review") {
        return t.status === "art_approved" || t.status === "account_review" || t.status === "client_review";
      }
      if (activeTab === "approved_archive") {
        return t.status === "client_approved" || t.status === "published" || t.status === "done" || !!t.art_director_approved_at;
      }
      return true;
    });
  }, [tasks, activeTab, search, departmentFilter, priorityFilter, clientFilter]);

  // KPIs
  const waitingArtReviewCount = useMemo(() => tasks.filter((t) => t.status === "waiting_review").length, [tasks]);
  const needRevisionCount = useMemo(() => tasks.filter((t) => t.status === "need_revision").length, [tasks]);
  const clientReviewCount = useMemo(() => tasks.filter((t) => ["art_approved", "account_review", "client_review"].includes(t.status)).length, [tasks]);
  const completedApprovedCount = useMemo(() => tasks.filter((t) => ["client_approved", "published", "done"].includes(t.status) || !!t.art_director_approved_at).length, [tasks]);

  const metrics: Metric[] = useMemo(() => [
    { key: "waiting_art", label: "بانتظار المراجعة الفنية (Art Review)", value: waitingArtReviewCount },
    { key: "need_revision", label: "تعديلات قيد التنفيذ (Revisions)", value: needRevisionCount },
    { key: "client_review", label: "بانتظار موافقة العميل (Client Approval)", value: clientReviewCount },
    { key: "approved_total", label: "أعمال معتمدة بنجاح", value: completedApprovedCount },
  ], [waitingArtReviewCount, needRevisionCount, clientReviewCount, completedApprovedCount]);

  // Robust Single Task Transition with Concurrency Lock
  const handleTransition = async (task: Task, targetStatus: string, comment?: string, rating?: number) => {
    // Prevent double clicking while in-flight
    if (busyTaskIds[task.id]) return;

    setBusyTaskIds((prev) => ({ ...prev, [task.id]: true }));

    try {
      const res = await api<Task>(`/tasks/${task.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          status: targetStatus,
          comment: comment || undefined,
          rating: rating || undefined,
        }),
      });

      // Update state locally and seamlessly
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res : t)));
      toast.success(
        targetStatus === "art_approved"
          ? `تم اعتماد المهمة '${task.title}' وإرسالها لمراجعة العميل 🎨✨`
          : targetStatus === "need_revision"
          ? `تم إرجاع المهمة للتعديل وإشعار المنفذ 🔄`
          : targetStatus === "client_approved"
          ? `تم توثيق موافقة العميل بنجاح ✅`
          : `تم تحديث حالة المهمة بنجاح`
      );
    } catch (err: any) {
      toast.error(err?.message || "تعذر إتمام الإجراء، يرجى المحاولة مرة أخرى");
    } finally {
      setBusyTaskIds((prev) => {
        const copy = { ...prev };
        delete copy[task.id];
        return copy;
      });
    }
  };

  // Quick One-Click Art Approve with Safety Lock & Default 10/10 Score
  const handleQuickApprove = async (task: Task) => {
    if (!isArtDirector) {
      toast.error("صلاحية الاعتماد الفني مخصصة للمدير الفني والإدارة فقط.");
      return;
    }
    await handleTransition(task, "art_approved", "معتمد من المدير الفني (اعتماد سريع)", 10);
  };

  // Detailed Modal Submit (Rating + Comment)
  const handleReviewModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reviewModalTask) return;
    await handleTransition(reviewModalTask, "art_approved", approvalComment, ratingScore);
    setReviewModalTask(null);
  };

  // Revision Modal Submit
  const handleRevisionModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!revisionModalTask) return;
    if (!revisionReason.trim()) {
      toast.error("يرجى كتابة ملاحظات التعديل المطلوبة للمصمم / المونتير");
      return;
    }

    const fullComment = `[نوع التعديل: ${revisionCategory}] ${revisionReason.trim()}`;
    await handleTransition(revisionModalTask, "need_revision", fullComment);
    setRevisionModalTask(null);
    setRevisionReason("");
  };

  // Client Feedback Modal Submit
  const handleClientFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clientFeedbackModalTask) return;

    await handleTransition(
      clientFeedbackModalTask,
      clientFeedbackAction,
      clientFeedbackComment.trim() || undefined
    );
    setClientFeedbackModalTask(null);
    setClientFeedbackComment("");
  };

  // Batch Approve Selected
  const handleBatchApprove = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!isArtDirector) {
      toast.error("صلاحية الاعتماد الفني مخصصة للمدير الفني فقط.");
      return;
    }

    setBatchBusy(true);
    let successCount = 0;

    for (const id of selectedTaskIds) {
      const task = tasks.find((t) => t.id === id);
      if (task && task.status === "waiting_review") {
        try {
          const res = await api<Task>(`/tasks/${task.id}/transition`, {
            method: "POST",
            body: JSON.stringify({
              status: "art_approved",
              comment: "معتمد ضمن الاعتماد الجماعي للمدير الفني",
              rating: 10,
            }),
          });
          setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
          successCount++;
        } catch {}
      }
    }

    setBatchBusy(false);
    setSelectedTaskIds([]);
    toast.success(`تم اعتماد ${successCount} مهمة بنجاح 🚀`);
  };

  // Toggle selection for batch
  const toggleSelectTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    const waitingIds = filteredTasks.filter((t) => t.status === "waiting_review").map((t) => t.id);
    if (selectedTaskIds.length === waitingIds.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(waitingIds);
    }
  };

  // Export CSV
  const exportApprovalsCSV = () => {
    const headers = ["المعرف", "عنوان المهمة", "العميل", "القسم", "المنفذ", "الحالة", "اعتماد المدير الفني", "اعتماد العميل", "الأولوية", "الموعد النهائي"];
    const rows = filteredTasks.map((t) => [
      t.id,
      `"${t.title}"`,
      `"${t.client?.name || "—"}"`,
      t.department,
      `"${t.assignee?.name || "—"}"`,
      t.status,
      t.art_director_approved_at ? "معتمد" : "قيد المراجعة",
      t.client_approved_at ? "معتمد" : "—",
      t.priority,
      t.deadline || "—",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `approvals_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل الاعتمادات بنجاح 📋");
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <SectionHeader
        eyebrow="Creative Direction & Quality Control"
        title="Art Director & Client Approval Center"
        description="المركز الموحد للمراجعة الفنية، فحص التصاميم ومخرجات المونتاج، اعتماد الجودة الإبداعية، وتوثيق موافقات العملاء قبل النشر."
        icon={CheckCheck}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportApprovalsCSV}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
            >
              <Download size={14} className="text-[#facc15]" />
              <span>تصدير السجل (CSV)</span>
            </button>

            {activeTab === "art_review" && selectedTaskIds.length > 0 && isArtDirector && (
              <button
                onClick={handleBatchApprove}
                disabled={batchBusy}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 text-xs font-black text-black shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {batchBusy ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>اعتماد المختار ({selectedTaskIds.length})</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPIs Grid */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard metric={m} index={i} key={m.key} />
        ))}
      </section>

      {/* Main Tab Navigation */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "art_review", label: "المراجعة الفنية (Art Director Review)", icon: Sparkles, count: waitingArtReviewCount + needRevisionCount },
            { id: "client_review", label: "مراجعة واعتماد العميل (Client Approval)", icon: Users, count: clientReviewCount },
            { id: "approved_archive", label: "سجل الأعمال المعتمدة (Approved Archive)", icon: ShieldCheck, count: completedApprovedCount },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id as any); setSelectedTaskIds([]); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-[#facc15] text-black font-black shadow-md shadow-[#facc15]/20"
                    : "bg-[#1c1c1f] text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-black/20 text-black font-extrabold" : "bg-white/10 text-zinc-300"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Refresh */}
        <button
          onClick={loadData}
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c1c1f] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="تحديث البيانات"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#facc15]" : ""} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="panel bg-[#141415] border border-white/7 p-4 rounded-2xl flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "art_review" && (
            <button
              onClick={toggleSelectAll}
              className="h-9 px-3 rounded-xl border border-white/8 bg-[#1c1c1f] text-xs font-bold text-zinc-300 hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <input
                type="checkbox"
                checked={selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.filter((t) => t.status === "waiting_review").length}
                onChange={() => {}}
                className="rounded accent-[#facc15] pointer-events-none"
              />
              <span>تحديد الكل للمراجعة</span>
            </button>
          )}

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
          >
            <option value="all">كافة التخصصات (الكل)</option>
            <option value="graphic_design">تصميم جرافيك (Graphic Design)</option>
            <option value="video">مونتاج وفيديو (Video Editing)</option>
            <option value="motion">موشن جرافيكس (Motion Graphics)</option>
            <option value="content">صناعة المحتوى والسكريبت (Content)</option>
            <option value="media_buying">إعلانات ممولة (Media Buying)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
          >
            <option value="all">كافة الأولويات</option>
            <option value="urgent">عاجل جداً (Urgent)</option>
            <option value="high">مرتفع (High)</option>
            <option value="medium">متوسط (Medium)</option>
            <option value="low">منخفض (Low)</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-9 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none max-w-[180px]"
          >
            <option value="all">كافة العملاء</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالعنوان، العميل، المصمم..."
            className="h-9 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="panel bg-[#141415] border border-white/7 p-12 text-center rounded-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#facc15]/10 text-[#facc15] mb-3">
            <CheckCheck size={26} />
          </div>
          <h3 className="text-sm font-bold text-white">لا توجد مهام تطابق شروط الفلترة المحددة</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {activeTab === "art_review"
              ? "رائع! قائمة المراجعة الفنية فارغة حالياً وتم اعتماد كافة الأعمال."
              : "لا توجد سجلات في هذا القسم."}
          </p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => {
            const isBusy = !!busyTaskIds[task.id];
            const isSelected = selectedTaskIds.includes(task.id);
            const isVideo = task.department === "video" || task.type?.toLowerCase().includes("video") || task.type?.toLowerCase().includes("reel");
            const isMotion = task.department === "motion";
            const isNeedsRevision = task.status === "need_revision";

            return (
              <article
                key={task.id}
                className={`panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl transition hover:border-white/20 flex flex-col justify-between relative ${
                  isSelected ? "ring-2 ring-[#facc15] bg-[#161618]" : ""
                } ${isNeedsRevision ? "border-amber-500/20" : ""}`}
              >
                {/* Visual Header / Deliverable Preview Simulation */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 soft-grid">
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl text-[#facc15] shadow-lg">
                      {isVideo ? <CirclePlay size={28} /> : isMotion ? <Layers size={28} /> : <FileImage size={28} />}
                    </span>
                  </div>

                  {/* Selection Checkbox */}
                  {activeTab === "art_review" && task.status === "waiting_review" && (
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <button
                        onClick={() => toggleSelectTask(task.id)}
                        className={`grid h-7 w-7 place-items-center rounded-lg border transition ${
                          isSelected
                            ? "bg-[#facc15] border-[#facc15] text-black"
                            : "bg-black/60 border-white/20 text-transparent hover:border-white/40"
                        }`}
                      >
                        <Check size={14} className={isSelected ? "stroke-[3]" : ""} />
                      </button>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Department & Deliverable Tag */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-lg bg-black/70 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300 backdrop-blur">
                      {task.department?.replaceAll("_", " ")}
                    </span>
                    {task.platform && (
                      <span className="rounded-lg bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30 px-2 py-0.5 text-[10px] font-extrabold backdrop-blur">
                        {task.platform}
                      </span>
                    )}
                  </div>

                  {/* Priority Tag */}
                  {task.priority === "urgent" && (
                    <div className="absolute bottom-3 right-3">
                      <span className="rounded-lg bg-rose-500/90 text-white px-2 py-0.5 text-[9.5px] font-black shadow-md flex items-center gap-1">
                        <Zap size={10} className="fill-white" />
                        عاجل
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{task.title}</h3>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          العميل: <strong className="text-zinc-200">{task.client?.name ?? "حساب عميل"}</strong>
                        </p>
                      </div>
                      <Avatar name={task.assignee?.name ?? "Designer"} size="sm" />
                    </div>

                    {/* Objective / Brief snippet */}
                    {task.objective && (
                      <p className="mt-2 text-zinc-400 text-[11.5px] line-clamp-2 leading-relaxed bg-[#19191c] p-2 rounded-xl border border-white/5">
                        {task.objective}
                      </p>
                    )}

                    {/* Revision Note Warning if in Need Revision */}
                    {isNeedsRevision && (
                      <div className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                          <RotateCcw size={12} />
                          <span>تعديل مطلوب:</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 line-clamp-2">
                          {task.approvals?.[0]?.comment || "يرجى تعديل التصميم وإعادة الرفع للمراجعة"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta Bar */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock size={13} className="text-[#facc15]" />
                        <span className="text-[11px] text-zinc-300 font-mono">
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })
                            : "بدون موعد"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-400">
                        <span>المنفذ:</span>
                        <strong className="text-zinc-200">{task.assignee?.name || "غير محدد"}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid gap-2">
                      {/* TAB 1 ACTIONS: ART DIRECTOR REVIEW */}
                      {activeTab === "art_review" && (
                        <>
                          {task.status === "waiting_review" && isArtDirector && (
                            <div className="grid grid-cols-2 gap-2">
                              {/* Quick Approve (With Double-Click Lock) */}
                              <button
                                onClick={() => handleQuickApprove(task)}
                                disabled={isBusy}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] text-xs font-black text-black transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {isBusy ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
                                <span>Approve (سريع)</span>
                              </button>

                              {/* Detailed Grade & Approve */}
                              <button
                                onClick={() => {
                                  setReviewModalTask(task);
                                  setRatingScore(10);
                                  setApprovalComment("معتمد من المدير الفني");
                                }}
                                disabled={isBusy}
                                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition disabled:opacity-50"
                              >
                                <Star size={13} className="text-[#facc15] fill-[#facc15]" />
                                <span>تقييم واعتماد</span>
                              </button>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            {task.status === "waiting_review" && isArtDirector && (
                              <button
                                onClick={() => {
                                  setRevisionModalTask(task);
                                  setRevisionReason("");
                                }}
                                disabled={isBusy}
                                className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition disabled:opacity-50"
                              >
                                <RotateCcw size={12} />
                                <span>طلب تعديل</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedTask(task)}
                              className={`inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-[#1e1e20] text-xs font-bold text-zinc-200 border border-white/10 hover:bg-white/10 transition ${
                                task.status === "waiting_review" && isArtDirector ? "" : "col-span-2"
                              }`}
                            >
                              <Eye size={13} />
                              <span>فحص ومعاينة العمل</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* TAB 2 ACTIONS: CLIENT & ACCOUNT REVIEW */}
                      {activeTab === "client_review" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setClientFeedbackModalTask(task);
                              setClientFeedbackAction("client_approved");
                              setClientFeedbackComment("تمت موافقة العميل على النشر بدون تعديلات");
                            }}
                            disabled={isBusy}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-black transition active:scale-95 disabled:opacity-50"
                          >
                            {isBusy ? <RefreshCw size={13} className="animate-spin" /> : <ThumbsUp size={14} />}
                            <span>موافقة العميل ✅</span>
                          </button>

                          <button
                            onClick={() => {
                              setClientFeedbackModalTask(task);
                              setClientFeedbackAction("need_revision");
                              setClientFeedbackComment("");
                            }}
                            disabled={isBusy}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition disabled:opacity-50"
                          >
                            <ThumbsDown size={14} />
                            <span>تعديلات العميل 🔄</span>
                          </button>
                        </div>
                      )}

                      {/* TAB 3 ACTIONS: ARCHIVE INSPECT */}
                      {activeTab === "approved_archive" && (
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 text-[#facc15] text-xs font-bold">
                            <CheckCircle2 size={14} />
                            <span>معتمد ومطابق للمعايير</span>
                          </div>
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex h-8 items-center gap-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition"
                          >
                            <Eye size={12} />
                            <span>عرض التفاصيل</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: DETAILED ART DIRECTOR REVIEW & RATING */}
      {reviewModalTask && (
        <Modal
          open={!!reviewModalTask}
          onClose={() => setReviewModalTask(null)}
          title="تقييم واعتماد العمل الفني"
          subtitle={reviewModalTask.title}
          width="max-w-md"
        >
          <form onSubmit={handleReviewModalSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#141416] border border-white/6 text-xs space-y-1">
                <span className="text-zinc-400 block">المنفذ: <strong className="text-white">{reviewModalTask.assignee?.name || "المصمم"}</strong></span>
                <span className="text-zinc-400 block">العميل: <strong className="text-zinc-200">{reviewModalTask.client?.name}</strong></span>
              </div>

              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">درجة الجودة والإتقان الفني:</label>
                <div className="flex items-center justify-between bg-[#19191c] p-3 rounded-xl border border-white/7">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingScore(star)}
                        className="transition hover:scale-125"
                      >
                        <Star
                          size={18}
                          className={star <= ratingScore ? "text-[#facc15] fill-[#facc15]" : "text-zinc-600"}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-black text-[#facc15] font-mono">{ratingScore}/10</span>
                </div>
              </div>

              <Field label="ملاحظات الاعتماد والتوجيه الفني">
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  placeholder="كلمة توجيهية أو ثناء على الإبداع..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setReviewModalTask(null)}>إلغاء</SecondaryButton>
              <PrimaryButton>
                <Check size={14} /> اعتماد العمل الفني
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: REQUEST REVISION */}
      {revisionModalTask && (
        <Modal
          open={!!revisionModalTask}
          onClose={() => setRevisionModalTask(null)}
          title="طلب تعديلات على العمل الفني"
          subtitle={revisionModalTask.title}
          width="max-w-md"
        >
          <form onSubmit={handleRevisionModalSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                سيتم تحويل حالة المهمة إلى <strong>مطلوب تعديلات (Needs Revision)</strong> وإرسال إشعار فوري للمنفذ <strong>{revisionModalTask.assignee?.name}</strong>.
              </div>

              <Field label="تصنيف التعديل">
                <select
                  value={revisionCategory}
                  onChange={(e) => setRevisionCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="visual_styling">التنسيق البصري والألوان (Visual & Colors)</option>
                  <option value="brand_guidelines">مخالفة الهوية البصرية للعميل (Brand Identity)</option>
                  <option value="typography">الأخطاء الإملائية والخطوط (Typography & Copy)</option>
                  <option value="video_pacing">توقيت وإيقاع المونتاج والموسيقى (Pacing & Audio)</option>
                  <option value="layout_composition">التكوين والنسب الذهبية (Composition & Layout)</option>
                  <option value="other">أخرى</option>
                </select>
              </Field>

              <Field label="ملاحظات التعديل المطلوبة بالتفصيل">
                <textarea
                  required
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  rows={4}
                  placeholder="يرجى توضيح النقاط الدقيقة المطلوب تعديلها من المصمم..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setRevisionModalTask(null)}>إلغاء</SecondaryButton>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <RotateCcw size={14} /> إرسال طلب التعديل
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: CLIENT FEEDBACK & APPROVAL */}
      {clientFeedbackModalTask && (
        <Modal
          open={!!clientFeedbackModalTask}
          onClose={() => setClientFeedbackModalTask(null)}
          title="تسجيل رد وموافقة العميل"
          subtitle={clientFeedbackModalTask.title}
          width="max-w-md"
        >
          <form onSubmit={handleClientFeedbackSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#141416] border border-white/6 text-xs space-y-1">
                <span className="text-zinc-400 block">العميل: <strong className="text-white">{clientFeedbackModalTask.client?.name}</strong></span>
              </div>

              <Field label="نوع استجابة العميل">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClientFeedbackAction("client_approved")}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      clientFeedbackAction === "client_approved"
                        ? "bg-emerald-500 text-black border-emerald-500 font-black"
                        : "bg-[#1c1c1f] text-zinc-400 border-white/10"
                    }`}
                  >
                    موافقة واعتماد ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientFeedbackAction("need_revision")}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      clientFeedbackAction === "need_revision"
                        ? "bg-rose-500 text-white border-rose-500 font-black"
                        : "bg-[#1c1c1f] text-zinc-400 border-white/10"
                    }`}
                  >
                    طلب تعديلات 🔄
                  </button>
                </div>
              </Field>

              <Field label="ملاحظات العميل المدونة">
                <textarea
                  value={clientFeedbackComment}
                  onChange={(e) => setClientFeedbackComment(e.target.value)}
                  rows={3}
                  placeholder="ملاحظات العميل أو تأكيد النشر..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setClientFeedbackModalTask(null)}>إلغاء</SecondaryButton>
              <PrimaryButton>
                <Check size={14} /> حفظ رد العميل
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Drawer Component */}
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={(u) => setTasks((prev) => prev.map((t) => (t.id === u.id ? u : t)))}
      />
    </div>
  );
}
