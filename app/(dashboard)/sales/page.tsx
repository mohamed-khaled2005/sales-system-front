"use client";

import { useAuth } from "@/components/auth-provider";
import { LeadDrawer } from "@/components/lead-drawer";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import type { Client, Lead, Metric, Package, PackageNegotiation, Paginated, PersonalReminder, User } from "@/lib/types";
import { money, statusLabel } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Filter,
  Flame,
  Handshake,
  Mail,
  MoreHorizontal,
  Percent,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Square,
  CheckSquare,
  Target,
  Trash2,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  Users,
  X,
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
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [negotiations, setNegotiations] = useState<PackageNegotiation[]>([]);
  const [reminders, setReminders] = useState<PersonalReminder[]>([]);
  const [salesTeam, setSalesTeam] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "negotiations" | "reminders" | "clients" | "commission">("pipeline");

  // Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Commission Edit state for Sales Leader
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPercentage, setEditingPercentage] = useState<number>(10);

  const isLeaderOrExecutive = user?.role === "sales_leader" || user?.role === "ceo" || user?.role === "admin";

  async function loadAll() {
    setLoading(true);
    const [leadsRes, clientsRes, negsRes, remindersRes, pkgsRes, usersRes] = await Promise.allSettled([
      api<Paginated<Lead>>("/leads?per_page=100"),
      api<Paginated<Client>>("/clients?per_page=100"),
      api<Paginated<PackageNegotiation>>("/negotiations"),
      api<Paginated<PersonalReminder>>("/reminders"),
      api<Package[]>("/packages"),
      api<User[]>("/users"),
    ]);

    if (leadsRes.status === "fulfilled" && leadsRes.value?.data) setLeads(leadsRes.value.data);
    if (clientsRes.status === "fulfilled" && clientsRes.value?.data) setClients(clientsRes.value.data);
    if (negsRes.status === "fulfilled" && negsRes.value?.data) setNegotiations(negsRes.value.data);
    if (remindersRes.status === "fulfilled" && remindersRes.value?.data) setReminders(remindersRes.value.data);
    if (pkgsRes.status === "fulfilled" && Array.isArray(pkgsRes.value)) setPackages(pkgsRes.value);
    if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
      setAllUsers(usersRes.value);
      setSalesTeam(usersRes.value.filter((u) => u.role === "sales" || u.role === "sales_leader"));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [isLeaderOrExecutive]);

  // Client Delete without approval
  async function handleDeleteClient() {
    if (!clientToDelete) return;
    try {
      await api(`/clients/${clientToDelete.id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      toast.success(`تم حذف العميل ${clientToDelete.name} بنجاح`);
      setClientToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "تعذر حذف العميل");
    }
  }

  // Toggle Reminder completion
  async function toggleReminder(reminder: PersonalReminder) {
    const nextState = !reminder.is_completed;
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, is_completed: nextState } : r))
    );
    try {
      await api(`/reminders/${reminder.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_completed: nextState }),
      });
      toast.success(nextState ? "تم إنجاز التذكير" : "تمت إعادة فتح التذكير");
    } catch {}
  }

  // Negotiation Actions for Sales Leader
  async function handleNegotiationDecision(negId: number, decision: "approve" | "reject") {
    try {
      const res = await api<PackageNegotiation>(`/negotiations/${negId}/${decision}`, {
        method: "POST",
        body: JSON.stringify({ leader_notes: decision === "approve" ? "Approved by Sales Leader" : "Price proposal rejected" }),
      });
      setNegotiations((prev) => prev.map((n) => (n.id === negId ? res : n)));
      toast.success(decision === "approve" ? "تمت الموافقة على طلب التفاوض" : "تم رفض طلب التفاوض");
    } catch {
      toast.error("فشل اتخاذ الإجراء");
    }
  }

  // Update commission rate by Sales Leader
  async function handleUpdateCommission(userId: number, rate: number) {
    try {
      await api(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ commission_percentage: rate }),
      });
      setSalesTeam((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, commission_percentage: rate } : u))
      );
      setEditingUserId(null);
      toast.success("تم تحديث نسبة العمولة بنجاح");
    } catch {
      toast.error("فشل تحديث نسبة العمولة");
    }
  }

  const filteredLeads = useMemo(
    () => leads.filter((l) => (l.name + " " + (l.company ?? "")).toLowerCase().includes(search.toLowerCase())),
    [leads, search]
  );

  const wonValue = leads.filter((l) => l.stage === "won").reduce((a, b) => a + Number(b.estimated_value), 0);

  const metrics: Metric[] = [
    { key: "leads", label: "إجمالي الـ Leads", value: leads.length },
    { key: "hot", label: "Hot Leads", value: leads.filter((l) => l.temperature === "hot").length },
    {
      key: "pipeline",
      label: "قيمة الـ Pipeline",
      value: leads.filter((l) => !["won", "lost"].includes(l.stage)).reduce((a, b) => a + Number(b.estimated_value), 0),
      format: "currency",
    },
    { key: "won", label: "صفقات مغلقة", value: wonValue, format: "currency" },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Sales Department"
        title="Sales Command Center"
        description="إدارة الفرص البيعية، العملاء، نسب العمولات، التذكيرات والمواعيد الشخصية، واعتماد طلبات التفاوض."
        icon={CircleDollarSign}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => setReminderModalOpen(true)}>
              <CalendarClock size={14} className="text-[#facc15]" /> موعد / تذكير جديد
            </SecondaryButton>
            <SecondaryButton onClick={() => setClientModalOpen(true)}>
              <UserPlus size={14} className="text-[#facc15]" /> + عميل جديد
            </SecondaryButton>
            <PrimaryButton onClick={() => setLeadModalOpen(true)}>
              <Plus size={15} /> إضافة Lead
            </PrimaryButton>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Main Tabs Navigation */}
      <div className="panel bg-[#141415] border border-white/7 p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "pipeline" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            Pipeline المبيعات
          </button>
          <button
            onClick={() => setActiveTab("negotiations")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "negotiations" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Handshake size={14} />
            <span>طلبات التفاوض ({negotiations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "reminders" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Clock size={14} />
            <span>مواعيدي وتذكيراتي ({reminders.filter((r) => !r.is_completed).length})</span>
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "clients" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            قائمة العملاء ({clients.length})
          </button>
          {isLeaderOrExecutive && (
            <button
              onClick={() => setActiveTab("commission")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "commission" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
              }`}
            >
              <Percent size={14} />
              <span>عمولات الفريق (Sales Leader)</span>
            </button>
          )}
        </div>

        {/* Sales Commission Chip for regular salesperson */}
        {!isLeaderOrExecutive && (
          <div className="flex items-center gap-2 rounded-xl bg-[#1c1c1f] px-3.5 py-1.5 text-xs text-zinc-300 border border-white/5">
            <Percent size={13} className="text-[#facc15]" />
            <span>نسبة عمولتي المعتمدة:</span>
            <strong className="text-[#facc15] font-black">{user?.commission_percentage ?? 10}%</strong>
          </div>
        )}
      </div>

      {/* TAB 1: PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="space-y-4">
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
            </div>
          </div>

          <section className="overflow-x-auto pb-4">
            <div className="grid min-w-[1700px] grid-cols-7 gap-3.5">
              {stages.map((stage) => {
                const items = filteredLeads.filter((l) => l.stage === stage);
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
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {items.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
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
        </div>
      )}

      {/* TAB 2: PACKAGE NEGOTIATIONS */}
      {activeTab === "negotiations" && (
        <div className="space-y-4">
          <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">طلبات التفاوض السعري على الباقات</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  مراجعة واعتماد عروض الأسعار المخفضة بناءً على طلبات مسؤولي المبيعات.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-right">
                <thead className="border-b border-white/7 text-[10px] font-bold text-zinc-500 uppercase">
                  <tr>
                    <th className="pb-3 text-right">العميل</th>
                    <th className="pb-3 text-right">الباقة</th>
                    <th className="pb-3 text-center">السعر الأصلي</th>
                    <th className="pb-3 text-center">السعر المقترح</th>
                    <th className="pb-3 text-right">مسؤول المبيعات</th>
                    <th className="pb-3 text-center">الحالة</th>
                    <th className="pb-3 text-left">ملاحظات / الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {negotiations.map((neg) => (
                    <tr key={neg.id} className="hover:bg-white/[0.02] transition text-xs">
                      <td className="py-3.5 font-bold text-white">{neg.client?.name}</td>
                      <td className="py-3.5 text-zinc-300">{neg.package?.name}</td>
                      <td className="py-3.5 text-center text-zinc-400">{money(Number(neg.original_price))}</td>
                      <td className="py-3.5 text-center font-bold text-[#facc15]">{money(Number(neg.proposed_price))}</td>
                      <td className="py-3.5 text-zinc-300">{neg.salesperson?.name}</td>
                      <td className="py-3.5 text-center">
                        <StatusBadge status={neg.status} />
                      </td>
                      <td className="py-3.5 text-left">
                        {neg.status === "pending" && isLeaderOrExecutive ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleNegotiationDecision(neg.id, "approve")}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#facc15] px-3 text-[11px] font-bold text-black hover:bg-[#fde047]"
                            >
                              <Check size={13} /> اعتماد
                            </button>
                            <button
                              onClick={() => handleNegotiationDecision(neg.id, "reject")}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20 px-3 text-[11px] font-bold hover:bg-rose-500/25"
                            >
                              <X size={13} /> رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            {neg.leader_notes || (neg.status === "approved" ? "تم الاعتماد" : "قيد المراجعة")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {negotiations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                        لا توجد طلبات تفاوض حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL REMINDERS & DEADLINES */}
      {activeTab === "reminders" && (
        <div className="space-y-4">
          <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">المواعيد والتذكيرات الشخصية</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  سجل مواعيد مكالماتك، متابعات العملاء، والمهام الشخصية واستلم إشعارات في موعدها.
                </p>
              </div>
              <PrimaryButton onClick={() => setReminderModalOpen(true)} className="text-xs">
                <Plus size={14} /> إضافة موعد / تذكير
              </PrimaryButton>
            </div>

            <div className="space-y-2.5">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition ${
                    r.is_completed
                      ? "border-white/5 bg-[#141416] opacity-60"
                      : "border-white/8 bg-[#1a1a1c] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleReminder(r)}
                      className="text-[#facc15] hover:scale-110 transition"
                    >
                      {r.is_completed ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div>
                      <strong className={`block text-xs font-bold ${r.is_completed ? "line-through text-zinc-500" : "text-white"}`}>
                        {r.title}
                      </strong>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-zinc-400">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase font-bold text-[#facc15]">
                          {r.type}
                        </span>
                        <span>•</span>
                        <span>{new Date(r.remind_at).toLocaleString("ar-EG")}</span>
                        {r.client && <span>• العميل: {r.client.name}</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    r.is_completed ? "bg-white/5 text-zinc-500" : "bg-[#facc15]/15 text-[#facc15]"
                  }`}>
                    {r.is_completed ? "مكتمل" : "مجدول"}
                  </span>
                </div>
              ))}

              {reminders.length === 0 && (
                <div className="grid h-36 place-items-center text-center text-xs text-zinc-500">
                  <div>
                    <Calendar className="mx-auto mb-1.5 text-zinc-600" size={20} />
                    <p>لا توجد تذكيرات مسجلة. اضغط زر الإضافة لجدولة مكالمة أو موعد.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLIENTS LIST & DELETE */}
      {activeTab === "clients" && (
        <div className="space-y-4">
          <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">قائمة العملاء المسجلين</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  إمكانية إضافة وحذف العملاء مباشرة بدون طلب اعتماد.
                </p>
              </div>
              <PrimaryButton onClick={() => setClientModalOpen(true)} className="text-xs">
                <UserPlus size={14} /> إضافة عميل جديد
              </PrimaryButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/7 bg-[#1a1a1c] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15] font-black text-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong className="block text-xs font-bold text-white">{c.name}</strong>
                          <span className="text-[10px] text-zinc-500">{c.industry || "General"}</span>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="mt-3 space-y-1 text-[11px] text-zinc-400 border-t border-white/5 pt-2">
                      <div>📞 {c.contact_phone || "لا يوجد هاتف"}</div>
                      <div>✉️ {c.contact_email || "لا يوجد بريد"}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">صحة الحساب: {c.health_score}%</span>
                    <button
                      onClick={() => setClientToDelete(c)}
                      title="حذف العميل"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition"
                    >
                      <Trash2 size={13} /> حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SALES LEADER COMMISSION MANAGER */}
      {activeTab === "commission" && isLeaderOrExecutive && (
        <div className="space-y-4">
          <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white">إدارة نسب عمولات فريق المبيعات</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                تحديد وتعديل نسبة العمولة الفردية لكل مسؤول مبيعات بشكل مخصص ومحمي.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-xs">
                <thead className="border-b border-white/7 text-[10px] font-bold text-zinc-500 uppercase">
                  <tr>
                    <th className="pb-3 text-right">الموظف</th>
                    <th className="pb-3 text-right">المسمى الوظيفي</th>
                    <th className="pb-3 text-center">التارجت الشهري</th>
                    <th className="pb-3 text-center">نسبة العمولة الحالية</th>
                    <th className="pb-3 text-left">تعديل النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {salesTeam.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={employee.name} size="sm" />
                          <div>
                            <strong className="block text-white">{employee.name}</strong>
                            <span className="text-[10px] text-zinc-500">{employee.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-zinc-400">{employee.job_title || "Sales Executive"}</td>
                      <td className="py-3.5 text-center font-bold text-[#facc15]">
                        {money(Number(employee.target ?? 0))}
                      </td>
                      <td className="py-3.5 text-center font-black text-white">
                        {employee.commission_percentage ?? 10}%
                      </td>
                      <td className="py-3.5 text-left">
                        {editingUserId === employee.id ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editingPercentage}
                              onChange={(e) => setEditingPercentage(Number(e.target.value))}
                              className="h-8 w-18 rounded-lg border border-white/10 bg-[#1c1c1f] px-2 text-center text-xs text-white outline-none"
                            />
                            <button
                              onClick={() => handleUpdateCommission(employee.id, editingPercentage)}
                              className="h-8 rounded-lg bg-[#facc15] px-2.5 text-[10px] font-black text-black"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="h-8 rounded-lg bg-white/5 px-2 text-[10px] text-zinc-400"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(employee.id);
                              setEditingPercentage(employee.commission_percentage ?? 10);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e22] px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-white/5"
                          >
                            تحديد النسبة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT (No approval required) */}
      <Modal open={clientModalOpen} onClose={() => setClientModalOpen(false)} title="إضافة عميل جديد">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name") || ""),
              industry: String(fd.get("industry") || "Marketing"),
              contact_name: String(fd.get("contact_name") || ""),
              contact_phone: String(fd.get("contact_phone") || ""),
              contact_email: String(fd.get("contact_email") || ""),
              status: "active",
              health_score: 90,
            };
            try {
              const created = await api<Client>("/clients", {
                method: "POST",
                body: JSON.stringify(payload),
              });
              setClients((prev) => [created, ...prev]);
              toast.success("تمت إضافة العميل بنجاح");
              setClientModalOpen(false);
            } catch {
              toast.error("فشل حفظ بيانات العميل");
            }
          }}
          className="grid gap-4 md:grid-cols-2 text-right"
        >
          <Field label="اسم العميل / الشركة">
            <input name="name" required placeholder="مثال: Nova Clinics" className={inputClass} />
          </Field>
          <Field label="المجال / Industry">
            <input name="industry" placeholder="Healthcare, Real Estate..." className={inputClass} />
          </Field>
          <Field label="اسم الشخص المسؤول">
            <input name="contact_name" placeholder="د. أحمد جمال" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input name="contact_phone" required placeholder="+20 100 000 0000" className={inputClass} />
          </Field>
          <Field label="البريد الإلكتروني" className="md:col-span-2">
            <input name="contact_email" type="email" placeholder="contact@example.com" className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setClientModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <UserPlus size={15} /> حفظ العميل
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE CLIENT CONFIRMATION */}
      {clientToDelete && (
        <Modal open={!!clientToDelete} onClose={() => setClientToDelete(null)} title="تأكيد حذف العميل">
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
              <AlertTriangle className="text-rose-400 shrink-0" size={20} />
              <p className="text-xs text-rose-300 leading-relaxed">
                هل أنت متأكد من حذف العميل <strong>{clientToDelete.name}</strong>؟ سيتم تنفيذ الحذف فوراً وفقاً لصلاحيات المبيعات.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setClientToDelete(null)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeleteClient}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Trash2 size={14} /> تأكيد الحذف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD REMINDER */}
      <Modal open={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="جدولة موعد / تذكير شخصي">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              title: String(fd.get("title")),
              type: String(fd.get("type")),
              remind_at: String(fd.get("remind_at")),
              client_id: fd.get("client_id") ? Number(fd.get("client_id")) : undefined,
              notes: fd.get("notes") ? String(fd.get("notes")) : undefined,
            };
            try {
              const res = await api<PersonalReminder>("/reminders", {
                method: "POST",
                body: JSON.stringify(payload),
              });
              setReminders((prev) => [res, ...prev]);
              toast.success("تم حفظ الموعد / التذكير بنجاح");
              setReminderModalOpen(false);
            } catch {
              toast.error("فشل حفظ التذكير");
            }
          }}
          className="grid gap-4 md:grid-cols-2 text-right"
        >
          <Field label="عنوان التذكير" className="md:col-span-2">
            <input name="title" required placeholder="مكالمة متابعة العرض السعري..." className={inputClass} />
          </Field>
          <Field label="النوع">
            <select name="type" className={inputClass}>
              <option value="call">مكالمة هاتفية (Call)</option>
              <option value="follow_up">متابعة عميل (Follow-up)</option>
              <option value="task">مهمة بيع (Sales Task)</option>
              <option value="reminder">تذكير عام (General Reminder)</option>
            </select>
          </Field>
          <Field label="موعد التذكير">
            <input name="remind_at" type="datetime-local" required className={inputClass} />
          </Field>
          <Field label="ربط بعميل (اختياري)" className="md:col-span-2">
            <select name="client_id" className={inputClass}>
              <option value="">-- بدون عميل محدد --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ملاحظات" className="md:col-span-2">
            <textarea name="notes" placeholder="نقاط المكالمة أو ما سيتم مناقشته..." className={textareaClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setReminderModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <CalendarClock size={15} /> حفظ الموعد
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* LEAD CREATION MODAL */}
      <NewLeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onCreated={(lead) => {
          setLeads((prev) => [lead, ...prev]);
          setLeadModalOpen(false);
        }}
      />

      {/* LEAD DETAILS & ACTIONS DRAWER */}
      <LeadDrawer
        lead={selectedLead}
        packages={packages}
        team={allUsers}
        onClose={() => setSelectedLead(null)}
        onUpdated={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setSelectedLead(updated);
        }}
        onCloseWon={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
          loadAll();
        }}
        onDeleted={(deletedId) => {
          setLeads((prev) => prev.filter((l) => l.id !== deletedId));
          setSelectedLead(null);
        }}
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
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 text-right">
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
