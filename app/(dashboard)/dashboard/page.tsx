"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { PackageBadge, StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockDashboard, mockLeads, mockTasks } from "@/lib/mock-data";
import type { Client, DashboardData, Lead, Task } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckSquare,
  ChevronRight,
  Filter,
  Flame,
  Mail,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  Square,
  Star,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const fallback = useMemo(() => mockDashboard(user?.role), [user?.role]);
  const [data, setData] = useState<DashboardData>(fallback);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addClientOpen, setAddClientOpen] = useState(false);

  // Daily Tasks Checklist State
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, text: "Follow up with Acme Corp", completed: false },
    { id: 2, text: "Update CRM records", completed: true },
    { id: 3, text: "Prepare Globex Proposal", completed: false },
    { id: 4, text: "Send revised contract to Initech", completed: false },
  ]);

  async function load() {
    setLoading(true);
    try {
      const [dashData, leadsData] = await Promise.all([
        api<DashboardData>("/dashboard"),
        api<{ data: Lead[] }>("/leads?per_page=20"),
      ]);
      setData(dashData);
      if (leadsData?.data) setLeads(leadsData.data);
    } catch {
      setData(fallback);
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [fallback]);

  if (!user) return null;

  const toggleTask = (id: number) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filteredLeads = leads
    .filter((l) =>
      (l.name + " " + (l.company ?? "")).toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  const formatFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setAddClientOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1c] px-4 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-[#222225] hover:text-white"
        >
          <Plus size={15} className="text-[#facc15]" />
          <span>+ Add New Client</span>
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {formatFirstName(user.name)} Dashboard
          </h1>
        </div>
      </div>

      {/* Main Grid: Left (Opportunities) & Right (Widgets) */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] xl:grid-cols-[1.45fr_0.85fr]">
        {/* Left Section: Current Opportunities Table */}
        <section className="panel flex flex-col justify-between overflow-hidden bg-[#141415] border border-white/7 rounded-2xl p-5">
          <div>
            {/* Table Header Controls */}
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

              <span className="text-xs font-bold text-zinc-400">Current Opportunities</span>
            </div>

            {/* Opportunities Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-right">
                <thead>
                  <tr className="border-b border-white/7 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    <th className="pb-3 text-center">ACTIONS</th>
                    <th className="pb-3 text-center">STATUS</th>
                    <th className="pb-3 text-center">PACKAGE</th>
                    <th className="pb-3 text-left">DEAL VALUE</th>
                    <th className="pb-3 text-right">PROJECT DETAILS</th>
                    <th className="pb-3 text-right">CLIENT NAME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead, idx) => {
                    const packages = ["ELITE", "PRO", "BASIC", "ELITE"];
                    const packageName = packages[idx % packages.length];
                    const dealVal = lead.estimated_value || 45000 + idx * 15000;
                    const projectNames = [
                      "Brand Growth & Retainer",
                      "Product Launch Video Series",
                      "Report Design & Web Interactive",
                      "Crisis Management PR Campaign",
                      "Social Media Strategy & Paid Ads",
                      "Visual Identity Overhaul",
                    ];
                    const projectName = projectNames[idx % projectNames.length];
                    const clientName = lead.company || lead.name;

                    const isAssigned = idx === 2;

                    return (
                      <tr key={lead.id} className="group transition hover:bg-white/[0.02]">
                        {/* Actions */}
                        <td className="py-3.5 text-center">
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#242428] px-2 py-1 text-[9px] font-bold text-zinc-300">
                              <UserCheck size={11} className="text-[#facc15]" />
                              ASSIGN
                            </span>
                          ) : (
                            <button
                              title="Play / Open"
                              className="inline-grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
                            >
                              <Play size={12} className="fill-current" />
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 text-center">
                          <StatusBadge status={lead.stage === "new" ? (idx % 2 === 0 ? "active" : "negotiation") : lead.stage} />
                        </td>

                        {/* Package */}
                        <td className="py-3.5 text-center">
                          <PackageBadge name={packageName} />
                        </td>

                        {/* Deal Value */}
                        <td className="py-3.5 text-left">
                          <strong className="text-sm font-black text-[#facc15]">
                            ${(dealVal).toLocaleString()}
                          </strong>
                        </td>

                        {/* Project Details */}
                        <td className="py-3.5 text-right text-xs text-zinc-300">
                          <span className="truncate max-w-[180px] block">{projectName}</span>
                        </td>

                        {/* Client Name */}
                        <td className="py-3.5 text-right text-xs font-bold text-white">
                          <span className="truncate max-w-[130px] block">{clientName}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing {filteredLeads.length} active opportunities</span>
            <Link href="/sales" className="text-xs font-bold text-[#facc15] hover:underline flex items-center gap-1">
              View all sales pipeline <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* Right Section: Executive Widgets Stack */}
        <div className="space-y-4">
          {/* Widget 1: DAILY PERFORMANCE */}
          <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase text-center mb-3">
              DAILY PERFORMANCE
            </h3>
            <div className="grid grid-cols-3 divide-x divide-white/7 text-center">
              <div className="px-2">
                <strong className="block text-2xl font-black text-[#facc15]">24</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">CALLS</span>
              </div>
              <div className="px-2">
                <strong className="block text-2xl font-black text-white">6</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">MEETINGS</span>
              </div>
              <div className="px-2">
                <strong className="block text-2xl font-black text-white">12%</strong>
                <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-zinc-500 uppercase">CONV.</span>
              </div>
            </div>
          </article>

          {/* Widget 2: PERFORMANCE RATING */}
          <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5 text-center">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
              PERFORMANCE RATING
            </h3>
            <div className="flex items-center justify-center gap-1 text-[#facc15] mb-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} className="fill-[#facc15] text-[#facc15]" />
              ))}
            </div>
            <strong className="block text-lg font-black text-white">Excellent</strong>
            <span className="mt-0.5 block text-[10px] font-bold tracking-wider text-[#facc15] uppercase">
              TOP 5% OF REGION
            </span>
          </article>

          {/* Widget 3: Q3 REVENUE TARGET (With Gold Glowing Border) */}
          <article className="panel gold-glow bg-[#141415] rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Q3 REVENUE TARGET</span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-zinc-400">Goal: $150k</span>
              <strong className="text-3xl font-black text-[#facc15]">$75,000</strong>
            </div>

            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-[#facc15] transition-all duration-700" style={{ width: "50%" }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span>$75k REMAINING</span>
              <span className="text-zinc-200">50% PROGRESS</span>
            </div>
          </article>

          {/* Widget 4: ATTENTION REQUIRED */}
          <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">
              ATTENTION REQUIRED
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-[#1c1c1f] p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ArrowRight size={14} className="text-zinc-500" />
                  <div>
                    <strong className="block text-xs text-white">Globex Inc Proposal</strong>
                    <span className="text-[10px] text-zinc-500">Due in 2 hours</span>
                  </div>
                </div>
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#1c1c1f] p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ArrowRight size={14} className="text-zinc-500" />
                  <div>
                    <strong className="block text-xs text-white">Acme Corp Feedback</strong>
                    <span className="text-[10px] text-zinc-500">Awaiting revision estimates</span>
                  </div>
                </div>
                <Mail size={16} className="text-[#facc15] shrink-0" />
              </div>
            </div>
          </article>

          {/* Widget 5: DAILY TASKS (Checklist) */}
          <article className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">
              DAILY TASKS
            </h3>
            <div className="space-y-2">
              {dailyTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#1c1c1f] p-2.5 text-right transition hover:bg-white/5"
                >
                  <span
                    className={`text-xs ${
                      t.completed ? "text-zinc-500 line-through" : "text-zinc-300 font-medium"
                    }`}
                  >
                    {t.text}
                  </span>
                  <span className="text-[#facc15]">
                    {t.completed ? <CheckSquare size={16} className="fill-[#facc15] text-black" /> : <Square size={16} />}
                  </span>
                </button>
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* New Client Modal */}
      <NewClientModal
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onCreated={(client) => {
          setAddClientOpen(false);
          toast.success("تمت إضافة العميل بنجاح");
        }}
      />
    </div>
  );
}

function NewClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Client) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      industry: String(fd.get("industry") || "Marketing"),
      primary_color: "#facc15",
      secondary_color: "#111",
      contact_name: String(fd.get("contact_name") || ""),
      contact_email: String(fd.get("contact_email") || ""),
      contact_phone: String(fd.get("contact_phone") || ""),
      status: "active",
      health_score: 95,
    };

    try {
      const client = await api<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(client);
    } catch {
      onCreated({
        ...payload,
        id: Date.now(),
        health_score: 90,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="إضافة عميل جديد">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="اسم الشركة / العميل">
          <input name="name" required placeholder="مثال: TechNova Solutions" className={inputClass} />
        </Field>
        <Field label="المجال / Industry">
          <input name="industry" placeholder="Technology, E-commerce, Healthcare..." className={inputClass} />
        </Field>
        <Field label="اسم الشخص المسؤول">
          <input name="contact_name" placeholder="Ahmed Al-Farsi" className={inputClass} />
        </Field>
        <Field label="رقم الهاتف">
          <input name="contact_phone" placeholder="+971 50 123 4567" className={inputClass} />
        </Field>
        <Field label="البريد الإلكتروني" className="md:col-span-2">
          <input name="contact_email" type="email" placeholder="contact@example.com" className={inputClass} />
        </Field>
        <div className="flex justify-end gap-2 md:col-span-2 pt-2">
          <SecondaryButton type="button" onClick={onClose}>
            إلغاء
          </SecondaryButton>
          <PrimaryButton disabled={saving}>
            <UserPlus size={15} />
            {saving ? "جاري الحفظ..." : "حفظ العميل"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
