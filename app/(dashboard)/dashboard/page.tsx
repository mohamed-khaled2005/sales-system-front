"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PackageBadge, StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockDashboard } from "@/lib/mock-data";
import type { AutomaticDeductionRule, Client, DashboardData, EmployeeRequest, Lead, Role, User } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  Filter,
  Flame,
  Gavel,
  Handshake,
  Layers,
  Mail,
  MoreHorizontal,
  Percent,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Square,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const fallback = useMemo(() => mockDashboard(user?.role), [user?.role]);
  const [data, setData] = useState<DashboardData>(fallback);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
  const [deductionRules, setDeductionRules] = useState<AutomaticDeductionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // CEO Modals
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addDeductionOpen, setAddDeductionOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);

  // Bulk deduction form state
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [deductionAmount, setDeductionAmount] = useState<number>(500);
  const [deductionReason, setDeductionReason] = useState<string>("");
  const [deductionNotes, setDeductionNotes] = useState<string>("");

  const isExecutive = user?.role === "ceo" || user?.role === "admin";

  async function loadData() {
    setLoading(true);
    try {
      const dashData = await api<DashboardData>("/dashboard");
      if (dashData) setData(dashData);
    } catch (e) {
      console.warn("Failed to load dashboard metrics", e);
    }

    try {
      const usersData = await api<User[]>("/users");
      if (usersData && Array.isArray(usersData)) setUsersList(usersData);
    } catch (e) {
      console.warn("Failed to load users", e);
    }

    const canSeeLeads = isExecutive || user?.role === "sales" || user?.role === "sales_leader" || user?.role === "account_manager";
    if (canSeeLeads) {
      try {
        const leadsData = await api<{ data: Lead[] }>("/leads?per_page=20");
        if (leadsData?.data) setLeads(leadsData.data);
      } catch (e) {
        console.warn("Failed to load leads", e);
      }
    }

    if (isExecutive) {
      try {
        const reqs = await api<EmployeeRequest[]>("/hr/employee-requests");
        if (reqs && Array.isArray(reqs)) setEmployeeRequests(reqs);
      } catch (e) {
        console.warn("Failed to load employee requests", e);
      }

      try {
        const rules = await api<AutomaticDeductionRule[]>("/hr/deductions/rules");
        if (rules && Array.isArray(rules)) setDeductionRules(rules);
      } catch (e) {
        console.warn("Failed to load deduction rules", e);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user?.role, isExecutive]);

  // Handle Add Employee (CEO Action)
  async function handleAddEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      role: String(fd.get("role")) as Role,
      job_title: String(fd.get("job_title") || ""),
      phone: String(fd.get("phone") || ""),
      target: fd.get("target") ? Number(fd.get("target")) : 0,
      commission_percentage: fd.get("commission_percentage") ? Number(fd.get("commission_percentage")) : 0,
      is_active: true,
    };

    try {
      const created = await api<User>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUsersList((prev) => [...prev, created]);
      toast.success(`تمت إضافة الموظف ${created.name} بنجاح`);
      setAddEmployeeOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل إضافة الموظف. يرجى التأكد من البريد وكلمة المرور");
    }
  }

  // Handle Bulk / Single Employee Deduction
  async function handleApplyDeduction(e: React.FormEvent) {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error("يرجى اختيار موظف واحد على الأقل لتطبيق الخصم");
      return;
    }

    try {
      await api("/hr/deductions/bulk", {
        method: "POST",
        body: JSON.stringify({
          user_ids: selectedUserIds,
          amount: deductionAmount,
          reason: deductionReason,
          notes: deductionNotes,
        }),
      });
      toast.success(`تم تطبيق الخصم على ${selectedUserIds.length} موظف وإشعارهم بنجاح`);
      setAddDeductionOpen(false);
      setSelectedUserIds([]);
      setDeductionReason("");
      setDeductionNotes("");
    } catch (err: any) {
      toast.error(err?.message || "فشل تطبيق الخصم");
    }
  }

  if (!user) return null;

  const filteredLeads = leads
    .filter((l) =>
      (l.name + " " + (l.company ?? "")).toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  const formatFirstName = (fullName: string) => fullName.split(" ")[0];

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            title="إعادة تحميل البيانات"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {isExecutive ? (
            <>
              <PrimaryButton onClick={() => setAddEmployeeOpen(true)}>
                <UserPlus size={15} /> + إضافة موظف جديد
              </PrimaryButton>
              <SecondaryButton onClick={() => setAddDeductionOpen(true)}>
                <Gavel size={14} className="text-rose-400" /> تسجيل خصم / جزاء
              </SecondaryButton>
              <SecondaryButton onClick={() => setRulesModalOpen(true)}>
                <Settings2 size={14} className="text-[#facc15]" /> قواعد الخصم التلقائي
              </SecondaryButton>
            </>
          ) : (
            <button
              onClick={() => setAddClientOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1c] px-4 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-[#222225] hover:text-white"
            >
              <Plus size={15} className="text-[#facc15]" />
              <span>+ Add New Client</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {formatFirstName(user.name)} Command Center
          </h1>
        </div>
      </div>

      {/* Dynamic Metrics Cards Grid from API */}
      {data.metrics && data.metrics.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((m, i) => (
            <MetricCard key={m.key || i} metric={m} index={i} />
          ))}
        </section>
      )}

      {/* Centralized Employee Requests Area (For CEO / Executives) */}
      {isExecutive && (
        <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/7 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                <FileSpreadsheet size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">منطقة طلبات الموظفين المركزية (Employee Requests)</h2>
                <p className="text-[11px] text-zinc-400">طلبات الإجازات، التفاوض السعري، والتعديلات المعلقة بانتظار اعتماد الإدارة.</p>
              </div>
            </div>
            <span className="rounded-full bg-[#facc15] px-2.5 py-0.5 text-[10px] font-black text-black">
              {employeeRequests.length} طلب
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {employeeRequests.slice(0, 6).map((req) => (
              <div
                key={`${req.request_type}-${req.id}`}
                className="rounded-xl border border-white/7 bg-[#1a1a1c] p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="rounded-full bg-[#facc15]/15 text-[#facc15] text-[9px] font-black px-2 py-0.5">
                      {req.type_label}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <strong className="block text-xs font-bold text-white">{req.employee?.name || "الموظف"}</strong>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{req.details}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{new Date(req.created_at).toLocaleDateString("ar-EG")}</span>
                  <Link href={req.request_type === "leave" ? "/hr" : "/sales"} className="text-[#facc15] font-bold hover:underline">
                    فحص واعتماد ←
                  </Link>
                </div>
              </div>
            ))}

            {employeeRequests.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-zinc-500">
                لا توجد طلبات موظفين معلقة حالياً.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Grid: Left (Opportunities) & Right (Widgets) */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] xl:grid-cols-[1.45fr_0.85fr]">
        {/* Left Section: Current Opportunities Table */}
        <section className="panel flex flex-col justify-between overflow-hidden bg-[#141415] border border-white/7 rounded-2xl p-5">
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1c1c1f] px-3 text-xs font-medium text-zinc-300 hover:bg-white/5 transition">
                  <Filter size={13} className="text-[#facc15]" />
                  <span>Filter</span>
                </button>

                <div className="relative min-w-[200px]">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search opportunities..."
                    className="h-9 w-full rounded-lg border border-white/10 bg-[#1c1c1f] pr-8 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
                  />
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                </div>
              </div>

              <span className="text-xs font-bold text-zinc-400">Current Opportunities & Retainers</span>
            </div>

            {/* Resolved Table with generous column padding and clear separation */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right">
                <thead>
                  <tr className="border-b border-white/7 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    <th className="px-3 pb-3 text-center w-12">ACTIONS</th>
                    <th className="px-3 pb-3 text-center w-24">STATUS</th>
                    <th className="px-3 pb-3 text-center w-24">PACKAGE</th>
                    <th className="px-5 pb-3 text-center w-36">DEAL VALUE</th>
                    <th className="px-5 pb-3 text-right min-w-[220px]">PROJECT DETAILS</th>
                    <th className="px-4 pb-3 text-right min-w-[140px]">CLIENT NAME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredLeads.map((lead) => {
                    const dealVal = lead.estimated_value || 0;
                    const clientName = lead.company || lead.name;

                    return (
                      <tr key={lead.id} className="group transition hover:bg-white/[0.02]">
                        {/* Actions */}
                        <td className="px-3 py-3.5 text-center">
                          <Link
                            href="/sales"
                            title="الانتقال للمسار"
                            className="inline-grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-[#facc15] hover:text-black"
                          >
                            <ArrowRight size={12} />
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          <StatusBadge status={lead.stage === "new" ? "active" : lead.stage} />
                        </td>

                        {/* Temperature / Source */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="rounded-full bg-[#facc15]/15 px-2 py-0.5 text-[9px] font-black text-[#facc15]">
                            {lead.source || "Direct Lead"}
                          </span>
                        </td>

                        {/* Deal Value */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <strong className="text-sm font-black text-[#facc15]">
                            {money(dealVal)}
                          </strong>
                        </td>

                        {/* Notes / Details */}
                        <td className="px-5 py-3.5 text-right text-zinc-300">
                          <span className="truncate max-w-[220px] block font-medium text-xs">
                            {lead.notes || "متابعة مسار المبيعات والتفاوض"}
                          </span>
                        </td>

                        {/* Client Name */}
                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          <span className="truncate max-w-[150px] block">{clientName}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                        لا توجد فرص مبيعات نشطة حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing {filteredLeads.length} active accounts</span>
            <Link href="/sales" className="text-xs font-bold text-[#facc15] hover:underline flex items-center gap-1">
              View all sales pipeline <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* Right Section: Executive Performance Widgets */}
        <div className="space-y-4">
          <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase text-center mb-3">
              AGENCY DAILY WORKFLOW
            </h3>
            <div className="grid grid-cols-3 divide-x divide-white/7 text-center">
              <div className="px-2">
                <strong className="block text-2xl font-black text-[#facc15]">{data.tasks?.reduce((acc, t) => acc + (t.count || 0), 0) ?? 0}</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">TASKS ACTIVE</span>
              </div>
              <div className="px-2">
                <strong className="block text-2xl font-black text-white">{usersList.length}</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">TEAM MEMBERS</span>
              </div>
              <div className="px-2">
                <strong className="block text-2xl font-black text-white">{employeeRequests.length}</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">REQUESTS</span>
              </div>
            </div>
          </article>

          {/* Revenue Target (Gold Glow) */}
          <article className="panel gold-glow bg-[#141415] rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Q3 REVENUE TARGET</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-zinc-400">Target: $0</span>
              <strong className="text-3xl font-black text-[#facc15]">$0</strong>
            </div>
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-[#facc15] transition-all duration-700" style={{ width: "0%" }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span>$0 REMAINING</span>
              <span className="text-zinc-200">0% PROGRESS</span>
            </div>
          </article>

          {/* Automatic Deduction Rules Status */}
          {isExecutive && (
            <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-rose-400" />
                  <h3 className="text-xs font-bold text-white">قواعد الخصم التلقائي النشطة</h3>
                </div>
                <button
                  onClick={() => setRulesModalOpen(true)}
                  className="text-[10px] text-[#facc15] font-bold hover:underline"
                >
                  إدارة القواعد
                </button>
              </div>

              <div className="space-y-2">
                {deductionRules.map((rule) => (
                  <div key={rule.id} className="rounded-xl bg-[#1c1c1f] p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-white text-[11px]">{rule.name}</strong>
                      <span className="text-[9px] text-zinc-500">{rule.event_type}</span>
                    </div>
                    <span className="font-bold text-rose-400 text-xs">-{money(Number(rule.amount))}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* MODAL: ADD NEW EMPLOYEE (CEO Action) */}
      <Modal open={addEmployeeOpen} onClose={() => setAddEmployeeOpen(false)} title="إضافة موظف جديد إلى الوكالة">
        <form onSubmit={handleAddEmployee} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="اسم الموظف الكامل">
            <input name="name" required placeholder="مثال: يوسف إبراهيم" className={inputClass} />
          </Field>
          <Field label="البريد الإلكتروني المهني">
            <input name="email" type="email" required placeholder="youssef@agency.local" className={inputClass} />
          </Field>
          <Field label="كلمة المرور المبدئية">
            <input name="password" type="password" required minLength={8} placeholder="8 أحرف على الأقل" className={inputClass} />
          </Field>
          <Field label="الدور الوظيفي / الصلاحية (Role)">
            <select name="role" required className={inputClass}>
              <option value="sales">مسؤول مبيعات (Sales)</option>
              <option value="sales_leader">مدير مبيعات (Sales Leader)</option>
              <option value="account_manager">مدير حسابات (Account Manager)</option>
              <option value="designer">مصمم جرافيك (Designer)</option>
              <option value="video_editor">مونتير فيديو (Video Editor)</option>
              <option value="content_creator">صانع محتوى (Content Creator)</option>
              <option value="art_director">مدير فني (Art Director)</option>
              <option value="production">مسؤول إنتاج وتصوير (Production)</option>
              <option value="finance">مالية وحسابات (Finance)</option>
              <option value="quality">مراقبة جودة (Quality)</option>
              <option value="hr">موارد بشرية (HR)</option>
            </select>
          </Field>
          <Field label="المسمى الوظيفي (Job Title)">
            <input name="job_title" placeholder="Senior Motion Designer" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input name="phone" placeholder="+20 100 000 0000" className={inputClass} />
          </Field>
          <Field label="التارجت الشهري (إن وجد)">
            <input name="target" type="number" defaultValue={0} className={inputClass} />
          </Field>
          <Field label="نسبة العمولة % (للمبيعات)">
            <input name="commission_percentage" type="number" min={0} max={100} defaultValue={10} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setAddEmployeeOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <UserPlus size={15} /> إنشاء حساب الموظف
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: APPLY DEDUCTION (CEO / HR Action) */}
      <Modal open={addDeductionOpen} onClose={() => setAddDeductionOpen(false)} title="تسجيل خصم / جزاء على موظف أو قسم">
        <form onSubmit={handleApplyDeduction} className="space-y-4 text-right">
          <Field label="اختر الموظفين المعنيين">
            <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl border border-white/8 bg-[#1a1a1c] p-2.5">
              {usersList.map((u) => {
                const checked = selectedUserIds.includes(u.id);
                return (
                  <label key={u.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
                    <span className="text-white">{u.name} ({u.job_title || u.role})</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                        else setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                      }}
                      className="accent-[#facc15]"
                    />
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="قيمة الخصم ($ / EGP)">
            <input
              type="number"
              required
              min={1}
              value={deductionAmount}
              onChange={(e) => setDeductionAmount(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field label="سبب الخصم / الجزاء">
            <input
              required
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              placeholder="تأخر متكرر، عدم الالتزام بمعايير الجودة، مخالفة السياسات..."
              className={inputClass}
            />
          </Field>

          <Field label="ملاحظات تفصيلية">
            <textarea
              value={deductionNotes}
              onChange={(e) => setDeductionNotes(e.target.value)}
              placeholder="تفاصيل إضافية تظهر في سجل الموظف..."
              className={textareaClass}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setAddDeductionOpen(false)}>
              إلغاء
            </SecondaryButton>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500"
            >
              <Gavel size={14} /> تطبيق الخصم
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DEDUCTION RULES MANAGER */}
      <Modal open={rulesModalOpen} onClose={() => setRulesModalOpen(false)} title="قواعد الخصم التلقائي للوكالة">
        <div className="space-y-4 text-right">
          <p className="text-xs text-zinc-400">
            تطبق هذه القواعد تلقائياً عند وقوع الحدث (مثل تأخر الحضور أكثر من الحد المسموح أو تجاوز موعد التسليم) وتمنع التكرار تلقائياً.
          </p>

          <div className="space-y-2.5">
            {deductionRules.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-white">{r.name}</strong>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">{r.description}</span>
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-rose-400">-{money(Number(r.amount))}</span>
                  <span className="text-[9px] text-emerald-400 font-bold">نشط</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <SecondaryButton onClick={() => setRulesModalOpen(false)}>إغلاق</SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* New Client Modal */}
      <Modal open={addClientOpen} onClose={() => setAddClientOpen(false)} title="إضافة عميل جديد">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name")),
              industry: String(fd.get("industry") || "Marketing"),
              contact_name: String(fd.get("contact_name") || ""),
              contact_phone: String(fd.get("contact_phone") || ""),
              contact_email: String(fd.get("contact_email") || ""),
              status: "active",
              health_score: 90,
            };
            try {
              await api("/clients", { method: "POST", body: JSON.stringify(payload) });
              toast.success("تمت إضافة العميل بنجاح");
              setAddClientOpen(false);
            } catch {
              toast.error("فشل حفظ العميل");
            }
          }}
          className="grid gap-4 md:grid-cols-2 text-right"
        >
          <Field label="اسم العميل / الشركة">
            <input name="name" required placeholder="مثال: TechNova Solutions" className={inputClass} />
          </Field>
          <Field label="المجال">
            <input name="industry" placeholder="Technology, Healthcare..." className={inputClass} />
          </Field>
          <Field label="اسم الشخص المسؤول">
            <input name="contact_name" placeholder="Ahmed Al-Farsi" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input name="contact_phone" required placeholder="+20 100 000 0000" className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setAddClientOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Plus size={14} /> حفظ العميل
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
