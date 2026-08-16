"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockLeads } from "@/lib/mock-data";
import type { Lead, Metric, Paginated } from "@/lib/types";
import { money, statusLabel } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  Filter,
  Flame,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Target,
  UserRoundPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const temperatures = {
  hot: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  warm: "text-[#facc15] bg-[#facc15]/10 border-[#facc15]/20",
  cold: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api<Paginated<Lead>>("/leads?per_page=100");
      if (r?.data) setLeads(r.data);
    } catch {
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => leads.filter((l) => (l.name + " " + (l.company ?? "")).toLowerCase().includes(search.toLowerCase())),
    [leads, search]
  );

  const wonValue = leads.filter((l) => l.stage === "won").reduce((a, b) => a + Number(b.estimated_value), 0);

  const metrics: Metric[] = [
    { key: "leads", label: "إجمالي الـ Leads", value: leads.length, change: 12.4 },
    { key: "hot", label: "Hot Leads", value: leads.filter((l) => l.temperature === "hot").length, change: 6.2 },
    {
      key: "pipeline",
      label: "قيمة الـ Pipeline",
      value: leads.filter((l) => !["won", "lost"].includes(l.stage)).reduce((a, b) => a + Number(b.estimated_value), 0),
      format: "currency",
      change: 18.7,
    },
    { key: "won", label: "صفقات مغلقة", value: wonValue, format: "currency", change: 14.1 },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Sales Department"
        title="Sales Pipeline"
        description="تابع كل فرصة من أول تواصل حتى إغلاق الصفقة وتحويل العميل تلقائيًا إلى Account Manager."
        icon={CircleDollarSign}
        action={
          <PrimaryButton onClick={() => setOpen(true)}>
            <Plus size={15} /> إضافة Lead
          </PrimaryButton>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Filter Bar */}
      <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="ابحث بالاسم أو الشركة..."
            />
          </div>
          <SecondaryButton>
            <Filter size={14} className="text-[#facc15]" /> الفلاتر
          </SecondaryButton>
          <div className="flex items-center gap-2 rounded-xl bg-[#1c1c1f] px-4 py-2.5 text-xs text-zinc-400">
            <Target size={15} className="text-[#facc15]" />
            <span>Target achievement:</span>
            <strong className="text-[#facc15] font-black">83%</strong>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <section className="overflow-x-auto pb-4">
        <div className="grid min-w-[1700px] grid-cols-7 gap-3.5">
          {stages.map((stage) => {
            const items = filtered.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="rounded-2xl border border-white/7 bg-[#121213] p-3.5 flex flex-col">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#facc15]" />
                    <h3 className="text-xs font-black text-white">{statusLabel(stage)}</h3>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
                      {items.length}
                    </span>
                  </div>
                  <MoreHorizontal size={14} className="text-zinc-600" />
                </div>

                <div className="space-y-2.5 flex-1">
                  {items.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="w-full rounded-xl border border-white/7 bg-[#18181a] p-3.5 text-right transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1f1f22]"
                    >
                      <div className="flex items-start justify-between">
                        <Avatar name={lead.name} size="sm" />
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                            temperatures[lead.temperature]
                          }`}
                        >
                          <Flame size={10} />
                          {lead.temperature}
                        </span>
                      </div>

                      <strong className="mt-2.5 block truncate text-xs font-bold text-white">{lead.name}</strong>
                      <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{lead.company}</span>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black text-[#facc15]">{money(Number(lead.estimated_value))}</span>
                        <span className="text-[10px] text-zinc-500">{lead.probability}%</span>
                      </div>

                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-[#facc15]" style={{ width: `${lead.probability}%` }} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-zinc-500">
                        <span>{lead.source}</span>
                        <span className="flex items-center gap-1">
                          <CalendarClock size={10} />
                          {lead.next_follow_up_at
                            ? new Date(lead.next_follow_up_at).toLocaleDateString("ar-EG", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </span>
                      </div>
                    </button>
                  ))}

                  {items.length === 0 && (
                    <div className="grid h-28 place-items-center rounded-xl border border-dashed border-white/7 text-[10px] text-zinc-600">
                      لا توجد فرص هنا
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* New Lead Modal */}
      <NewLeadModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(lead) => {
          setLeads((v) => [lead, ...v]);
          setOpen(false);
        }}
      />

      {/* Lead Detail Drawer */}
      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onUpdate={(updated) => setLeads((v) => v.map((l) => (l.id === updated.id ? updated : l)))}
      />
    </div>
  );
}

function NewLeadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (l: Lead) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      company: String(fd.get("company") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      source: String(fd.get("source") || "Instagram"),
      temperature: (fd.get("temperature") as Lead["temperature"]) || "warm",
      estimated_value: Number(fd.get("estimated_value") || 50000),
      stage: "new",
      probability: 10,
      notes: fd.get("notes") ? String(fd.get("notes")) : undefined,
    };

    try {
      const lead = await api<Lead>("/leads", { method: "POST", body: JSON.stringify(payload) });
      onCreated(lead);
      toast.success("تمت إضافة الـLead");
    } catch {
      onCreated({
        ...payload,
        id: Date.now(),
      });
      toast.success("تمت الإضافة بنجاح");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="إضافة Lead جديد">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="اسم الشخص">
          <input name="name" required className={inputClass} placeholder="Jane Doe" />
        </Field>
        <Field label="الشركة">
          <input name="company" className={inputClass} placeholder="TechNova Solutions" />
        </Field>
        <Field label="البريد">
          <input name="email" type="email" className={inputClass} placeholder="name@company.com" />
        </Field>
        <Field label="الهاتف">
          <input name="phone" className={inputClass} placeholder="+971 50 123 4567" />
        </Field>
        <Field label="المصدر">
          <select name="source" className={inputClass}>
            <option>Instagram</option>
            <option>Website</option>
            <option>Referral</option>
            <option>LinkedIn</option>
          </select>
        </Field>
        <Field label="درجة الاهتمام">
          <select name="temperature" className={inputClass}>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </Field>
        <Field label="القيمة المتوقعة ($)" className="md:col-span-2">
          <input name="estimated_value" type="number" defaultValue={50000} className={inputClass} />
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <textarea name="notes" className={textareaClass} placeholder="تفاصيل المحادثة الأولى..." />
        </Field>
        <div className="flex justify-end gap-2 md:col-span-2 pt-2">
          <SecondaryButton type="button" onClick={onClose}>
            إلغاء
          </SecondaryButton>
          <PrimaryButton disabled={saving}>
            <UserRoundPlus size={15} />
            {saving ? "جاري الحفظ..." : "إضافة الـLead"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (l: Lead) => void;
}) {
  if (!lead) return null;
  const currentLead = lead;

  async function move(stage: string) {
    const updated = {
      ...currentLead,
      stage,
      probability:
        ({
          contacted: 25,
          qualified: 45,
          proposal: 65,
          negotiation: 80,
          won: 100,
          lost: 0,
        } as Record<string, number>)[stage] ?? currentLead.probability,
    };
    try {
      await api(`/leads/${currentLead.id}`, {
        method: "PUT",
        body: JSON.stringify({ stage, probability: updated.probability }),
      });
    } catch {}
    onUpdate(updated);
    toast.success(`تم نقل الفرصة إلى ${statusLabel(stage)}`);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-enter absolute inset-y-0 left-0 w-full max-w-[500px] overflow-y-auto border-r border-white/10 bg-[#141416] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={currentLead.name} size="lg" />
            <div>
              <h2 className="text-xl font-black text-white">{currentLead.name}</h2>
              <p className="text-xs text-zinc-400">{currentLead.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={currentLead.stage} />
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
              temperatures[currentLead.temperature]
            }`}
          >
            <Flame size={12} />
            {currentLead.temperature}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#facc15]/30 bg-[#1a1a1c] p-4 text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estimated Value</span>
            <strong className="mt-1 block text-2xl font-black text-[#facc15]">
              {money(Number(currentLead.estimated_value))}
            </strong>
          </div>
          <div className="rounded-xl border border-white/7 bg-[#1a1a1c] p-4 text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Probability</span>
            <strong className="mt-1 block text-2xl font-black text-white">{currentLead.probability}%</strong>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <a
            href={`mailto:${currentLead.email}`}
            className="flex items-center gap-2.5 rounded-xl border border-white/7 bg-[#1a1a1c] p-3 text-xs text-zinc-300 hover:text-white"
          >
            <Mail size={15} className="text-[#facc15]" />
            {currentLead.email || "لا يوجد بريد"}
          </a>
          <a
            href={`tel:${currentLead.phone}`}
            className="flex items-center gap-2.5 rounded-xl border border-white/7 bg-[#1a1a1c] p-3 text-xs text-zinc-300 hover:text-white"
          >
            <Phone size={15} className="text-sky-400" />
            {currentLead.phone || "لا يوجد هاتف"}
          </a>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-xs font-bold text-zinc-400">نقل إلى مرحلة</h3>
          <div className="grid grid-cols-2 gap-2">
            {stages
              .filter((s) => s !== currentLead.stage)
              .map((stage) => (
                <SecondaryButton key={stage} onClick={() => move(stage)} className="justify-between text-xs">
                  {statusLabel(stage)} <ArrowLeft size={13} />
                </SecondaryButton>
              ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/7 bg-[#1a1a1c] p-4">
          <h3 className="text-xs font-bold text-zinc-400">الملاحظات</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            {currentLead.notes || "لا توجد ملاحظات بعد. أضف نتيجة المكالمة أو الخطوة القادمة."}
          </p>
        </div>
      </aside>
    </div>
  );
}
