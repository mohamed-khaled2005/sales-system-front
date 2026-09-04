"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import type { Client, Metric, Paginated, User } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Filter,
  Grid2X2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [accountManagers, setAccountManagers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "on_hold" | "closed">("all");
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [clientsRes, usersRes] = await Promise.all([
        api<Paginated<Client>>("/clients?per_page=100"),
        api<User[]>("/users"),
      ]);
      if (clientsRes?.data) setClients(clientsRes.data);
      else setClients([]);
      if (usersRes) setAccountManagers(usersRes);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      industry: String(fd.get("industry") || "Marketing"),
      contact_name: String(fd.get("contact_name") || ""),
      contact_phone: String(fd.get("contact_phone") || ""),
      contact_email: String(fd.get("contact_email") || ""),
      account_manager_id: fd.get("account_manager_id") ? Number(fd.get("account_manager_id")) : undefined,
      status: String(fd.get("status") || "active"),
      health_score: 95,
      notes: String(fd.get("notes") || ""),
    };

    try {
      const created = await api<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setClients((prev) => [created, ...prev]);
      toast.success(`تمت إضافة العميل ${created.name} بنجاح`);
      setCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل حفظ بيانات العميل");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteClient() {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await api(`/clients/${clientToDelete.id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      toast.success(`تم حذف العميل ${clientToDelete.name} بنجاح`);
      setClientToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "تعذر حذف العميل");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        const matchesSearch = (c.name + " " + (c.industry ?? "") + " " + (c.contact_name ?? "")).toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        return true;
      }),
    [clients, search, statusFilter]
  );

  const revenue = clients.reduce(
    (a, c) => a + Number(c.subscriptions?.[0]?.package.monthly_price ?? 0),
    0
  );

  const activeCount = clients.filter((c) => c.status === "active").length;
  const avgHealth = clients.length ? Math.round(clients.reduce((a, c) => a + Number(c.health_score || 85), 0) / clients.length) : 90;

  const metrics: Metric[] = [
    { key: "active", label: "العملاء النشطون", value: activeCount, change: 8.7 },
    { key: "retainers", label: "Monthly Retainers", value: revenue, format: "currency", change: 11.2 },
    {
      key: "health",
      label: "متوسط صحة الحسابات",
      value: avgHealth,
      format: "percent",
    },
    { key: "total", label: "إجمالي المحفظة", value: clients.length },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Account Management"
        title="Clients Portfolio"
        description="الباقات، استهلاك المحتوى، المشاريع النشطة وصحة كل حساب في عرض موحد."
        icon={Building2}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="إعادة تحميل"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <PrimaryButton onClick={() => setCreateModalOpen(true)}>
              <Plus size={15} /> عميل جديد
            </PrimaryButton>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Filter Bar */}
      <div className="panel bg-[#141415] border border-white/7 flex flex-col gap-3 p-4 md:flex-row md:items-center justify-between rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عميل، جهة اتصال، أو مجال..."
            className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-zinc-500 pl-2">الحالة:</span>
          {[
            ["all", `الكل (${clients.length})`],
            ["active", `نشط (${clients.filter((c) => c.status === "active").length})`],
            ["on_hold", `معلق (${clients.filter((c) => c.status === "on_hold").length})`],
            ["closed", `مغلق (${clients.filter((c) => c.status === "closed").length})`],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === val ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((client) => {
          const sub = client.subscriptions?.[0];
          return (
            <Link
              href={`/clients/${client.id}`}
              key={client.id}
              className="group panel bg-[#141415] border border-white/7 relative overflow-hidden p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#18181a] rounded-2xl flex flex-col justify-between"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-[#facc15]" />
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15] font-black text-sm">
                      {client.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#facc15] transition">
                        {client.name}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{client.industry}</p>
                    </div>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-[#1c1c1f] p-3">
                  <div>
                    <small className="text-[10px] text-zinc-500 block">الباقة الحالية</small>
                    <strong className="text-xs text-zinc-200 mt-0.5 block">{sub?.package.name ?? "Growth"}</strong>
                  </div>
                  <div className="text-left">
                    <small className="text-[10px] text-zinc-500 block">شهريًا</small>
                    <strong className="text-xs text-[#facc15] mt-0.5 block">
                      {money(Number(sub?.package.monthly_price ?? 48000))}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Reels", u: sub?.reels_used ?? 2, t: sub?.package.reels ?? 8 },
                    { l: "Posts", u: sub?.posts_used ?? 6, t: sub?.package.posts ?? 12 },
                    { l: "Stories", u: sub?.stories_used ?? 10, t: sub?.package.stories ?? 24 },
                  ].map((x) => (
                    <div key={x.l} className="rounded-lg border border-white/5 bg-[#1a1a1c] p-2">
                      <strong className="block text-xs font-bold text-white">
                        {x.u}/{x.t}
                      </strong>
                      <span className="text-[9px] text-zinc-500">{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3.5">
                <div className="flex items-center gap-2">
                  <Avatar name={client.account_manager?.name ?? "Account Manager"} size="sm" />
                  <div>
                    <span className="block text-[9px] text-zinc-500">Account Manager</span>
                    <strong className="block text-[10px] text-zinc-300">
                      {client.account_manager?.name ?? "غير محدد"}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientToDelete(client);
                    }}
                    title="حذف العميل"
                    className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ProgressRing value={client.health_score || 90} size={36} strokeWidth={3} />
                  <ArrowLeft size={14} className="text-zinc-500 transition group-hover:-translate-x-1 group-hover:text-[#facc15]" />
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full panel bg-[#141415] border border-white/7 rounded-2xl p-12 text-center text-xs text-zinc-500">
            لا يوجد عملاء مطابقون للبحث والفلترة.
          </div>
        )}
      </section>

      {/* CREATE CLIENT MODAL */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="إضافة عميل جديد إلى المحفظة">
        <form onSubmit={handleCreateClient} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="اسم العميل / الشركة التجارية" className="md:col-span-2">
            <input name="name" required placeholder="مثال: مطاعم البرنس، عيادات النور..." className={inputClass} />
          </Field>

          <Field label="المجال التجاري (Industry)">
            <input name="industry" placeholder="F&B, Healthcare, Real Estate..." className={inputClass} />
          </Field>

          <Field label="مدير الحساب المسؤول (Account Manager)">
            <select name="account_manager_id" className={inputClass}>
              <option value="">-- اختياري: تعيين مدير حساب --</option>
              {accountManagers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.job_title || u.role})
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم الشخص المسؤول للتواصل">
            <input name="contact_name" placeholder="أ. محمد أحمد" className={inputClass} />
          </Field>

          <Field label="رقم الهاتف للتواصل">
            <input name="contact_phone" placeholder="+20 100 000 0000" className={inputClass} />
          </Field>

          <Field label="البريد الإلكتروني" className="md:col-span-2">
            <input name="contact_email" type="email" placeholder="client@example.com" className={inputClass} />
          </Field>

          <Field label="حالة الحساب">
            <select name="status" className={inputClass}>
              <option value="active">نشط (Active)</option>
              <option value="on_hold">معلق مؤقتاً (On Hold)</option>
              <option value="closed">مغلق (Closed)</option>
            </select>
          </Field>

          <Field label="ملاحظات العميل الأولية" className="md:col-span-2">
            <textarea name="notes" placeholder="أي تفاصيل أو متطلبات خاصة بالعميل..." className={textareaClass} />
          </Field>

          <div className="flex justify-end gap-2 md:col-span-2 pt-2 border-t border-white/5">
            <SecondaryButton type="button" onClick={() => setCreateModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton disabled={creating}>
              <UserPlus size={15} /> {creating ? "جاري الحفظ..." : "حفظ بيانات العميل"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      {clientToDelete && (
        <Modal open={!!clientToDelete} onClose={() => setClientToDelete(null)} title="تأكيد حذف العميل">
          <div className="space-y-4 text-right">
            <p className="text-xs text-zinc-300 leading-relaxed">
              هل أنت متأكد من حذف العميل <strong>"{clientToDelete.name}"</strong>؟ سيتم حذف كافة السجلات والمشاريع والمهام المرتبطة به.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setClientToDelete(null)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeleteClient}
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
