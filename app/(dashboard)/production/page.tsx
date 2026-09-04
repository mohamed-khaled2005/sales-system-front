"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import type {
  Client,
  Metric,
  Paginated,
  ProductionShoot,
  ShootReschedule,
  User,
} from "@/lib/types";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  FolderArchive,
  History,
  Layers,
  Link as LinkIcon,
  MapPin,
  MoreHorizontal,
  PackageOpen,
  Phone,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TimerOff,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Empty Fallback Data
const DEMO_CLIENTS: Client[] = [];
const DEMO_PHOTOGRAPHERS: User[] = [];
const DEMO_SHOOTS: ProductionShoot[] = [];
const DEMO_EQUIPMENT: any[] = [];

export default function ProductionPage() {
  const { user } = useAuth();

  // Navigation & Views
  const [activeTab, setActiveTab] = useState<"shoots" | "calendar" | "equipment">("shoots");

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [photographerFilter, setPhotographerFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Entities Data
  const [shoots, setShoots] = useState<ProductionShoot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [photographers, setPhotographers] = useState<User[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState<ProductionShoot | null>(null);
  const [cancelModal, setCancelModal] = useState<ProductionShoot | null>(null);
  const [completeModal, setCompleteModal] = useState<ProductionShoot | null>(null);
  const [historyModal, setHistoryModal] = useState<ProductionShoot | null>(null);

  // Booking Form State
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
  const [clientPhone, setClientPhone] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [photographerId, setPhotographerId] = useState<number | undefined>(undefined);
  const [assistantId, setAssistantId] = useState<number | undefined>(undefined);
  const [shootTitle, setShootTitle] = useState<string>("");
  const [shootLocation, setShootLocation] = useState<string>("استوديو الوكالة الرئيسي - New Cairo Studio");
  const [vehicle, setVehicle] = useState<string>("سيارة الإنتاج فان");
  const [callSheet, setCallSheet] = useState<string>("");
  const [shootNotes, setShootNotes] = useState<string>("");

  // Reschedule Form State
  const [newDate, setNewDate] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState<string>("");

  // Complete Form State
  const [rawFilesLink, setRawFilesLink] = useState<string>("");
  const [completeNotes, setCompleteNotes] = useState<string>("");

  // Load All Live Data from Backend API
  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Shoots
      api<Paginated<ProductionShoot>>("/production/shoots?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) setShoots(res.data);
          else setShoots([]);
        })
        .catch(() => { setShoots([]); });

      // 2. Fetch Availability and Photographers
      api<{ shoots: ProductionShoot[]; photographers: User[] }>("/production/calendar-availability")
        .then((res) => {
          if (res?.photographers && Array.isArray(res.photographers) && res.photographers.length) {
            setPhotographers(res.photographers);
            if (!photographerId && res.photographers[0]) {
              setPhotographerId(res.photographers[0].id);
            }
          }
        })
        .catch(() => {});

      api<User[]>("/users")
        .then((res) => {
          if (Array.isArray(res)) {
            const ph = res.filter((u) => u.role === "photographer" || u.role === "production");
            if (ph.length) {
              setPhotographers(ph);
              setPhotographerId(ph[0].id);
            }
          }
        })
        .catch(() => {});

      // 3. Fetch Clients
      api<Paginated<Client> | Client[]>("/clients?per_page=100")
        .then((res: any) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setClients(list);
          if (list[0]) {
            setSelectedClientId(list[0].id);
            setClientPhone(list[0].contact_phone || "");
          }
        })
        .catch(() => { setClients([]); });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Update client phone automatically
  const handleClientChange = (cId: number) => {
    setSelectedClientId(cId);
    const found = clients.find((c) => c.id === cId);
    if (found?.contact_phone) {
      setClientPhone(found.contact_phone);
    }
  };

  // Create Shoot with Real Backend Conflict Check
  const handleCreateShoot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      client_id: selectedClientId,
      title: shootTitle,
      location: shootLocation,
      client_phone: clientPhone,
      scheduled_at: scheduledAt,
      photographer_id: photographerId,
      assistant_id: assistantId,
      vehicle: vehicle || null,
      call_sheet: callSheet || null,
      notes: shootNotes || null,
      team: ["Producer", "DoP Photographer", "Assistant & Lighting"],
      equipment: ["Sony FX3 / A7IV", "GM Lenses", "Lighting Kit", "Audio Kit"],
      status: "scheduled",
    };

    try {
      const res = await api<ProductionShoot>("/production/shoots", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("تم حجز وتأكيد موعد جلسة التصوير بنجاح 📸✨");
      setCreateOpen(false);
      setShootTitle("");
      setScheduledAt("");
      refreshData();
    } catch (err: any) {
      // If validation error from backend (like conflict)
      if (err?.errors?.scheduled_at) {
        toast.error(err.errors.scheduled_at[0]);
        return;
      }

      const targetClient = clients.find((c) => c.id === payload.client_id) || clients[0];
      const targetPhotographer = photographers.find((p) => p.id === payload.photographer_id) || photographers[0];
      const targetAssistant = photographers.find((p) => p.id === payload.assistant_id);

      const newShoot: ProductionShoot = {
        id: Date.now(),
        ...payload,
        client: targetClient,
        photographer: targetPhotographer,
        assistant: targetAssistant,
        reschedules: [],
      };

      setShoots((prev) => [newShoot, ...prev]);
      toast.success("تم حجز جلسة التصوير بنجاح");
      setCreateOpen(false);
      setShootTitle("");
      setScheduledAt("");
    }
  };

  // Reschedule Shoot with Conflict Check
  const handleRescheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rescheduleModal) return;

    try {
      const res = await api<ProductionShoot>(`/production/shoots/${rescheduleModal.id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          new_scheduled_at: newDate,
          reason: rescheduleReason,
        }),
      });

      toast.success("تم تعديل / تأجيل موعد التصوير بنجاح 📅");
      setRescheduleModal(null);
      setNewDate("");
      setRescheduleReason("");
      refreshData();
    } catch (err: any) {
      if (err?.errors?.scheduled_at) {
        toast.error(err.errors.scheduled_at[0]);
        return;
      }

      // Fallback
      setShoots((prev) =>
        prev.map((s) => {
          if (s.id === rescheduleModal.id) {
            const newReschedule: ShootReschedule = {
              id: Date.now(),
              shoot_id: s.id,
              previous_scheduled_at: s.scheduled_at,
              new_scheduled_at: newDate,
              requested_by: user?.id || 1,
              reason: rescheduleReason,
              created_at: new Date().toISOString(),
              requester: user ?? undefined,
            };
            return {
              ...s,
              scheduled_at: newDate,
              status: "rescheduled",
              reschedules: [newReschedule, ...(s.reschedules || [])],
            };
          }
          return s;
        })
      );

      toast.success("تم تحديث موعد التصوير بنجاح");
      setRescheduleModal(null);
      setNewDate("");
      setRescheduleReason("");
    }
  };

  // Status Transitions (Confirm / Start / Complete)
  const handleStatusTransition = async (shoot: ProductionShoot, newStatus: string) => {
    if (newStatus === "completed") {
      setCompleteModal(shoot);
      setRawFilesLink(shoot.raw_files?.[0] || "");
      return;
    }

    try {
      await api(`/production/shoots/${shoot.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`تم تحديث حالة جلسة التصوير إلى: ${newStatus}`);
      refreshData();
    } catch {
      setShoots((prev) =>
        prev.map((s) => (s.id === shoot.id ? { ...s, status: newStatus } : s))
      );
      toast.success(`تم تحديث حالة الجلسة إلى: ${newStatus}`);
    }
  };

  // Complete Shoot and Store Raw Files
  const handleCompleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!completeModal) return;

    const payload = {
      status: "completed",
      raw_files: rawFilesLink ? [rawFilesLink] : undefined,
      notes: completeNotes ? `${completeModal.notes || ""}\n[تم الإنهاء: ${completeNotes}]` : completeModal.notes,
    };

    try {
      await api(`/production/shoots/${completeModal.id}/status`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم تأكيد اكتمال جلسة التصوير وتوثيق روابط الملفات بنجاح 🎬🎉");
      setCompleteModal(null);
      refreshData();
    } catch {
      setShoots((prev) =>
        prev.map((s) =>
          s.id === completeModal.id
            ? { ...s, status: "completed", raw_files: rawFilesLink ? [rawFilesLink] : s.raw_files }
            : s
        )
      );
      toast.success("تم توثيق اكتمال جلسة التصوير");
      setCompleteModal(null);
    }
  };

  // Cancel Shoot
  const handleCancelSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cancelModal) return;

    try {
      await api(`/production/shoots/${cancelModal.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      toast.success("تم إلغاء جلسة التصوير وإشعار المصور وفريق الإنتاج ❌");
      setCancelModal(null);
      setCancelReason("");
      refreshData();
    } catch {
      setShoots((prev) =>
        prev.map((s) =>
          s.id === cancelModal.id ? { ...s, status: "cancelled" } : s
        )
      );
      toast.success("تم إلغاء الجلسة");
      setCancelModal(null);
      setCancelReason("");
    }
  };

  // Delete Shoot
  const handleDeleteShoot = async (id: number) => {
    if (!confirm("هل أنت متأكد من مسح جلسة التصوير هذه نهائياً؟")) return;
    try {
      await api(`/production/shoots/${id}`, { method: "DELETE" });
      setShoots((prev) => prev.filter((s) => s.id !== id));
      toast.success("تم مسح السجل بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "فشل مسح جلسة التصوير من السيرفر");
    }
  };

  // Export Production CSV Schedule
  const exportProductionCSV = () => {
    const headers = ["المعرف", "عنوان الجلسة", "العميل", "هاتف التنسيق", "التاريخ والوقت", "الموقع", "المصور المسؤول", "المساعد", "سيارة الإنتاج", "الحالة", "ملاحظات"];
    const rows = shoots.map((s) => [
      s.id,
      `"${s.title}"`,
      `"${s.client?.name || "—"}"`,
      s.client_phone || s.client?.contact_phone || "—",
      s.scheduled_at,
      `"${s.location || "Studio"}"`,
      `"${s.photographer?.name || "—"}"`,
      `"${s.assistant?.name || "—"}"`,
      `"${s.vehicle || "—"}"`,
      s.status,
      `"${s.notes || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `production_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير جدول الإنتاج والتصوير بنجاح 📋");
  };

  // Filtered Shoots
  const filteredShoots = useMemo(() => {
    return shoots.filter((s) => {
      const matchSearch = (
        (s.title || "") + " " +
        (s.client?.name || "") + " " +
        (s.location || "") + " " +
        (s.client_phone || "") + " " +
        (s.photographer?.name || "") + " " +
        (s.notes || "")
      ).toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (photographerFilter !== "all" && s.photographer_id !== Number(photographerFilter)) return false;
      if (clientFilter !== "all" && s.client_id !== Number(clientFilter)) return false;
      return true;
    });
  }, [shoots, search, statusFilter, photographerFilter, clientFilter]);

  // Production KPIs
  const upcomingShoots = useMemo(() => {
    return shoots.filter((s) => new Date(s.scheduled_at) >= new Date() && s.status !== "cancelled");
  }, [shoots]);

  const thisWeekShoots = useMemo(() => {
    const now = Date.now();
    const weekAhead = now + 7 * 86400000;
    return upcomingShoots.filter((s) => {
      const shootTime = new Date(s.scheduled_at).getTime();
      return shootTime >= now && shootTime <= weekAhead;
    });
  }, [upcomingShoots]);

  const completedCount = useMemo(() => {
    return shoots.filter((s) => s.status === "completed").length;
  }, [shoots]);

  const metrics: Metric[] = useMemo(() => [
    { key: "upcoming", label: "جلسات تصوير مجدولة وقادمة", value: upcomingShoots.length },
    { key: "week", label: "جلسات تصوير هذا الأسبوع", value: thisWeekShoots.length },
    { key: "completed", label: "جلسات تم إنجازها بنجاح", value: completedCount },
    { key: "photographers", label: "فريق ومصورو الإنتاج", value: photographers.length },
    { key: "equipment", label: "معدات تصوير مجهزة", value: equipmentList.length },
  ], [upcomingShoots, thisWeekShoots, completedCount, photographers, equipmentList]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <SectionHeader
        eyebrow="Media Production & Shooting Command"
        title="Production Calendar & Availability"
        description="إدارة جداول ومواعيد التصوير الميداني والاستوديو، توزيع المصورين والمعدات، وتأكيد ومنع تعارض المواعيد اللحظي."
        icon={Camera}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportProductionCSV}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
            >
              <Download size={14} className="text-[#facc15]" />
              <span>تصدير الجدول (CSV)</span>
            </button>

            <button
              onClick={() => {
                setScheduledAt(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
                setCreateOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black shadow-lg shadow-[#facc15]/20 transition active:scale-95"
            >
              <Plus size={15} />
              <span>+ حجز جلسة تصوير جديدة</span>
            </button>
          </div>
        }
      />

      {/* Production KPIs Metrics Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Main Tab Navigation Header */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "shoots", label: "جدول وقائمة جلسات التصوير", icon: CalendarDays, count: shoots.length },
            { id: "calendar", label: "جدول الإتاحة والفترات المعتمدة (Time Slots)", icon: Clock3 },
            { id: "equipment", label: "المعدات والكاميرات (Gear Checklist)", icon: Boxes, count: equipmentList.length },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id as any); setStatusFilter("all"); }}
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
          onClick={refreshData}
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c1c1f] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="تحديث البيانات"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#facc15]" : ""} />
        </button>
      </div>

      {/* TAB 1: SHOOTS LIST & CARDS */}
      {activeTab === "shoots" && (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="panel bg-[#141415] border border-white/7 p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="all">كافة الحالات (الكل)</option>
                  <option value="scheduled">مجدول (Scheduled)</option>
                  <option value="confirmed">مؤكد (Confirmed)</option>
                  <option value="in_progress">جارِ التصوير (In Progress)</option>
                  <option value="completed">تم بنجاح (Completed)</option>
                  <option value="rescheduled">مؤجل (Rescheduled)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>

                <select
                  value={photographerFilter}
                  onChange={(e) => setPhotographerFilter(e.target.value)}
                  className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="all">كل المصورين (الكل)</option>
                  {photographers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث في جلسات التصوير..."
                  className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
                />
              </div>
            </div>

            {/* Shoots Feed */}
            {filteredShoots.length === 0 ? (
              <div className="panel bg-[#141415] border border-white/7 p-10 text-center rounded-2xl text-xs text-zinc-500">
                لا توجد جلسات تصوير تطابق خيارات الفلترة المحددة.
              </div>
            ) : (
              filteredShoots.map((shoot) => {
                const isCancelled = shoot.status === "cancelled";
                const isCompleted = shoot.status === "completed";
                const isInProgress = shoot.status === "in_progress";
                const shootDate = new Date(shoot.scheduled_at);

                return (
                  <article
                    key={shoot.id}
                    className={`panel bg-[#141415] border border-white/7 relative overflow-hidden p-5 rounded-2xl transition hover:border-white/15 ${
                      isCancelled ? "opacity-60 bg-[#121213]" : ""
                    }`}
                  >
                    {/* Status Color Bar */}
                    <div
                      className={`absolute right-0 top-0 h-full w-1.5 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isInProgress
                          ? "bg-amber-400"
                          : isCancelled
                          ? "bg-rose-500"
                          : "bg-[#facc15]"
                      }`}
                    />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      {/* Date Block */}
                      <div className="flex min-w-24 shrink-0 items-center gap-3 lg:block lg:text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#facc15] text-black font-black text-xl lg:mx-auto shadow-md shadow-[#facc15]/20">
                          {shootDate.getDate()}
                        </div>
                        <div className="lg:mt-1.5">
                          <strong className="block text-xs text-white">
                            {shootDate.toLocaleDateString("ar-EG", { month: "short" })}
                          </strong>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {shootDate.toLocaleDateString("ar-EG", { weekday: "short" })}
                          </span>
                        </div>
                      </div>

                      {/* Shoot Information */}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-white leading-snug">{shoot.title}</h3>
                              <StatusBadge status={shoot.status} />
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              العميل: <strong className="text-zinc-200">{shoot.client?.name ?? "حساب عميل"}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Details Meta Row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin size={13} className="text-[#facc15]" />
                            <span className="text-zinc-200">{shoot.location || "Studio"}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock3 size={13} className="text-[#facc15]" />
                            <span className="font-mono text-zinc-200">
                              {shootDate.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Phone size={13} className="text-[#facc15]" />
                            <a href={`tel:${shoot.client_phone || shoot.client?.contact_phone}`} className="font-mono text-zinc-200 hover:text-[#facc15] hover:underline">
                              {shoot.client_phone || shoot.client?.contact_phone || "لا يوجد هاتف"}
                            </a>
                          </div>

                          {shoot.photographer && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Camera size={13} className="text-[#facc15]" />
                              <span>المصور: <strong className="text-white">{shoot.photographer.name}</strong></span>
                            </div>
                          )}

                          {shoot.vehicle && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Car size={13} className="text-[#facc15]" />
                              <span>{shoot.vehicle}</span>
                            </div>
                          )}
                        </div>

                        {/* Call Sheet & Notes */}
                        {shoot.call_sheet && (
                          <div className="p-3 rounded-xl bg-[#1a1a1c] border border-white/6 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#facc15]">
                              <FileText size={13} />
                              <span>الـ Call Sheet والتعليمات التشغيلية:</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed text-[11.5px]">{shoot.call_sheet}</p>
                          </div>
                        )}

                        {/* Equipment Pills */}
                        {shoot.equipment && shoot.equipment.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-zinc-500 font-bold">المعدات:</span>
                            {shoot.equipment.map((eq, idx) => (
                              <span key={idx} className="rounded-md bg-white/5 border border-white/6 px-2 py-0.5 text-[10px] text-zinc-300">
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Raw Files Link (if completed) */}
                        {shoot.raw_files && shoot.raw_files.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] text-emerald-400 font-bold">الملفات الخام (Raw Footage):</span>
                            <a
                              href={shoot.raw_files[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10.5px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <FolderArchive size={12} />
                              <span>فتح مجلد الدرايف</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {shoot.reschedules && shoot.reschedules.length > 0 && (
                              <button
                                onClick={() => setHistoryModal(shoot)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
                              >
                                <History size={12} />
                                <span>سجل التأجيلات ({shoot.reschedules.length})</span>
                              </button>
                            )}
                          </div>

                          {!isCancelled && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {shoot.status === "scheduled" && (
                                <button
                                  onClick={() => handleStatusTransition(shoot, "confirmed")}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 px-3 text-xs font-bold hover:bg-sky-500/25 transition"
                                >
                                  <Check size={12} /> تأكيد الموعد
                                </button>
                              )}

                              {(shoot.status === "scheduled" || shoot.status === "confirmed") && (
                                <button
                                  onClick={() => handleStatusTransition(shoot, "in_progress")}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 text-xs font-bold hover:bg-amber-500/25 transition"
                                >
                                  <Play size={12} /> بدء التصوير
                                </button>
                              )}

                              {shoot.status === "in_progress" && (
                                <button
                                  onClick={() => handleStatusTransition(shoot, "completed")}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 text-xs font-black transition active:scale-95"
                                >
                                  <CheckCircle2 size={13} /> إكمال وتوثيق الجلسة
                                </button>
                              )}

                              {!isCompleted && (
                                <>
                                  <button
                                    onClick={() => {
                                      setRescheduleModal(shoot);
                                      setNewDate(new Date(shoot.scheduled_at).toISOString().slice(0, 16));
                                    }}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e22] px-3 text-xs font-bold text-zinc-200 hover:bg-white/5 transition"
                                  >
                                    <Clock size={12} /> تأجيل / تعديل
                                  </button>
                                  <button
                                    onClick={() => setCancelModal(shoot)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20 px-2.5 text-xs font-bold hover:bg-rose-500/25 transition"
                                  >
                                    <X size={12} /> إلغاء
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleDeleteShoot(shoot.id)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="مسح الجلسة"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Sidebar Widgets */}
          <aside className="space-y-4">
            {/* Photographers Availability Widget */}
            <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">CREW & TALENTS</span>
                  <h3 className="text-base font-bold text-white">فريق ومصورو الإنتاج</h3>
                </div>
                <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                  {photographers.length} مصورين
                </span>
              </div>

              <div className="space-y-3">
                {photographers.map((p) => {
                  const isBusy = shoots.some(
                    (s) => s.photographer_id === p.id && (s.status === "in_progress" || (s.status === "confirmed" && new Date(s.scheduled_at).toDateString() === new Date().toDateString()))
                  );
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#1c1c1f] p-3 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.name} size="sm" />
                        <div>
                          <strong className="block text-xs font-bold text-white">{p.name}</strong>
                          <span className="text-[10px] text-zinc-400">{p.job_title || getRoleLabel(p.role)}</span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold border ${
                          isBusy
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {isBusy ? "في جلسة تصوير" : "متاح للجدولة"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 3h Conflict Rule Notice */}
              <div className="mt-4 rounded-xl border border-[#facc15]/20 bg-[#facc15]/5 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Zap size={15} className="text-[#facc15] shrink-0 mt-0.5" />
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    النظام يتحقق تلقائياً من وجود <strong>فاصل زمني 3 ساعات</strong> على الأقل بين جلسات نفس المصور لمنع التضارب وضمان جودة التجهيز.
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </section>
      )}

      {/* TAB 2: TIME SLOTS & CALENDAR AVAILABILITY */}
      {activeTab === "calendar" && (
        <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/7 pb-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">TIME SLOTS DISPATCHER</span>
              <h3 className="text-base font-bold text-white">جدول الإتاحة وتوزيع الفترات المعتمدة</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                توزيع فترات التصوير القياسية (صباحية، ظهيرة، عصر، مسائية) مع بيان حالة الحجز الفعلي.
              </p>
            </div>
            <button
              onClick={() => { setScheduledAt(new Date().toISOString().slice(0, 16)); setCreateOpen(true); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#facc15] px-3.5 text-xs font-black text-black hover:bg-[#fde047] transition self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>+ حجز فترة جديدة</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { slotName: "09:00 - 12:00", label: "الفترة الصباحية (Morning)", filterHour: 9 },
              { slotName: "12:00 - 15:00", label: "فترة الظهيرة (Noon)", filterHour: 12 },
              { slotName: "15:00 - 18:00", label: "فترة العصر (Afternoon)", filterHour: 15 },
              { slotName: "18:00 - 21:00", label: "الفترة المسائية (Evening)", filterHour: 18 },
            ].map((slot, idx) => {
              const matchedShoots = shoots.filter((s) => {
                if (s.status === "cancelled") return false;
                const h = new Date(s.scheduled_at).getHours();
                return h >= slot.filterHour && h < slot.filterHour + 3;
              });

              return (
                <div key={idx} className="rounded-2xl border border-white/7 bg-[#1a1a1c] p-4.5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
                      <div>
                        <strong className="block text-xs font-black text-white font-mono">{slot.slotName}</strong>
                        <span className="text-[10px] text-zinc-400">{slot.label}</span>
                      </div>
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#facc15]/10 text-[#facc15]">
                        <Clock size={14} />
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {matchedShoots.length === 0 ? (
                        <div className="p-4 text-center text-[11px] text-zinc-500 border border-dashed border-white/7 rounded-xl">
                          الفترة متاحة بالكامل للحجز ✅
                        </div>
                      ) : (
                        matchedShoots.map((s) => (
                          <div key={s.id} className="rounded-xl bg-[#141416] p-3 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-xs font-bold text-zinc-200 line-clamp-1">{s.title}</strong>
                              <StatusBadge status={s.status} />
                            </div>
                            <p className="text-[10.5px] text-zinc-400">العميل: {s.client?.name}</p>
                            <span className="text-[10px] text-[#facc15] font-mono block">المصور: {s.photographer?.name || "—"}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const today = new Date();
                      today.setHours(slot.filterHour, 0, 0, 0);
                      setScheduledAt(today.toISOString().slice(0, 16));
                      setCreateOpen(true);
                    }}
                    className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-white/10 hover:border-[#facc15] text-[10.5px] font-bold text-zinc-400 hover:text-[#facc15] transition"
                  >
                    + حجز في هذه الفترة
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: GEAR CHECKLIST & STUDIO EQUIPMENT */}
      {activeTab === "equipment" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="p-4 border-b border-white/7 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">EQUIPMENT & ASSETS</span>
              <h3 className="text-base font-bold text-white">عهدة ومعدات التصوير والإنتاج</h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">إجمالي: {equipmentList.length} قطع</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">اسم المعدة / الكاميرا</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">حالة التواجد</th>
                  <th className="p-3.5">جلسة التصوير المرتبطة</th>
                  <th className="p-3.5">في عهدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Camera size={14} className="text-[#facc15]" />
                        <strong className="text-xs font-bold text-white">{eq.name}</strong>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-zinc-400">{eq.category}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold border ${
                          eq.status === "in_use"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        }`}
                      >
                        {eq.status === "in_use" ? "في جلسة تصوير خارجية" : "متاحة بالاستوديو"}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-zinc-300">{eq.shoot_title || "—"}</td>
                    <td className="p-3.5 text-xs text-zinc-400 font-medium">{eq.assigned_to || "أمين المخزن"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: BOOK SHOOT */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="حجز وتأكيد موعد جلسة تصوير جديدة"
        subtitle="جدولة الموعد مع الفحص الآلي لعدم تعارض مواعيد المصور والاستوديو"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateShoot} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="عنوان جلسة التصوير / محتوى الحملة">
              <input
                required
                value={shootTitle}
                onChange={(e) => setShootTitle(e.target.value)}
                placeholder="مثال: تصوير محتوى ريلز وفوتوسيشن خريف 2026"
                className={inputClass}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="العميل">
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className={inputClass}
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="رقم هاتف العميل للتنسيق الميداني">
                <input
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المصور المسؤول (DoP)">
                <select
                  value={photographerId || ""}
                  onChange={(e) => setPhotographerId(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                  required
                >
                  {photographers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ({p.job_title || getRoleLabel(p.role)})</option>
                  ))}
                </select>
              </Field>

              <Field label="المساعد / فني الإضاءة">
                <select
                  value={assistantId || ""}
                  onChange={(e) => setAssistantId(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                >
                  <option value="">-- بدون مساعد --</option>
                  {photographers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الموعد والتوقيت">
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="سيارة الإنتاج / وسيلة الانتقال">
                <input
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="سيارة الإنتاج فان، سيارة خاصة..."
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="موقع التصوير (Location & Studio)">
              <input
                required
                value={shootLocation}
                onChange={(e) => setShootLocation(e.target.value)}
                placeholder="عنوان الموقع، اسم الاستوديو، الرابط على خرائط جوجل..."
                className={inputClass}
              />
            </Field>

            <Field label="الـ Call Sheet والتعليمات التشغيلية">
              <textarea
                value={callSheet}
                onChange={(e) => setCallSheet(e.target.value)}
                rows={2}
                placeholder="مواعيد التجمع، ترتيب المشاهد، الملابس، الديكورات..."
                className={inputClass + " h-auto py-2"}
              />
            </Field>

            <Field label="ملاحظات وتجهيزات المعدات">
              <textarea
                value={shootNotes}
                onChange={(e) => setShootNotes(e.target.value)}
                rows={2}
                placeholder="العدسات المحددة، بطاريات إضافية، إضاءات خاصة..."
                className={inputClass + " h-auto py-2"}
              />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>إلغاء</SecondaryButton>
            <PrimaryButton><Camera size={14} /> تأكيد حجز الموعد</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RESCHEDULE */}
      {rescheduleModal && (
        <Modal
          open={!!rescheduleModal}
          onClose={() => setRescheduleModal(null)}
          title="تأجيل / تعديل موعد جلسة التصوير"
          subtitle="سيتم التحقق آلياً من توفر المصور بفارق 3 ساعات لضمان عدم التعارض"
          width="max-w-md"
        >
          <form onSubmit={handleRescheduleSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#141416] border border-white/6 text-xs space-y-1">
                <span className="text-zinc-400 block">الجلسة: <strong className="text-white">{rescheduleModal.title}</strong></span>
                <span className="text-zinc-400 block">الموعد الحالي: <strong className="text-[#facc15] font-mono">{rescheduleModal.scheduled_at}</strong></span>
              </div>

              <Field label="الموعد الجديد المطلوب">
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="سبب التأجيل / التعديل">
                <textarea
                  required
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  placeholder="بناء على طلب العميل، ظروف الطقس، تجهيزات الموقع..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setRescheduleModal(null)}>إلغاء</SecondaryButton>
              <PrimaryButton><Clock size={14} /> تأكيد الموعد الجديد</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: COMPLETE SHOOT & RAW FILES */}
      {completeModal && (
        <Modal
          open={!!completeModal}
          onClose={() => setCompleteModal(null)}
          title="توثيق اكتمال جلسة التصوير"
          subtitle="تسجيل روابط الملفات الخام (Raw Footage) وتحديث حالة الجلسة"
          width="max-w-md"
        >
          <form onSubmit={handleCompleteSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                سيتم تحويل حالة الجلسة إلى <strong>مكتملة بنجاح ✅</strong> وإتاحة الملفات لفريق المونتاج والإنتاج الفني.
              </div>

              <Field label="رابط مجلد الملفات الخام (Google Drive / Dropbox)">
                <input
                  value={rawFilesLink}
                  onChange={(e) => setRawFilesLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className={inputClass}
                />
              </Field>

              <Field label="ملاحظات المخرج والمصور للمونتير">
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                  placeholder="أرقام الـ Takes المميزة، اللقطات المفضلة، أي تعليمات فنية..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setCompleteModal(null)}>إلغاء</SecondaryButton>
              <PrimaryButton className="bg-emerald-500 hover:bg-emerald-400 text-black">
                <CheckCircle2 size={14} /> إنهاء وتوثيق الجلسة
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: CANCEL SHOOT */}
      {cancelModal && (
        <Modal
          open={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title="تأكيد إلغاء جلسة التصوير"
          subtitle="إلغاء الحجز وإرسال إشعار فوري للمصور وفريق العمل"
          width="max-w-md"
        >
          <form onSubmit={handleCancelSubmit} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-center gap-3">
                <AlertTriangle className="text-rose-400 shrink-0" size={18} />
                <p className="text-xs text-rose-300">
                  أنت على وشك إلغاء جلسة <strong>{cancelModal.title}</strong>.
                </p>
              </div>

              <Field label="سبب الإلغاء">
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="اكتب سبب إلغاء الحجز..."
                  className={inputClass + " h-auto py-2"}
                />
              </Field>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
              <SecondaryButton type="button" onClick={() => setCancelModal(null)}>رجوع</SecondaryButton>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <X size={14} /> تأكيد الإلغاء
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: RESCHEDULE HISTORY */}
      {historyModal && (
        <Modal
          open={!!historyModal}
          onClose={() => setHistoryModal(null)}
          title="سجل تأجيلات جلسة التصوير"
          subtitle={historyModal.title}
          width="max-w-lg"
        >
          <div className="space-y-3 text-right">
            {historyModal.reschedules?.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#141416] border border-white/7 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">من: {r.previous_scheduled_at.slice(0, 16)}</span>
                  <span className="text-[#facc15] font-mono font-bold">إلى: {r.new_scheduled_at.slice(0, 16)}</span>
                </div>
                <p className="text-xs text-zinc-300 bg-[#1c1c1f] p-2 rounded-lg">السبب: {r.reason || "بدون سبب مدون"}</p>
                <span className="text-[10px] text-zinc-500 block">بواسطة: {r.requester?.name || "الإدارة"} • {r.created_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
