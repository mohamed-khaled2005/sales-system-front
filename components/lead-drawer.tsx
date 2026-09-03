"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Client, Lead, Package, User } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flame,
  Mail,
  MessageCircle,
  MessageSquareText,
  Package as PackageIcon,
  Phone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LeadDrawerProps {
  lead: Lead | null;
  packages: Package[];
  team: User[];
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onCloseWon: (client: Client, deal: any) => void;
  onDeleted: (leadId: number) => void;
}

const STAGES: { key: string; label: string; color: string }[] = [
  { key: "new", label: "جديد (New)", color: "bg-blue-500/20 text-blue-300" },
  { key: "contacted", label: "تم التواصل (Contacted)", color: "bg-purple-500/20 text-purple-300" },
  { key: "qualified", label: "مؤهل (Qualified)", color: "bg-indigo-500/20 text-indigo-300" },
  { key: "proposal", label: "عرض السعر (Proposal)", color: "bg-amber-500/20 text-amber-300" },
  { key: "negotiation", label: "التفاوض (Negotiation)", color: "bg-orange-500/20 text-orange-300" },
  { key: "won", label: "صفقة ناجحة (Won)", color: "bg-emerald-500/20 text-emerald-300" },
  { key: "lost", label: "خسارة (Lost)", color: "bg-rose-500/20 text-rose-300" },
];

