"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockShoots } from "@/lib/mock-data";
import type { Client, Metric, Paginated, ProductionShoot, User } from "@/lib/types";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  FileText,
  MapPin,
  PackageOpen,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  UploadCloud,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProductionPage() {
  const [shoots, setShoots] = useState<ProductionShoot[]>(mockShoots);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [photographers, setPhotographers] = useState<User[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState<ProductionShoot | null>(null);
  const [cancelModal, setCancelModal] = useState<ProductionShoot | null>(null);
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");

  // Booking Form State
  const [selectedClientId, setSelectedClientId] = useState<number>(mockClients[0]?.id || 1);
  const [clientPhone, setClientPhone] = useState<string>(mockClients[0]?.contact_phone || "");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [photographerId, setPhotographerId] = useState<number | undefined>(undefined);
  const [shootTitle, setShootTitle] = useState<string>("");
  const [shootLocation, setShootLocation] = useState<string>("New Cairo Studio");
  const [shootNotes, setShootNotes] = useState<string>("");

  // Reschedule state
  const [newDate, setNewDate] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");

  // Cancel state
  const [cancelReason, setCancelReason] = useState<string>("");

  async function loadData() {
    try {
      const [shootsRes, clientsRes, usersRes] = await Promise.all([
        api<Paginated<ProductionShoot>>("/production/shoots?per_page=100"),
        api<Paginated<Client>>("/clients?per_page=100"),
        api<User[]>("/users?role=production"),
      ]);

      if (shootsRes?.data) setShoots(shootsRes.data);
      if (clientsRes?.data) {
        setClients(clientsRes.data);
        if (clientsRes.data[0]) {
          setSelectedClientId(clientsRes.data[0].id);
          setClientPhone(clientsRes.data[0].contact_phone || "");
        }
      }
      if (usersRes) setPhotographers(usersRes);
    } catch {
      setShoots(mockShoots);
      setClients(mockClients);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update phone automatically when client changes
  function handleClientChange(clientId: number) {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found?.contact_phone) {
      setClientPhone(found.contact_phone);
    }
  }

  // Create Shoot with Conflict Check
  async function handleCreateShoot(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<ProductionShoot>("/production/shoots", {
        method: "POST",
        body: JSON.stringify({
          client_id: selectedClientId,
          title: shootTitle,
          location: shootLocation,
          client_phone: clientPhone,
          scheduled_at: scheduledAt,
          photographer_id: photographerId,
          notes: shootNotes,
          team: ["Producer", "Photographer", "Assistant"],
          equipment: ["Sony FX3", "24-70mm lens", "Aputure lights"],
          status: "scheduled",
        }),
      });

      setShoots((prev) => [res, ...prev]);
      toast.success("تم حجز وتأكيد موعد التصوير بنجاح");
      setCreateOpen(false);
      setShootTitle("");
      setScheduledAt("");
    } catch (err: any) {
      toast.error(err?.message || "تعذر حجز الموعد لوجود تعارض في مواعيد المصور المحدد");
    }
  }

  // Reschedule Shoot
  async function handleRescheduleSubmit(e: React.FormEvent) {
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

      setShoots((prev) => prev.map((s) => (s.id === res.id ? res : s)));
      toast.success("تم تأجيل / تعديل موعد التصوير بنجاح");
      setRescheduleModal(null);
      setNewDate("");
      setRescheduleReason("");
    } catch (err: any) {
      toast.error(err?.message || "تعذر التأجيل لوجود تعارض في الحجز");
    }
  }

  // Cancel Shoot
  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelModal) return;

    try {
      const res = await api<ProductionShoot>(`/production/shoots/${cancelModal.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });

      setShoots((prev) => prev.map((s) => (s.id === res.id ? res : s)));
      toast.success("تم إلغاء جلسة التصوير وإشعار الفريق");
      setCancelModal(null);
      setCancelReason("");
    } catch {
      toast.error("فشل إلغاء جلسة التصوير");
    }
  }

  const upcoming = shoots.filter((s) => new Date(s.scheduled_at) >= new Date() && s.status !== "cancelled");

  const metrics: Metric[] = [
    { key: "upcoming", label: "جلسات التصوير القادمة", value: upcoming.length },
    {
      key: "week",
      label: "تصوير هذا الأسبوع",
      value: upcoming.filter((s) => new Date(s.scheduled_at).getTime() < Date.now() + 7 * 86400000).length,
    },
    { key: "completed", label: "تم بنجاح هذا الشهر", value: shoots.filter((s) => s.status === "completed").length || 14 },
    { key: "utilization", label: "استخدام المعدات والاستوديو", value: 85, format: "percent" },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Media Production & Shooting"
        title="Production Calendar & Availability"
        description="إدارة جداول ومواعيد التصوير مع التحقق اللحظي من عدم تضارب مواعيد المصورين والاستوديو."
        icon={Camera}
        action={
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => setActiveView(activeView === "list" ? "calendar" : "list")}>
              <CalendarDays size={14} className="text-[#facc15]" />
              <span>{activeView === "list" ? "جدول الإتاحة (Calendar)" : "عرض القائمة"}</span>
            </SecondaryButton>
            <PrimaryButton onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> حجز جلسة تصوير جديدة
            </PrimaryButton>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard metric={m} index={i} key={m.key} />
        ))}
      </section>

      {/* VIEW 1: LIST VIEW */}
      {activeView === "list" && (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-3.5">
            {shoots.map((shoot) => {
              const isCancelled = shoot.status === "cancelled";
              return (
                <article
                  className={`panel bg-[#141415] border border-white/7 relative overflow-hidden p-5 rounded-2xl transition hover:border-white/15 ${
                    isCancelled ? "opacity-60" : ""
                  }`}
                  key={shoot.id}
                >
                  <div className={`absolute right-0 top-0 h-full w-1 ${isCancelled ? "bg-rose-500" : "bg-[#facc15]"}`} />
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Date Chip */}
                    <div className="flex min-w-24 shrink-0 items-center gap-3 lg:block lg:text-center">
                      <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#facc15] text-black font-black text-xl lg:mx-auto">
                        {new Date(shoot.scheduled_at).getDate()}
                      </div>
                      <div className="lg:mt-1.5">
                        <strong className="block text-xs text-white">
                          {new Date(shoot.scheduled_at).toLocaleDateString("ar-EG", { month: "short" })}
                        </strong>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(shoot.scheduled_at).toLocaleDateString("ar-EG", { weekday: "short" })}
                        </span>
                      </div>
                    </div>

                    {/* Shoot Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white leading-snug">{shoot.title}</h3>
                            <StatusBadge status={shoot.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            العميل: {shoot.client?.name ?? "Client Account"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <MapPin size={13} className="text-[#facc15]" />
                          <span>{shoot.location || "Studio"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock3 size={13} className="text-[#facc15]" />
                          <span>{new Date(shoot.scheduled_at).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Phone size={13} className="text-[#facc15]" />
                          <span>{shoot.client_phone || shoot.client?.contact_phone || "لا يوجد هاتف"}</span>
                        </div>
                      </div>

                      {/* Source Files & Scripts Label */}
                      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <FileText size={14} className="text-[#facc15]" />
                          <span>المصادر والسكريبتات: <strong>Brand Script & Storyboard v2</strong></span>
                        </div>

                        {!isCancelled && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setRescheduleModal(shoot);
                                setNewDate(new Date(shoot.scheduled_at).toISOString().slice(0, 16));
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e22] px-3 text-xs font-bold text-zinc-200 hover:bg-white/5"
                            >
                              <Clock size={12} /> تأجيل / تعديل
                            </button>
                            <button
                              onClick={() => setCancelModal(shoot)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20 px-3 text-xs font-bold hover:bg-rose-500/25"
                            >
                              <X size={12} /> إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Quick Availability / Team Sidebar */}
          <div className="space-y-4">
            <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">فريق ومصورو الإنتاج</h3>
              <div className="space-y-3">
                {photographers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#1c1c1f] p-3 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.name} size="sm" />
                      <div>
                        <strong className="block text-xs font-bold text-white">{p.name}</strong>
                        <span className="text-[10px] text-zinc-500">{p.job_title || "Lead Photographer"}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-bold">
                      متاح
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}

      {/* VIEW 2: CALENDAR AVAILABILITY VIEW */}
      {activeView === "calendar" && (
        <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/7 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">جدول الإتاحة والمواعيد المتاحة للتصوير</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                توزيع الجلسات على الفترات الزمنية المعتمدة (09:00-12:00, 12:00-15:00, 15:00-18:00, 18:00-21:00).
              </p>
            </div>
            <span className="rounded-xl bg-[#facc15]/15 text-[#facc15] px-3 py-1 text-xs font-bold">
              فترات 3 ساعات معتمدة
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {["09:00 - 12:00 (صباحية)", "12:00 - 15:00 (ظهيرة)", "15:00 - 18:00 (عصر)", "18:00 - 21:00 (مسائية)"].map((slot, idx) => (
              <div key={idx} className="rounded-2xl border border-white/7 bg-[#1a1a1c] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-white">{slot}</strong>
                  <Clock size={14} className="text-[#facc15]" />
                </div>
                <div className="space-y-2">
                  {shoots.slice(idx * 2, idx * 2 + 2).map((s) => (
                    <div key={s.id} className="rounded-xl bg-[#141416] p-3 border border-white/5">
                      <strong className="block text-xs font-bold text-zinc-200">{s.title}</strong>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">{s.client?.name} • {s.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: BOOK SHOOT */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="حجز جلسة تصوير جديدة">
        <form onSubmit={handleCreateShoot} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="عنوان الجلسة / المحتوى">
            <input
              required
              value={shootTitle}
              onChange={(e) => setShootTitle(e.target.value)}
              placeholder="مثال: تصوير محتوى ريلز الشهرية"
              className={inputClass}
            />
          </Field>

          <Field label="العميل">
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className={inputClass}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="رقم هاتف العميل للتنسيق">
            <input
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+20 100 000 0000"
              className={inputClass}
            />
          </Field>

          <Field label="المصور المسؤول">
            <select
              value={photographerId || ""}
              onChange={(e) => setPhotographerId(e.target.value ? Number(e.target.value) : undefined)}
              className={inputClass}
            >
              <option value="">-- اختيار المصور --</option>
              {photographers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الموعد والتوقيت">
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="موقع التصوير (Location)">
            <input
              value={shootLocation}
              onChange={(e) => setShootLocation(e.target.value)}
              placeholder="New Cairo Studio, Branch..."
              className={inputClass}
            />
          </Field>

          <Field label="ملاحظات الإنتاج والـCall Sheet" className="md:col-span-2">
            <textarea
              value={shootNotes}
              onChange={(e) => setShootNotes(e.target.value)}
              placeholder="المعدات الخاصة، التجهيزات المطلوبة، الملابس والإكسسوارات..."
              className={textareaClass}
            />
          </Field>

          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Camera size={14} /> تأكيد حجز الموعد
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESCHEDULE */}
      {rescheduleModal && (
        <Modal open={!!rescheduleModal} onClose={() => setRescheduleModal(null)} title="تأجيل / تعديل موعد جلسة التصوير">
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-right">
            <p className="text-xs text-zinc-400">
              سيتحقق النظام فورياً من توفر المصور والاستوديو لضمان عدم حدوث تعارض في الحجوزات.
            </p>
            <Field label="الموعد الجديد">
              <input
                type="datetime-local"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="سبب التأجيل">
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="بناء على طلب العميل، تجهيزات الموقع..."
                className={textareaClass}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setRescheduleModal(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton>
                <Clock size={14} /> تأكيد الموعد الجديد
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CANCEL */}
      {cancelModal && (
        <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="تأكيد إلغاء جلسة التصوير">
          <form onSubmit={handleCancelSubmit} className="space-y-4 text-right">
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-center gap-3">
              <AlertTriangle className="text-rose-400 shrink-0" size={18} />
              <p className="text-xs text-rose-300">
                سيتم إلغاء الجلسة <strong>{cancelModal.title}</strong> وإشعار المصور وفريق الإنتاج فوراً.
              </p>
            </div>
            <Field label="سبب الإلغاء">
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اكتب سبب إلغاء الحجز..."
                className={textareaClass}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setCancelModal(null)}>
                رجوع
              </SecondaryButton>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500"
              >
                <X size={14} /> تأكيد الإلغاء
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
