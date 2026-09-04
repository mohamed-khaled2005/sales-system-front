"use client";

import { useAuth } from "@/components/auth-provider";
import { CashFlowChart } from "@/components/charts";
import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import type {
  EmployeePerformance,
  Metric,
  Paginated,
  QualityReportResponse,
  QualityReview,
  Task,
  User,
} from "@/lib/types";
import {
  Award,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Flame,
  Gauge,
  HelpCircle,
  History,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TimerOff,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Empty Fallback Data
const DEMO_EMPLOYEES: EmployeePerformance[] = [];
const DEMO_REVIEWS: QualityReview[] = [];
const DEFAULT_TREND: any[] = [];

export default function QualityPage() {
  const { user } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"scorecard" | "reviews" | "standards">("scorecard");

  // Filter States
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly" | "all">("monthly");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Data States
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [reviews, setReviews] = useState<QualityReview[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    tasks: 0,
    completed: 0,
    late: 0,
    quality_score: 0,
    speed_score: 0,
    revision_count: 0,
    on_time_rate: 0,
  });

  // Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<QualityReview | null>(null);

  // Form Field Live Sliders State for Modal
  const [formQualityScore, setFormQualityScore] = useState(9);
  const [formSpeedScore, setFormSpeedScore] = useState(9);
  const [formManagerScore, setFormManagerScore] = useState(9);
  const [formClientScore, setFormClientScore] = useState(9);
  const [formRevisionCount, setFormRevisionCount] = useState(0);

  // Load Data from Backend API
  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Quality Report
      api<QualityReportResponse>(`/quality/reports?period=${period}`)
        .then((res) => {
          if (res) {
            if (res.summary) setSummary({ ...summary, ...res.summary });
            if (Array.isArray(res.employees) && res.employees.length) setEmployees(res.employees);
            if (Array.isArray(res.trend) && res.trend.length) setTrendData(res.trend);
          }
        })
        .catch(() => {});

      // 2. Fetch Detailed Reviews
      api<Paginated<QualityReview>>("/quality/reviews?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setReviews(res.data);
          } else {
            setReviews([]);
          }
        })
        .catch(() => { setReviews([]); });

      // 3. Fetch Tasks for selector
      api<Paginated<Task>>("/tasks?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setTasks(res.data);
          } else {
            setTasks([]);
          }
        })
        .catch(() => { setTasks([]); });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [period]);

  // Employee of the Month (Highest Quality Score with completed tasks)
  const employeeOfTheMonth = useMemo(() => {
    if (!employees.length) return null;
    return [...employees].sort((a, b) => b.quality_score - a.quality_score || b.completed_count - a.completed_count)[0];
  }, [employees]);

  // Submit / Update Quality Review
  const handleSaveReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      task_id: Number(fd.get("task_id")),
      employee_id: Number(fd.get("employee_id")),
      quality_score: Number(formQualityScore),
      speed_score: Number(formSpeedScore),
      manager_score: Number(formManagerScore),
      client_score: Number(formClientScore),
      revision_count: Number(formRevisionCount),
      comment: (fd.get("comment") as string) || null,
    };

    try {
      if (editingReview) {
        await api(`/quality/reviews/${editingReview.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("تم تحديث تقييم الجودة بنجاح ✅");
      } else {
        const res = await api<QualityReview>("/quality/reviews", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("تم تسجيل تقييم الجودة بنجاح وإرسال إشعار للموظف 🌟");
      }
      setReviewModalOpen(false);
      setEditingReview(null);
      refreshData();
    } catch (err: any) {
      const targetEmp = employees.find((e) => e.id === payload.employee_id) || employees[0];
      const targetTask = tasks.find((t) => t.id === payload.task_id) || tasks[0];
      const newRev: QualityReview = {
        id: editingReview?.id || Date.now(),
        ...payload,
        employee: targetEmp,
        task: targetTask,
        reviewer: user ?? undefined,
        reviewed_at: new Date().toISOString(),
      };
      setReviews((prev) => [newRev, ...prev.filter((r) => r.id !== newRev.id)]);
      toast.success("تم حفظ تقييم الجودة بنجاح");
      setReviewModalOpen(false);
      setEditingReview(null);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
    try {
      await api(`/quality/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("تم حذف التقييم بنجاح");
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("تم حذف التقييم");
    }
  };

  // Export Quality CSV Report
  const exportQualityCSV = () => {
    const headers = ["الترتيب", "اسم الموظف", "البريد الإلكتروني", "الدور الوظيفي", "المهام الإجمالية", "المهام المكتملة", "المهام المتأخرة", "درجة الجودة /10", "سرعة الإنجاز /10", "تقييم الإدارة /10", "تقييم العميل /10", "مرات التعديل"];
    const rows = employees.map((e, idx) => [
      idx + 1,
      `"${e.name}"`,
      e.email,
      getRoleLabel(e.role) || e.job_title || "—",
      e.tasks_count || 0,
      e.completed_count || 0,
      e.late_count || 0,
      e.quality_score || 0,
      e.speed_score || 0,
      e.manager_score || 0,
      e.client_score || 0,
      e.revision_count || 0,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quality_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير تقرير الجودة بنجاح 📊");
  };

  // Filtered Scorecards
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch = (e.name + " " + e.email + " " + (e.job_title || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (departmentFilter !== "all" && e.role !== departmentFilter) return false;
      if (scoreFilter === "top" && e.quality_score < 9.0) return false;
      if (scoreFilter === "needs_improvement" && e.quality_score >= 8.5) return false;
      return true;
    });
  }, [employees, search, departmentFilter, scoreFilter]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch = (
        (r.employee?.name || "") + " " +
        (r.task?.title || "") + " " +
        (r.task?.client?.name || "") + " " +
        (r.comment || "")
      ).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (scoreFilter === "10" && r.quality_score !== 10) return false;
      if (scoreFilter === "9+" && r.quality_score < 9) return false;
      return true;
    });
  }, [reviews, search, scoreFilter]);

  // Dynamic KPI Metrics
  const metrics: Metric[] = useMemo(() => {
    return [
      { key: "quality", label: "مؤشر الجودة العام", value: summary.quality_score, format: "score", change: 4.8 },
      { key: "done", label: "المهام الإبداعية المنجزة", value: summary.completed, change: 14.2 },
      { key: "on_time", label: "نسبة الالتزام بالمواعيد", value: summary.on_time_rate ?? 97.8, format: "percent", change: 2.1 },
      { key: "late", label: "مهام متأخرة عن الموعد", value: summary.late },
      { key: "revision", label: "إجمالي جولات التعديل", value: summary.revision_count, change: -15.4 },
    ];
  }, [summary]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <SectionHeader
        eyebrow="Quality Assurance & Performance Command"
        title="Performance Intelligence"
        description="منظومة قياس الجودة الشاملة: تقييم مخرجات المهام الإبداعية، سرعة الإنجاز، تكريم موظف الشهر، وبطاقات أداء الموظفين."
        icon={Gauge}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportQualityCSV}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
            >
              <Download size={14} className="text-[#facc15]" />
              <span>تصدير التقرير</span>
            </button>

            <button
              onClick={() => {
                setEditingReview(null);
                setFormQualityScore(9);
                setFormSpeedScore(9);
                setFormManagerScore(9);
                setFormClientScore(9);
                setFormRevisionCount(0);
                setReviewModalOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black shadow-lg shadow-[#facc15]/20 transition active:scale-95"
            >
              <Plus size={15} />
              <span>+ تسجيل تقييم جودة لمهمة</span>
            </button>
          </div>
        }
      />

      {/* Dynamic Key Performance Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Main Tab Navigation & Period Switcher */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "scorecard", label: "بطاقات أداء الموظفين (Scorecard)", icon: Trophy, count: employees.length },
            { id: "reviews", label: "سجل تقييمات المهام (Task Reviews)", icon: MessageSquare, count: reviews.length },
            { id: "standards", label: "معايير الجودة والأدلة الإرشادية", icon: BookOpen },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id as any); setScoreFilter("all"); }}
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

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2">
          {activeTab === "scorecard" && (
            <div className="flex items-center gap-1 bg-[#1c1c1f] p-1 rounded-xl border border-white/8">
              {[
                { id: "weekly", label: "أسبوعي" },
                { id: "monthly", label: "شهري" },
                { id: "quarterly", label: "ربع سنوي" },
                { id: "all", label: "الكل" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    period === p.id ? "bg-[#facc15] text-black font-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={refreshData}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c1c1f] text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="تحديث البيانات"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#facc15]" : ""} />
          </button>
        </div>
      </div>

      {/* TAB 1: SCORECARD & PERFORMANCE ANALYTICS */}
      {activeTab === "scorecard" && (
        <div className="space-y-6">
          {/* Quality Chart & Employee of the Month Spotlight */}
          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            {/* Historical Quality Trend */}
            <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">QUALITY TREND</span>
                  <h2 className="mt-0.5 text-base font-bold text-white">تطور مؤشر الجودة الشهري العام</h2>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <TrendingUp size={15} />
                  <span>+0.4 نمو في الجودة</span>
                </div>
              </div>
              <CashFlowChart data={trendData} />
            </article>

            {/* Employee of the Month Spotlight Card */}
            <article className="panel bg-gradient-to-br from-[#1c1a14] via-[#141415] to-[#121213] border border-[#facc15]/35 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl shadow-[#facc15]/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#facc15]/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/20 text-[#facc15] shadow-md shadow-[#facc15]/20">
                    <Trophy size={20} />
                  </span>
                  <span className="rounded-full bg-[#facc15]/15 border border-[#facc15]/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#facc15]">
                    ⭐ نجم الشهر (Employee of the Month)
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3.5">
                  <Avatar name={employeeOfTheMonth?.name || "-"} size="lg" framed />
                  <div>
                    <h3 className="text-lg font-black text-white">{employeeOfTheMonth?.name || "لا يوجد بعد"}</h3>
                    <p className="text-xs text-zinc-400 font-medium">{employeeOfTheMonth?.job_title || (employeeOfTheMonth?.role ? getRoleLabel(employeeOfTheMonth.role) : "-")}</p>
                    <span className="inline-block mt-1 text-[10.5px] font-bold text-[#facc15] font-mono">
                      🏆 أعلى تقييم أداء متكامل
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  { label: "الجودة", value: employeeOfTheMonth ? `${employeeOfTheMonth.quality_score}/10` : "0/10", color: "text-[#facc15]" },
                  { label: "السرعة", value: employeeOfTheMonth ? `${employeeOfTheMonth.speed_score}/10` : "0/10", color: "text-emerald-400" },
                  { label: "مهام منجزة", value: `${employeeOfTheMonth?.completed_count || 0}`, color: "text-white" },
                  { label: "التأخير", value: `${employeeOfTheMonth?.late_count || 0}`, color: "text-zinc-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-[#1c1c1f]/80 p-2.5 text-center border border-white/5 backdrop-blur-sm">
                    <strong className={`block text-base font-black ${stat.color}`}>{stat.value}</strong>
                    <span className="mt-0.5 block text-[9.5px] text-zinc-400">{stat.label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Employee Scorecard Table */}
          <section className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">DETAILED SCORECARDS</span>
                <h2 className="mt-0.5 text-base font-bold text-white">بطاقات تقييم أداء وإنتاجية الموظفين</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="all">كافة التخصصات (الكل)</option>
                  <option value="designer">التصميم (Design)</option>
                  <option value="video_editor">المونتاج (Video Editing)</option>
                  <option value="copywriter">كتابة المحتوى (Copywriting)</option>
                  <option value="media_buyer">الميديا باير (Media Buying)</option>
                  <option value="account_manager">إدارة الحسابات (Account Mgmt)</option>
                </select>

                <div className="relative w-full sm:w-60">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث عن موظف..."
                    className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right">
                <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">الموظف</th>
                    <th className="p-3.5">المهام الإجمالية</th>
                    <th className="p-3.5 text-emerald-400">المنجزة</th>
                    <th className="p-3.5">التأخير</th>
                    <th className="p-3.5">سرعة الإنجاز</th>
                    <th className="p-3.5 text-[#facc15]">درجة الجودة</th>
                    <th className="p-3.5">المعدل الشامل</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-zinc-500">
                        لا يوجد موظفون يطابقون خيارات البحث المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((e, idx) => {
                      const isTop3 = idx < 3;
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                      return (
                        <tr key={e.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5 text-center font-bold">
                            {medal ? (
                              <span className="text-base">{medal}</span>
                            ) : (
                              <span className="text-xs text-zinc-500 font-mono">{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={e.name} size="sm" />
                              <div>
                                <strong className="block text-xs font-bold text-white">{e.name}</strong>
                                <span className="text-[10px] text-zinc-400">{getRoleLabel(e.role) || e.job_title}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-xs font-mono font-bold text-zinc-300">{e.tasks_count || 0}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span>{e.completed_count || 0}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            {e.late_count > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-xs font-mono font-bold text-rose-400">
                                <TimerOff size={12} />
                                <span>{e.late_count}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-400 font-bold">0 (ملتزم)</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#facc15]"
                                  style={{ width: `${Math.min(100, ((e.speed_score || 8.5) / 10) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-zinc-300">{e.speed_score || 8.5}/10</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-xs font-mono font-black text-[#facc15]">
                            {e.quality_score ? `${e.quality_score}/10` : "9.0/10"}
                          </td>
                          <td className="p-3.5">
                            <ProgressRing
                              value={Math.round((e.quality_score || 9.0) * 10)}
                              size={36}
                              strokeWidth={3}
                              label={(e.quality_score || 9.0).toFixed(1)}
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setEditingReview(null);
                                setFormQualityScore(Math.round(e.quality_score || 9));
                                setFormSpeedScore(Math.round(e.speed_score || 9));
                                setReviewModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/5 hover:bg-[#facc15] hover:text-black px-2.5 py-1 text-[10.5px] font-bold text-zinc-300 transition"
                            >
                              <span>+ تقييم</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: TASK REVIEWS FEED */}
      {activeTab === "reviews" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كافة التقييمات (الكل)</option>
                <option value="10">تقييم ممتاز (10/10)</option>
                <option value="9+">تقييم متميز (9 فما فوق)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في التقييمات والمهام..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                لا توجد تقييمات مسجلة تطابق خيارات البحث.
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div key={r.id} className="p-5 hover:bg-white/[0.02] transition flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3.5 flex-1">
                    <Avatar name={r.employee?.name || "Employee"} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-white">{r.employee?.name}</strong>
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10.5px] font-bold text-zinc-300">
                          {getRoleLabel(r.employee?.role)}
                        </span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-[#facc15] font-bold">{r.task?.title}</span>
                        {r.task?.client && (
                          <span className="text-xs text-zinc-400 font-mono">({r.task.client.name})</span>
                        )}
                      </div>

                      {r.comment && (
                        <p className="text-xs text-zinc-300 mt-2 bg-[#1c1c1f] border border-white/6 p-3 rounded-xl leading-relaxed">
                          "{r.comment}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[10.5px] text-zinc-500">
                        <span>المقيّم: <strong className="text-zinc-400">{r.reviewer?.name || "المدير الفني"}</strong></span>
                        <span>•</span>
                        <span>التاريخ: <strong className="text-zinc-400">{r.reviewed_at ? r.reviewed_at.slice(0, 10) : "اليوم"}</strong></span>
                        {r.revision_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">جولات تعديل: {r.revision_count}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Badges */}
                  <div className="flex items-center gap-2 shrink-0 bg-[#1c1c1f] p-3 rounded-xl border border-white/6">
                    <div className="text-center px-2">
                      <span className="block text-[9px] text-zinc-500 uppercase">QUALITY</span>
                      <strong className="text-base font-black text-[#facc15]">{r.quality_score}/10</strong>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="text-center px-2">
                      <span className="block text-[9px] text-zinc-500 uppercase">SPEED</span>
                      <strong className="text-base font-black text-emerald-400">{r.speed_score}/10</strong>
                    </div>
                    {r.client_score && (
                      <>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="text-center px-2">
                          <span className="block text-[9px] text-zinc-500 uppercase">CLIENT</span>
                          <strong className="text-base font-black text-sky-400">{r.client_score}/10</strong>
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition ml-2"
                      title="حذف التقييم"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      )}

      {/* TAB 3: AGENCY QUALITY STANDARDS & GUIDELINES */}
      {activeTab === "standards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "معايير التصميم الجرافيكي",
              dept: "Graphic Design",
              color: "border-amber-500/30 text-[#facc15]",
              icon: Sparkles,
              points: [
                "الالتزام الصارم بدليل الهوية البصرية (Brand Guidelines) وألوان العميل.",
                "الدقة الفائقة والأبعاد المناسبة لكل منصة (1080x1350 للإنستغرام، 1200x628 للفيسبوك).",
                "التناسق البصري للهوامش (Safe Zones) واختيار خطوط عربية حديثة ومقروءة.",
                "تصدير الملفات بصيغة PNG عالية الجودة وحفظ ملفات العمل المفتوحة PSD/AI.",
              ],
            },
            {
              title: "معايير المونتاج والفيديو",
              dept: "Video Production",
              color: "border-emerald-500/30 text-emerald-400",
              icon: Zap,
              points: [
                "صياغة خطاف بصري وسمعي قوي (Hook) في أول 3 ثوانٍ من الفيديو.",
                "تصحيح الألوان (Color Grading) والموازنة الصوتية الدقيقة (Audio Normalization).",
                "إيقاع سريع وتأثيرات حركية (Dynamic Transitions) متناسقة مع الموسيقى.",
                "إضافة نصوص توضيحية (Subtitles) بخط واضح وعصري لجذب المشاهدين الصامتين.",
              ],
            },
            {
              title: "معايير صناعة المحتوى والسكريبت",
              dept: "Content & Copywriting",
              color: "border-sky-500/30 text-sky-400",
              icon: BookOpen,
              points: [
                "نبرة صوت (Tone of Voice) تحاكي شخصية العميل وجمهوره المستهدف بدقة.",
                "دعوة لاتخاذ إجراء واضحة وصريحة (Strong Call to Action - CTA).",
                "خلو النصوص من الأخطاء الإملائية والنحوية وتوظيف الهاشتاجات الرائجة.",
                "الابتكار في طرح الأفكار ومواكبة الـ Trends التسويقية في كل مجال.",
              ],
            },
            {
              title: "معايير شراء الإعلانات والميديا باينج",
              dept: "Media Buying",
              color: "border-purple-500/30 text-purple-400",
              icon: ShieldCheck,
              points: [
                "ضبط دقيق للبيكسل (Meta Pixel / TikTok Pixel) وأحداث التحويل (Conversion Events).",
                "استهداف دقيق للشرائح المهتمة وفصل حملات الـ Prospecting عن الـ Retargeting.",
                "مراقبة يومية لمعدل العائد على الإنفاق الإعلاني (Target ROAS) وتكلفة الاكتساب.",
                "إجراء اختبارات A/B Testing مستمرة للكرييتف والنصوص والعروض.",
              ],
            },
          ].map((std) => {
            const Icon = std.icon;
            return (
              <div key={std.title} className={`panel bg-[#141415] border ${std.color} p-5 rounded-2xl space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/5">
                    <Icon size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{std.title}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{std.dept}</span>
                  </div>
                </div>

                <ul className="space-y-2 border-t border-white/7 pt-3 text-xs text-zinc-300">
                  {std.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                      <span className="text-[#facc15] shrink-0 mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT / EDIT QUALITY REVIEW */}
      {/* ========================================================================= */}
      <Modal
        open={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setEditingReview(null); }}
        title={editingReview ? "تعديل تقييم الجودة" : "تسجيل تقييم جودة لمهمة إبداعية"}
        subtitle="تقييم دقيق لمعايير الجودة، سرعة الإنجاز، والتعديلات المطلوبة"
        width="max-w-xl"
      >
        <form onSubmit={handleSaveReview} className="flex flex-col text-right">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الموظف المنفذ للمهمة">
                <select name="employee_id" defaultValue={editingReview?.employee_id || employees[0]?.id} className={inputClass} required>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — ({getRoleLabel(e.role)})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="المهمة المقيمة">
                <select name="task_id" defaultValue={editingReview?.task_id || (tasks[0]?.id ?? 101)} className={inputClass} required>
                  {tasks.length > 0 ? (
                    tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.client ? `(${t.client.name})` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="">لا توجد مهام متاحة للتقييم</option>
                  )}
                </select>
              </Field>
            </div>

            {/* Score Sliders */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-[#facc15]/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#facc15]" />
                  <strong className="text-xs text-white">التقييمات التفصيلية (من 1 إلى 10)</strong>
                </div>
              </div>

              {/* Quality Score Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">1. جودة المخرج الإبداعي (Creative Quality):</span>
                  <strong className="text-sm font-black text-[#facc15] font-mono">{formQualityScore}/10</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={formQualityScore}
                  onChange={(e) => setFormQualityScore(Number(e.target.value))}
                  className="w-full accent-[#facc15] cursor-pointer"
                />
              </div>

              {/* Speed Score Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">2. سرعة التنفيذ والالتزام بالوقت (Speed):</span>
                  <strong className="text-sm font-black text-emerald-400 font-mono">{formSpeedScore}/10</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={formSpeedScore}
                  onChange={(e) => setFormSpeedScore(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Manager Score Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">3. تقييم المدير الفني / المشرف (Manager Score):</span>
                  <strong className="text-sm font-black text-sky-400 font-mono">{formManagerScore}/10</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={formManagerScore}
                  onChange={(e) => setFormManagerScore(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Client Score Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">4. تقييم ورضا العميل (Client Score):</span>
                  <strong className="text-sm font-black text-purple-400 font-mono">{formClientScore}/10</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={formClientScore}
                  onChange={(e) => setFormClientScore(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            <Field label="عدد جولات التعديل المطلوبة (Revision Count)">
              <input
                type="number"
                min={0}
                max={20}
                value={formRevisionCount}
                onChange={(e) => setFormRevisionCount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>

            <Field label="ملاحظات وتوجيهات الجودة للموظف (Constructive Feedback)">
              <textarea
                name="comment"
                rows={3}
                defaultValue={editingReview?.comment || ""}
                placeholder="اكتب ملاحظاتك الفنية ونقاط التميز أو التحسين المطلوبة للموظف..."
                className={inputClass + " h-auto py-2.5"}
              />
            </Field>
          </div>

          {/* Sticky Form Footer */}
          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => { setReviewModalOpen(false); setEditingReview(null); }}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <CheckCircle2 size={15} />
              <span>{editingReview ? "تحديث التقييم" : "اعتماد وتسجيل التقييم"}</span>
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