export function LeadDrawer({
  lead,
  packages,
  team,
  onClose,
  onUpdated,
  onCloseWon,
  onDeleted,
}: LeadDrawerProps) {
  const [current, setCurrent] = useState<Lead | null>(lead);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activities" | "close_won">("overview");

  // Activity Form state
  const [activityType, setActivityType] = useState("call");
  const [activityBody, setActivityBody] = useState("");
  const [loggingActivity, setLoggingActivity] = useState(false);

  // Close Won Form state
  const [closeWonValue, setCloseWonValue] = useState<number>(0);
  const [selectedAmId, setSelectedAmId] = useState<number | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>(undefined);
  const [closingWon, setClosingWon] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrent(lead);
    if (lead) {
      setCloseWonValue(Number(lead.estimated_value || 45000));
      if (team.length > 0) setSelectedAmId(team[0].id);
      if (packages.length > 0) setSelectedPackageId(packages[0].id);

      // Fetch fresh lead with activities
      api<Lead>(`/leads/${lead.id}`)
        .then((res) => {
          if (res) {
            setCurrent(res);
            if ((res as any).activities) {
              setActivities((res as any).activities);
            }
          }
        })
        .catch(() => {});
    }
  }, [lead, team, packages]);

  if (!current) return null;

  async function handleStageChange(newStage: string) {
    if (!current) return;
    try {
      const updated = await api<Lead>(`/leads/${current.id}`, {
        method: "PUT",
        body: JSON.stringify({
          stage: newStage,
          probability: newStage === "won" ? 100 : newStage === "lost" ? 0 : current.probability,
        }),
      });
      setCurrent(updated);
      onUpdated(updated);
      toast.success(`تم تحديث المرحلة إلى: ${newStage}`);
    } catch {
      toast.error("فشل تغيير المرحلة");
    }
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !activityBody.trim()) return;

    setLoggingActivity(true);
    try {
      const act = await api<any>(`/leads/${current.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: activityType,
          body: activityBody,
          completed_at: new Date().toISOString(),
        }),
      });
      setActivities((prev) => [act, ...prev]);
      setActivityBody("");
      toast.success("تم تسجيل النشاط بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "فشل تسجيل النشاط");
    } finally {
      setLoggingActivity(false);
    }
  }

  async function handleCloseWonSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;

    if (!selectedAmId) {
      toast.error("يرجى اختيار مدير الحساب المسؤول عن العميل");
      return;
    }

    setClosingWon(true);
    try {
      const res = await api<any>(`/leads/${current.id}/close-won`, {
        method: "POST",
        body: JSON.stringify({
          value: closeWonValue,
          account_manager_id: selectedAmId,
          package_id: selectedPackageId || null,
        }),
      });

      const updatedLead = { ...current, stage: "won" as any, probability: 100 };
      setCurrent(updatedLead);
      onUpdated(updatedLead);
      if (res?.client) {
        onCloseWon(res.client, res.deal);
      }
      toast.success("🎉 مبروك! تم إغلاق الصفقة بنجاح وتحويل الـLead إلى عميل فعلي");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "فشل إغلاق الصفقة كـ Close-Won");
    } finally {
      setClosingWon(false);
    }
  }

  async function handleDeleteLead() {
    if (!current) return;
    setDeleting(true);
    try {
      await api(`/leads/${current.id}`, { method: "DELETE" });
      toast.success("تم حذف الـLead بنجاح");
      onDeleted(current.id);
      setDeleteOpen(false);
      onClose();
    } catch {
      toast.error("فشل حذف الـLead");
    } finally {
      setDeleting(false);
    }
  }

  // Clean phone for whatsapp
  const cleanPhone = current.phone?.replace(/[^0-9]/g, "") || "";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-enter absolute inset-y-0 left-0 w-full max-w-[620px] overflow-y-auto border-r border-white/10 bg-[#141416] shadow-2xl text-right"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-white/7 bg-[#141416]/95 p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
            >
              <X size={16} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30 px-2.5 py-0.5 text-[10px] font-black">
                  {current.source || "Direct Lead"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    current.temperature === "hot"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : current.temperature === "warm"
                      ? "bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30"
                      : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                  }`}
                >
                  <Flame size={10} className="ml-1 inline" />
                  {current.temperature?.toUpperCase() || "WARM"}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white leading-tight">{current.name}</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {current.company || "شركة غير محددة"} • القيمة المقدرة: {money(Number(current.estimated_value))}
              </p>
            </div>

            <button
              onClick={() => setDeleteOpen(true)}
              title="حذف الـLead"
              className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Quick Communication Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {current.phone && (
              <>
                <a
                  href={`tel:${current.phone}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1c1c1f] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10 transition"
                >
                  <Phone size={12} className="text-emerald-400" />
                  <span>اتصال هاتف</span>
                </a>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${cleanPhone}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <MessageCircle size={12} />
                  <span>واتساب</span>
                </a>
              </>
            )}
            {current.email && (
              <a
                href={`mailto:${current.email}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1c1c1f] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10 transition"
              >
                <Mail size={12} className="text-sky-400" />
                <span>إرسال إيميل</span>
              </a>
            )}
          </div>

          {/* Pipeline Stage Switcher */}
          <div className="mt-4">
            <span className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">
              المرحلة في مسار المبيعات (Pipeline Stage):
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStageChange(s.key)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    current.stage === s.key
                      ? "bg-[#facc15] text-black font-black"
                      : "bg-[#1c1c1f] text-zinc-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 flex gap-2 border-t border-white/5 pt-3">
            {[
              ["overview", "بيانات الفرصة"],
              ["activities", `الأنشطة والملاحظات (${activities.length})`],
              ["close_won", "✨ تحويل لعميل (Close-Won)"],
            ].map(([key, label]: any) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tab === key ? "bg-[#facc15] text-black font-black" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">اسم جهة الاتصال</span>
                  <strong className="text-xs text-white mt-1 block">{current.name}</strong>
                </div>

                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">الشركة / النشاط</span>
                  <strong className="text-xs text-white mt-1 block">{current.company || "غير محدد"}</strong>
                </div>

                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">رقم الهاتف</span>
                  <strong className="text-xs text-zinc-200 mt-1 block dir-ltr">{current.phone || "—"}</strong>
                </div>

                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">البريد الإلكتروني</span>
                  <strong className="text-xs text-zinc-200 mt-1 block">{current.email || "—"}</strong>
                </div>

                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">القيمة المالية المتوقعة</span>
                  <strong className="text-base font-black text-[#facc15] mt-0.5 block">
                    {money(Number(current.estimated_value))}
                  </strong>
                </div>

                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">نسبة الاحتمالية (Probability)</span>
                  <strong className="text-base font-black text-white mt-0.5 block">{current.probability}%</strong>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-[#facc15]" style={{ width: `${current.probability}%` }} />
                  </div>
                </div>
              </div>

              {current.notes && (
                <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">ملاحظات ومخرجات النقاش</h3>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-200">{current.notes}</p>
                </div>
              )}

              {/* Close-Won Highlight Banner */}
              {current.stage !== "won" && (
                <div className="rounded-2xl border border-[#facc15]/30 bg-[#facc15]/5 p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">جاهز لإتمام الصفقة؟</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      قم بتحويل الـLead إلى عميل رسمي وإنشاء صفقة رابحة وتفعيل الباقة مباشرة.
                    </p>
                  </div>
                  <button
                    onClick={() => setTab("close_won")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#facc15] px-3.5 text-xs font-black text-black hover:bg-[#fde047] transition"
                  >
                    <Sparkles size={13} /> إتمام الصفقة
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "activities" && (
            <div className="space-y-4">
              {/* Log new activity box */}
              <form onSubmit={handleLogActivity} className="rounded-2xl border border-white/10 bg-[#161618] p-4 space-y-3">
                <span className="text-xs font-bold text-white block">تسجيل نشاط / تفاعل جديد:</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">نوع التفاعل</span>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className={inputClass}
                    >
                      <option value="call">اتصال هاتف (Call)</option>
                      <option value="meeting">اجتماع / زيارة (Meeting)</option>
                      <option value="whatsapp">محادثة واتساب (WhatsApp)</option>
                      <option value="email">إيميل (Email)</option>
                      <option value="note">ملاحظة داخلية (Note)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-zinc-500 block mb-1">تفاصيل المحادثة والمخرجات</span>
                    <input
                      value={activityBody}
                      onChange={(e) => setActivityBody(e.target.value)}
                      placeholder="تم الاتفاق على إرسال العرض المالي..."
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <PrimaryButton disabled={loggingActivity || !activityBody.trim()} className="h-8 text-xs">
                    <Send size={12} /> {loggingActivity ? "جاري التسجيل..." : "تسجيل التفاعل"}
                  </PrimaryButton>
                </div>
              </form>

              {/* Timeline of activities */}
              <div className="space-y-2.5">
                {activities.map((act) => (
                  <div key={act.id} className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#facc15] uppercase">
                          {act.type}
                        </span>
                        <strong className="text-white">{act.user?.name || "مسؤول المبيعات"}</strong>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {act.created_at ? new Date(act.created_at).toLocaleDateString("ar-EG") : "اليوم"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">{act.body}</p>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="grid h-28 place-items-center rounded-xl border border-dashed border-white/8 text-xs text-zinc-500">
                    لم يتم تسجيل أي تفاعلات أو مكالمات بعد.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "close_won" && (
            <form onSubmit={handleCloseWonSubmit} className="space-y-4">
              <div className="rounded-2xl border border-white/7 bg-[#161618] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white">إغلاق الصفقة كفوز (Close-Won) وتحويلها لعميل</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  سيتم إنشاء سجل عميل نشط في محفظة العملاء، وتسجيل صفقة رابحة للمسؤول، وتفعيل اشتراك الباقة المحددة فوراً.
                </p>
              </div>

              <Field label="القيمة النهائية المتفق عليها للعقد ($)">
                <input
                  type="number"
                  required
                  min={0}
                  value={closeWonValue}
                  onChange={(e) => setCloseWonValue(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>

              <Field label="مدير الحساب المسؤول (Account Manager)">
                <select
                  value={selectedAmId || ""}
                  onChange={(e) => setSelectedAmId(Number(e.target.value))}
                  required
                  className={inputClass}
                >
                  <option value="">-- اختر مدير الحساب --</option>
                  {team.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.job_title || u.role})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="الباقة التعاقدية (اختياري)">
                <select
                  value={selectedPackageId || ""}
                  onChange={(e) => setSelectedPackageId(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                >
                  <option value="">-- بدون تفعيل باقة تلقائية --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — {money(Number(pkg.monthly_price))} شهرياً ({pkg.reels} ريلز، {pkg.posts} بوستات)
                    </option>
                  ))}
                </select>
              </Field>

              <div className="pt-2 border-t border-white/5 flex justify-end gap-2">
                <SecondaryButton type="button" onClick={() => setTab("overview")}>
                  إلغاء
                </SecondaryButton>
                <PrimaryButton disabled={closingWon}>
                  <Sparkles size={14} /> {closingWon ? "جاري الإتمام..." : "تأكيد إتمام التعاقد والفوز بالصفقة"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* CONFIRM DELETE MODAL */}
      {deleteOpen && (
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="تأكيد حذف الـLead">
          <div className="space-y-4 text-right">
            <p className="text-xs text-zinc-300 leading-relaxed">
              هل أنت متأكد من حذف الـLead <strong>"{current.name}"</strong>؟ سيتم حذف كافة السجلات والأنشطة المرتبطة به.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setDeleteOpen(false)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeleteLead}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Trash2 size={14} /> {deleting ? "جاري الحذف..." : "تأكيد الحذف نهائياً"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
