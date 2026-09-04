"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import type {
  AttendanceRecord,
  AutomaticDeductionRule,
  DeductionEventLogItem,
  EmployeeAdjustment,
  EmployeeContractItem,
  LeaveRequestItem,
  Metric,
  Paginated,
  PayrollItem,
  User,
} from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Coins,
  Contact,
  Download,
  FileCheck2,
  FileText,
  Gift,
  HelpCircle,
  History,
  Layers,
  LogIn,
  LogOut,
  MinusCircle,
  MoreHorizontal,
  Plus,
  PlusCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Empty Fallback Data
const DEMO_USERS: User[] = [];
const DEMO_ATTENDANCE: AttendanceRecord[] = [];
const DEMO_LEAVES: LeaveRequestItem[] = [];
const DEMO_PAYROLLS: PayrollItem[] = [];
const DEMO_CONTRACTS: EmployeeContractItem[] = [];
const DEMO_ADJUSTMENTS: EmployeeAdjustment[] = [];
const DEMO_RULES: AutomaticDeductionRule[] = [];

export default function HRPage() {
  const { user } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves" | "payrolls" | "contracts" | "deductions">("attendance");
  const [deductionsSubTab, setDeductionsSubTab] = useState<"adjustments" | "rules" | "history">("adjustments");

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7) + "-01");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Entities Data States
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [contracts, setContracts] = useState<EmployeeContractItem[]>([]);
  const [adjustments, setAdjustments] = useState<EmployeeAdjustment[]>([]);
  const [rules, setRules] = useState<AutomaticDeductionRule[]>([]);
  const [historyLogs, setHistoryLogs] = useState<DeductionEventLogItem[]>([]);

  // Modals States
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [bulkDeductionOpen, setBulkDeductionOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Selected for Edit / Action
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);

  // Load All Data from Backend
  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      api<User[]>("/users")
        .then((res) => { if (Array.isArray(res)) setUsers(res); })
        .catch(() => {});

      // 2. Fetch Attendance
      api<Paginated<AttendanceRecord>>(`/hr/attendance?date=${selectedDate}&per_page=100`)
        .then((res) => { if (res?.data) setAttendances(res.data); else setAttendances([]); })
        .catch(() => { setAttendances([]); });

      // 3. Fetch Leaves
      api<Paginated<LeaveRequestItem>>("/hr/leaves?per_page=100")
        .then((res) => { if (res?.data) setLeaves(res.data); else setLeaves([]); })
        .catch(() => { setLeaves([]); });

      // 4. Fetch Payrolls
      api<Paginated<PayrollItem>>(`/hr/payrolls?month=${selectedMonth}&per_page=100`)
        .then((res) => { if (res?.data) setPayrolls(res.data); else setPayrolls([]); })
        .catch(() => { setPayrolls([]); });

      // 5. Fetch Contracts
      api<Paginated<EmployeeContractItem>>("/hr/contracts?per_page=100")
        .then((res) => { if (res?.data) setContracts(res.data); else setContracts([]); })
        .catch(() => { setContracts([]); });

      // 6. Fetch Adjustments
      api<Paginated<EmployeeAdjustment>>("/hr/adjustments?per_page=100")
        .then((res) => { if (res?.data) setAdjustments(res.data); else setAdjustments([]); })
        .catch(() => { setAdjustments([]); });

      // 7. Fetch Rules
      api<AutomaticDeductionRule[]>("/hr/deductions/rules")
        .then((res) => { if (Array.isArray(res)) setRules(res); else setRules([]); })
        .catch(() => { setRules([]); });

      // 8. Fetch History
      api<Paginated<DeductionEventLogItem>>("/hr/deductions/history?per_page=100")
        .then((res) => { if (res?.data) setHistoryLogs(res.data); else setHistoryLogs([]); })
        .catch(() => { setHistoryLogs([]); });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedDate, selectedMonth]);

  // Check Self Attendance State
  const myTodayAttendance = useMemo(() => {
    if (!user) return null;
    return attendances.find((a) => a.user_id === user.id);
  }, [attendances, user]);

  // Self Check-in Handler
  const handleSelfCheckIn = async () => {
    try {
      const res = await api<AttendanceRecord>("/hr/check-in", { method: "POST" });
      toast.success("تم تسجيل حضورك بنجاح! يومك سعيد ومثمر 🌟");
      if (res?.id) {
        setAttendances((prev) => {
          const idx = prev.findIndex((a) => a.id === res.id || a.user_id === user?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res;
            return next;
          }
          return [res, ...prev];
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "تعذر تسجيل الحضور");
    }
  };

  // Self Check-out Handler
  const handleSelfCheckOut = async () => {
    try {
      const res = await api<AttendanceRecord>("/hr/check-out", { method: "POST" });
      toast.success("تم تسجيل انصرافك بنجاح! نتمنى لك وقتاً ممتعاً 🏠");
      if (res?.id) {
        setAttendances((prev) => {
          const idx = prev.findIndex((a) => a.id === res.id || a.user_id === user?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res;
            return next;
          }
          return [res, ...prev];
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "تعذر تسجيل الانصراف");
    }
  };

  // Review Leave Request (Approve / Reject)
  const handleReviewLeave = async (id: number, status: "approved" | "rejected") => {
    try {
      await api(`/hr/leaves/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status, reviewer: user ?? undefined, reviewed_at: new Date().toISOString() }
            : l
        )
      );
      toast.success(status === "approved" ? "تم اعتماد طلب الإجازة بنجاح ✅" : "تم رفض طلب الإجازة ❌");
    } catch (e: any) {
      toast.error(e?.message || "تعذر تحديث حالة الإجازة");
    }
  };

  // Create Manual Attendance
  const handleSaveAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      user_id: Number(fd.get("user_id")),
      date: fd.get("date") as string,
      check_in: (fd.get("check_in") as string) || null,
      check_out: (fd.get("check_out") as string) || null,
      status: fd.get("status") as string,
      minutes_late: Number(fd.get("minutes_late") || 0),
      notes: (fd.get("notes") as string) || null,
    };

    try {
      const res = await api<AttendanceRecord>("/hr/attendance/record", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم حفظ سجل الحضور بنجاح");
      setManualAttendanceOpen(false);
      setEditingAttendance(null);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل حفظ سجل الحضور");
    }
  };

  // Create Leave Request
  const handleCreateLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = Number(fd.get("user_id")) || user?.id || 1;
    const payload = {
      user_id: userId,
      type: fd.get("type") as string,
      starts_at: fd.get("starts_at") as string,
      ends_at: fd.get("ends_at") as string,
      days: Number(fd.get("days") || 1),
      reason: fd.get("reason") as string,
    };

    try {
      const res = await api<LeaveRequestItem>("/hr/leaves", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم إرسال طلب الإجازة بنجاح وهو قيد المراجعة 📩");
      setLeaveModalOpen(false);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل تقديم طلب الإجازة");
    }
  };

  // Create/Update Payroll
  const handleSavePayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const base_salary = Number(fd.get("base_salary") || 0);
    const bonuses = Number(fd.get("bonuses") || 0);
    const commissions = Number(fd.get("commissions") || 0);
    const deductions = Number(fd.get("deductions") || 0);
    const net_salary = base_salary + bonuses + commissions - deductions;

    const payload = {
      user_id: Number(fd.get("user_id")),
      period_month: fd.get("period_month") as string,
      base_salary,
      bonuses,
      commissions,
      deductions,
      status: fd.get("status") as string,
      payment_reference: fd.get("payment_reference") as string,
    };

    try {
      const res = await api<PayrollItem>("/hr/payrolls", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم حفظ مسير الراتب بنجاح 💵");
      setPayrollModalOpen(false);
      setEditingPayroll(null);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل حفظ مسير الراتب");
    }
  };

  // Create Contract
  const handleCreateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      user_id: Number(fd.get("user_id")),
      contract_type: fd.get("contract_type") as string,
      starts_at: fd.get("starts_at") as string,
      ends_at: (fd.get("ends_at") as string) || null,
      base_salary: Number(fd.get("base_salary") || 0),
      currency: (fd.get("currency") as string) || "EGP",
      status: fd.get("status") as string,
      notes: (fd.get("notes") as string) || null,
    };

    try {
      const res = await api<EmployeeContractItem>("/hr/contracts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم توثيق عقد الموظف بنجاح 📄");
      setContractModalOpen(false);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل حفظ العقد");
    }
  };

  // Create Adjustment (Bonus / Penalty / Allowance / Deduction)
  const handleCreateAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      user_id: Number(fd.get("user_id")),
      type: fd.get("type") as "bonus" | "penalty" | "allowance" | "deduction",
      amount: Number(fd.get("amount")),
      effective_date: fd.get("effective_date") as string,
      reason: fd.get("reason") as string,
      notes: (fd.get("notes") as string) || null,
    };

    try {
      const res = await api<EmployeeAdjustment>("/hr/adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم تسجيل التعديل المالي بنجاح ⚡");
      setAdjustmentModalOpen(false);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل تسجيل التعديل المالي");
    }
  };

  // Bulk Deduction Handler
  const handleBulkDeduction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const reason = fd.get("reason") as string;
    const selectedIds = users.map((u) => u.id); // Or specific subset

    try {
      await api("/hr/deductions/bulk", {
        method: "POST",
        body: JSON.stringify({ user_ids: selectedIds, amount, reason }),
      });
      toast.success(`تم تطبيق الخصم بنجاح على ${selectedIds.length} موظف ✅`);
      setBulkDeductionOpen(false);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل تطبيق الخصم المجمع");
    }
  };

  // Create Automatic Rule
  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      event_type: fd.get("event_type") as string,
      deduction_type: "fixed" as const,
      amount: Number(fd.get("amount")),
      threshold_minutes: Number(fd.get("threshold_minutes") || 15),
      description: fd.get("description") as string,
      is_active: true,
    };

    try {
      const res = await api<AutomaticDeductionRule>("/hr/deductions/rules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم إنشاء وتفعيل قاعدة الخصم التلقائي بنجاح ⚙️");
      setRuleModalOpen(false);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "فشل حفظ وتفعيل قاعدة الخصم");
    }
  };

  // Export Attendance CSV Report
  const exportAttendanceCSV = () => {
    const headers = ["المعرف", "اسم الموظف", "البريد الإلكتروني", "الدور الوظيفي", "التاريخ", "وقت الحضور", "وقت الانصراف", "دقائق التأخير", "الحالة", "ملاحظات"];
    const rows = attendances.map((a) => [
      a.id,
      a.user?.name || "—",
      a.user?.email || "—",
      getRoleLabel(a.user?.role) || "—",
      a.date,
      a.check_in || "—",
      a.check_out || "—",
      a.minutes_late || 0,
      a.status === "present" ? "حاضر" : a.status === "late" ? "متأخر" : "غائب",
      `"${a.notes || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير كشف الحضور بنجاح 📊");
  };

  // Export Payroll CSV Report
  const exportPayrollCSV = () => {
    const headers = ["المعرف", "اسم الموظف", "الشهر", "الراتب الأساسي", "المكافآت", "العمولات", "الخصومات", "صافي الراتب", "الحالة", "الرقم المرجعي"];
    const rows = payrolls.map((p) => [
      p.id,
      p.user?.name || "—",
      p.period_month,
      p.base_salary,
      p.bonuses,
      p.commissions,
      p.deductions,
      p.net_salary,
      p.status,
      `"${p.payment_reference || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير مسير الرواتب بنجاح 💵");
  };

  // Filtered Datasets
  const filteredAttendance = useMemo(() => {
    return attendances.filter((a) => {
      const matchSearch = (a.user?.name + " " + a.user?.email + " " + (a.notes || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [attendances, search, statusFilter]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchSearch = (l.user?.name + " " + l.type + " " + (l.reason || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      return true;
    });
  }, [leaves, search, statusFilter]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const matchSearch = (p.user?.name + " " + (p.payment_reference || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [payrolls, search, statusFilter]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch = (c.user?.name + " " + c.contract_type + " " + (c.notes || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, search, statusFilter]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      const matchSearch = (a.user?.name + " " + a.reason + " " + a.type).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && a.type !== statusFilter) return false;
      return true;
    });
  }, [adjustments, search, statusFilter]);

  // Dynamic Key Metrics
  const metrics: Metric[] = useMemo(() => {
    const presentCount = attendances.filter((a) => a.status === "present").length;
    const lateCount = attendances.filter((a) => a.minutes_late > 15 || a.status === "late").length;
    const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
    const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

    return [
      { key: "employees", label: "إجمالي موظفي الوكالة", value: users.length },
      { key: "present", label: "الحضور اليوم", value: presentCount },
      { key: "late", label: "تأخيرات الصباح (> 15 د)", value: lateCount },
      { key: "leaves", label: "طلبات إجازة معلقة", value: pendingLeaves },
      { key: "payroll", label: "إجمالي رواتب الشهر", value: totalPayroll, format: "currency" },
    ];
  }, [users, attendances, leaves, payrolls]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <SectionHeader
        eyebrow="People Operations & HR Command"
        title="Human Resources Management"
        description="مركز العمليات الإدارية المتكامل: الحضور والانصراف، التحقق بالبصمة، الإجازات، مسيرات الرواتب، العقود، والجزاءات التلقائية."
        icon={Contact}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Self Check-in / Out Buttons */}
            {!myTodayAttendance?.check_in ? (
              <button
                onClick={handleSelfCheckIn}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 text-xs font-black text-black shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                <LogIn size={15} />
                <span>تسجيل حضوري الآن</span>
              </button>
            ) : !myTodayAttendance?.check_out ? (
              <button
                onClick={handleSelfCheckOut}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 text-xs font-black text-black shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <LogOut size={15} />
                <span>تسجيل انصرافي</span>
              </button>
            ) : (
              <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={15} />
                <span>اكتمل دوام اليوم</span>
              </div>
            )}

            {/* Quick Actions Menu */}
            {activeTab === "attendance" && (
              <>
                <button
                  onClick={exportAttendanceCSV}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
                >
                  <Download size={14} className="text-[#facc15]" />
                  <span>تصدير الكشف</span>
                </button>
                <button
                  onClick={() => { setEditingAttendance(null); setManualAttendanceOpen(true); }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black transition active:scale-95"
                >
                  <Plus size={14} />
                  <span>+ تسجيل حضور يدوي</span>
                </button>
              </>
            )}

            {activeTab === "leaves" && (
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black transition active:scale-95"
              >
                <Plus size={14} />
                <span>+ طلب إجازة جديد</span>
              </button>
            )}

            {activeTab === "payrolls" && (
              <>
                <button
                  onClick={exportPayrollCSV}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
                >
                  <Download size={14} className="text-[#facc15]" />
                  <span>تصدير الرواتب</span>
                </button>
                <button
                  onClick={() => { setEditingPayroll(null); setPayrollModalOpen(true); }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black transition active:scale-95"
                >
                  <Plus size={14} />
                  <span>+ مسير راتب جديد</span>
                </button>
              </>
            )}

            {activeTab === "contracts" && (
              <button
                onClick={() => setContractModalOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black transition active:scale-95"
              >
                <Plus size={14} />
                <span>+ توثيق عقد موظف</span>
              </button>
            )}

            {activeTab === "deductions" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBulkDeductionOpen(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 text-xs font-bold text-rose-300 transition"
                >
                  <Users size={14} />
                  <span>خصم جماعي</span>
                </button>
                <button
                  onClick={() => setAdjustmentModalOpen(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black transition active:scale-95"
                >
                  <Plus size={14} />
                  <span>+ خصم / مكافأة</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Live KPIs Top Bar */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Main Tab Navigation Header */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "attendance", label: "الحضور والانصراف", icon: Clock, count: attendances.length },
            { id: "leaves", label: "طلبات الإجازات", icon: CalendarDays, count: leaves.filter((l) => l.status === "pending").length, badgeColor: "bg-amber-400 text-black font-black" },
            { id: "payrolls", label: "مسيرات الرواتب", icon: Coins, count: payrolls.length },
            { id: "contracts", label: "عقود الموظفين", icon: FileCheck2, count: contracts.length },
            { id: "deductions", label: "الجزاءات والمكافآت التلقائية", icon: Zap, count: adjustments.length },
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
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      active ? "bg-black/20 text-black font-extrabold" : t.badgeColor || "bg-white/10 text-zinc-300"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Refresh Button */}
        <button
          onClick={refreshData}
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c1c1f] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="تحديث البيانات"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#facc15]" : ""} />
        </button>
      </div>

      {/* TAB 1: ATTENDANCE & SHIFT HUB */}
      {activeTab === "attendance" && (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-[#1c1c1f] px-3 py-1.5 rounded-xl border border-white/8">
                  <Calendar size={14} className="text-[#facc15]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                  />
                </div>

                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none focus:border-[#facc15]/50"
                >
                  <option value="all">كل الحالات (الكل)</option>
                  <option value="present">حاضر (Present)</option>
                  <option value="late">متأخر (Late)</option>
                  <option value="absent">غائب (Absent)</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو البريد..."
                  className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-right">
                <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-3.5">الموظف</th>
                    <th className="p-3.5">القسم / الدور</th>
                    <th className="p-3.5">وقت الحضور</th>
                    <th className="p-3.5">وقت الانصراف</th>
                    <th className="p-3.5">التأخير</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">ملاحظات</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-zinc-500">
                        لا توجد سجلات حضور مسجلة لهذا التاريخ أو الفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={a.user?.name || "User"} size="sm" />
                            <div>
                              <strong className="block text-xs font-bold text-white">{a.user?.name}</strong>
                              <span className="text-[10px] text-zinc-500">{a.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                            {getRoleLabel(a.user?.role) || a.user?.job_title || "—"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-xs font-bold text-zinc-200">
                          {a.check_in ? a.check_in.slice(11, 16) || a.check_in : "—"}
                        </td>
                        <td className="p-3.5 font-mono text-xs font-bold text-zinc-200">
                          {a.check_out ? a.check_out.slice(11, 16) || a.check_out : "—"}
                        </td>
                        <td className="p-3.5">
                          {a.minutes_late > 0 ? (
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              a.minutes_late >= 15 ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "bg-amber-500/10 text-amber-300"
                            }`}>
                              <Clock size={10} />
                              <span>{a.minutes_late} دقيقة</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold">في الموعد</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="p-3.5 text-xs text-zinc-400 max-w-[140px] truncate" title={a.notes || ""}>
                          {a.notes || "—"}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => { setEditingAttendance(a); setManualAttendanceOpen(true); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300 transition"
                          >
                            <span>تعديل</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          {/* Attendance Sidebar Widget */}
          <aside className="space-y-4">
            <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">TODAY SUMMARY</span>
                  <h2 className="mt-0.5 text-base font-bold text-white">إحصائيات وردية اليوم</h2>
                </div>
                <span className="rounded-lg bg-[#facc15]/10 px-2 py-1 text-[10px] font-bold text-[#facc15] font-mono">
                  {selectedDate}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { icon: UserCheck, label: "الموظفون الحاضرون", value: attendances.filter((a) => a.status === "present").length, color: "text-emerald-400 bg-emerald-500/10" },
                  { icon: Clock3, label: "المتأخرون عن الدوام", value: attendances.filter((a) => a.minutes_late > 0 || a.status === "late").length, color: "text-amber-400 bg-amber-500/10" },
                  { icon: UserMinus, label: "الغياب اليوم", value: attendances.filter((a) => a.status === "absent").length, color: "text-rose-400 bg-rose-500/10" },
                  { icon: CalendarDays, label: "في إجازة رسمية", value: leaves.filter((l) => l.status === "approved").length, color: "text-[#facc15] bg-[#facc15]/10" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-[#1c1c1f] p-3 border border-white/5">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1 text-xs font-semibold text-zinc-300">{label}</span>
                    <strong className="text-base font-black text-white">{value}</strong>
                  </div>
                ))}
              </div>

              {/* Automatic Deduction Alert Box */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-white font-bold">قاعدة الخصم التلقائي للتأخير</strong>
                    <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                      أي موظف يتجاوز تأخيره <strong>15 دقيقة</strong> (بعد 09:15 ص) يتم تسجيل خصم آلي بقيمة 100 ج في حسابه مع إرسال إشعار فوري.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </section>
      )}

      {/* TAB 2: LEAVES MANAGEMENT */}
      {activeTab === "leaves" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كافة الطلبات (الكل)</option>
                <option value="pending">قيد المراجعة (Pending)</option>
                <option value="approved">تمت الموافقة (Approved)</option>
                <option value="rejected">مرفوض (Rejected)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الإجازات..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredLeaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                لا توجد طلبات إجازة تطابق البحث المحدد.
              </div>
            ) : (
              filteredLeaves.map((l) => (
                <div key={l.id} className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={l.user?.name || "User"} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-white">{l.user?.name}</strong>
                        <span className="rounded-md bg-[#facc15]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#facc15]">
                          {l.type}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">({l.days} أيام)</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        من <strong className="text-zinc-200">{l.starts_at}</strong> إلى <strong className="text-zinc-200">{l.ends_at}</strong>
                      </p>
                      {l.reason && (
                        <p className="text-xs text-zinc-400 mt-1 italic bg-white/5 px-2.5 py-1 rounded-lg inline-block">
                          "{l.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={l.status} />

                    {l.status === "pending" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleReviewLeave(l.id, "approved")}
                          className="flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 transition"
                        >
                          <Check size={14} />
                          <span>قبول</span>
                        </button>
                        <button
                          onClick={() => handleReviewLeave(l.id, "rejected")}
                          className="flex items-center gap-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 transition"
                        >
                          <X size={14} />
                          <span>رفض</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      )}

      {/* TAB 3: PAYROLLS & COMPENSATIONS */}
      {activeTab === "payrolls" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Month Picker */}
              <div className="flex items-center gap-2 bg-[#1c1c1f] px-3 py-1.5 rounded-xl border border-white/8">
                <Calendar size={14} className="text-[#facc15]" />
                <input
                  type="month"
                  value={selectedMonth.slice(0, 7)}
                  onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل الحالات (الكل)</option>
                <option value="draft">مسودة (Draft)</option>
                <option value="approved">معتمد (Approved)</option>
                <option value="paid">تم الصرف (Paid)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الرواتب..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">الشهر</th>
                  <th className="p-3.5">الأساسي</th>
                  <th className="p-3.5 text-emerald-400">مكافآت (+)</th>
                  <th className="p-3.5 text-emerald-400">عمولات (+)</th>
                  <th className="p-3.5 text-rose-400">خصومات (-)</th>
                  <th className="p-3.5 text-[#facc15]">صافي الراتب</th>
                  <th className="p-3.5">حالة الصرف</th>
                  <th className="p-3.5">المرجع</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد مسيرات رواتب مسجلة لهذا الشهر.
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.user?.name || "User"} size="sm" />
                          <div>
                            <strong className="block text-xs font-bold text-white">{p.user?.name}</strong>
                            <span className="text-[10px] text-zinc-500">{p.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-zinc-400">{p.period_month.slice(0, 7)}</td>
                      <td className="p-3.5 font-mono text-xs text-zinc-300">{money(Number(p.base_salary))}</td>
                      <td className="p-3.5 font-mono text-xs font-bold text-emerald-400">+{money(Number(p.bonuses))}</td>
                      <td className="p-3.5 font-mono text-xs font-bold text-emerald-400">+{money(Number(p.commissions))}</td>
                      <td className="p-3.5 font-mono text-xs font-bold text-rose-400">-{money(Number(p.deductions))}</td>
                      <td className="p-3.5 font-mono text-xs font-black text-[#facc15]">
                        {money(Number(p.net_salary))}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-zinc-400">{p.payment_reference || "—"}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => { setEditingPayroll(p); setPayrollModalOpen(true); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-zinc-300 transition"
                        >
                          <span>تعديل / صرف</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* TAB 4: EMPLOYEE CONTRACTS */}
      {activeTab === "contracts" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل العقود (الكل)</option>
                <option value="active">عقد نشط (Active)</option>
                <option value="expired">منتهي (Expired)</option>
                <option value="draft">مسودة (Draft)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في العقود..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">نوع العقد</th>
                  <th className="p-3.5">الراتب الأساسي</th>
                  <th className="p-3.5">تاريخ البدء</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد عقود مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.user?.name || "User"} size="sm" />
                          <div>
                            <strong className="block text-xs font-bold text-white">{c.user?.name}</strong>
                            <span className="text-[10px] text-zinc-500">{c.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block rounded-md bg-white/5 px-2.5 py-1 text-xs font-bold text-zinc-200 capitalize">
                          {c.contract_type === "full_time" ? "دوام كامل (Full-Time)" : c.contract_type === "freelance" ? "عمل حر (Freelance)" : c.contract_type}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-white">
                        {money(Number(c.base_salary))} <span className="text-[10px] text-zinc-500">{c.currency}</span>
                      </td>
                      <td className="p-3.5 text-xs text-zinc-300 font-mono">{c.starts_at}</td>
                      <td className="p-3.5 text-xs text-zinc-300 font-mono">{c.ends_at || "غير محدد"}</td>
                      <td className="p-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-3.5 text-xs text-zinc-400 max-w-[200px] truncate" title={c.notes || ""}>
                        {c.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* TAB 5: ADJUSTMENTS & DEDUCTIONS ENGINE */}
      {activeTab === "deductions" && (
        <div className="space-y-6">
          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-white/7 pb-3">
            {[
              { id: "adjustments", label: "سجل التسويات والبدلات والجزاءات", icon: Coins },
              { id: "rules", label: "قواعد الخصم التلقائي (Automatic Rules)", icon: Settings2 },
              { id: "history", label: "سجل أحداث الخصم الذكي", icon: History },
            ].map((st) => {
              const Icon = st.icon;
              const active = deductionsSubTab === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setDeductionsSubTab(st.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    active ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tab 1: Adjustments */}
          {deductionsSubTab === "adjustments" && (
            <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
              <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
                  >
                    <option value="all">كافة الأنواع (الكل)</option>
                    <option value="bonus">مكافأة (+) (Bonus)</option>
                    <option value="allowance">بدل انتقال (+) (Allowance)</option>
                    <option value="deduction">خصم (-) (Deduction)</option>
                    <option value="penalty">جزاء (-) (Penalty)</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث في التسويات..."
                    className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-right">
                  <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="p-3.5">الموظف</th>
                      <th className="p-3.5">النوع</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5">تاريخ التطبيق</th>
                      <th className="p-3.5">السبب والتفاصيل</th>
                      <th className="p-3.5">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-zinc-500">
                          لا توجد تسويات مسجلة.
                        </td>
                      </tr>
                    ) : (
                      filteredAdjustments.map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={a.user?.name || "User"} size="sm" />
                              <strong className="text-xs font-bold text-white">{a.user?.name}</strong>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                              a.type === "bonus" || a.type === "allowance" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {a.type === "bonus" ? "+ مكافأة" : a.type === "allowance" ? "+ بدل انتقال" : a.type === "penalty" ? "- جزاء" : "- خصم"}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-xs font-black">
                            <span className={a.type === "bonus" || a.type === "allowance" ? "text-emerald-400" : "text-rose-400"}>
                              {a.type === "bonus" || a.type === "allowance" ? "+" : "-"}{money(Number(a.amount))}
                            </span>
                          </td>
                          <td className="p-3.5 text-xs text-zinc-300 font-mono">{a.effective_date}</td>
                          <td className="p-3.5 text-xs text-zinc-300">{a.reason}</td>
                          <td className="p-3.5 text-xs text-zinc-500">{a.creator?.name || "النظام"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {/* Sub-tab 2: Rules */}
          {deductionsSubTab === "rules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">قواعد الخصم التلقائي النشطة في النظام</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">يتم تفعيل وتطبيق هذه القواعد آلياً بواسطة محرك الباك إند عند حدوث الحدث.</p>
                </div>
                <button
                  onClick={() => setRuleModalOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#facc15] px-3.5 text-xs font-black text-black hover:bg-[#fde047] transition"
                >
                  <Plus size={14} />
                  <span>+ إضافة قاعدة جديدة</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rules.map((r) => (
                  <div key={r.id} className="panel bg-[#141415] border border-white/7 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#facc15]/10 text-[#facc15]">
                        <Zap size={16} />
                      </span>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {r.is_active ? "نشطة ومفعلة" : "معطلة"}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{r.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{r.description || "بدون وصف"}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/7 pt-3 text-xs">
                      <span className="text-zinc-500">قيمة الخصم:</span>
                      <strong className="font-mono font-black text-rose-400">{money(Number(r.amount))}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3: History */}
          {deductionsSubTab === "history" && (
            <article className="panel bg-[#141415] border border-white/7 p-6 rounded-2xl text-center">
              <History size={32} className="mx-auto text-[#facc15]/80 mb-2" />
              <h4 className="text-sm font-bold text-white">سجل تدقيق أحداث الخصم التلقائي</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                يقوم النظام بحفظ توقيع فريد (Signature) لكل حدث خصم تلقائي لمنع تكرار الخصم على نفس الموظف مرتين في نفس اليوم.
              </p>
            </article>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: MANUAL ATTENDANCE */}
      <Modal
        open={manualAttendanceOpen}
        onClose={() => { setManualAttendanceOpen(false); setEditingAttendance(null); }}
        title={editingAttendance ? "تعديل سجل حضور موظف" : "تسجيل حضور يدوي جديد"}
        subtitle="توثيق موعد الدخول والانصراف وحالة الحضور والتأخير"
        width="max-w-xl"
      >
        <form onSubmit={handleSaveAttendance} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="الموظف المستهدف">
              <select name="user_id" defaultValue={editingAttendance?.user_id || users[0]?.id} className={inputClass} required>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="تاريخ اليوم">
                <input name="date" type="date" defaultValue={editingAttendance?.date || selectedDate} className={inputClass} required />
              </Field>

              <Field label="الحالة">
                <select name="status" defaultValue={editingAttendance?.status || "present"} className={inputClass} required>
                  <option value="present">حاضر (Present)</option>
                  <option value="late">متأخر (Late)</option>
                  <option value="absent">غائب (Absent)</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="وقت الدخول (Check-in)">
                <input name="check_in" type="time" defaultValue={editingAttendance?.check_in ? editingAttendance.check_in.slice(11, 16) : "09:00"} className={inputClass} />
              </Field>

              <Field label="وقت الانصراف (Check-out)">
                <input name="check_out" type="time" defaultValue={editingAttendance?.check_out ? editingAttendance.check_out.slice(11, 16) : ""} className={inputClass} />
              </Field>
            </div>

            <Field label="دقائق التأخير (إن وجدت)">
              <input name="minutes_late" type="number" min={0} defaultValue={editingAttendance?.minutes_late || 0} className={inputClass} />
            </Field>

            <Field label="ملاحظات">
              <textarea name="notes" rows={2} defaultValue={editingAttendance?.notes || ""} placeholder="أسباب التأخير أو مبررات الغياب..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => { setManualAttendanceOpen(false); setEditingAttendance(null); }}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Check size={14} /> حفظ السجل
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: LEAVE REQUEST */}
      <Modal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="تقديم طلب إجازة جديد"
        subtitle="حدد نوع وتواريخ الإجازة لإرسالها للاعتماد الإداري"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateLeave} className="flex flex-col text-right">
          <div className="space-y-4">
            {user?.role === "hr" || user?.role === "ceo" || user?.role === "admin" ? (
              <Field label="الموظف">
                <select name="user_id" defaultValue={user?.id} className={inputClass}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({getRoleLabel(u.role)})</option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label="نوع الإجازة">
              <select name="type" className={inputClass} required>
                <option value="إجازة سنوية">إجازة سنوية (Annual Leave)</option>
                <option value="إجازة مرضية">إجازة مرضية (Sick Leave)</option>
                <option value="إجازة عارضة">إجازة عارضة (Casual Leave)</option>
                <option value="إجازة بدون راتب">إجازة بدون راتب (Unpaid Leave)</option>
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="تاريخ البدء">
                <input name="starts_at" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
              </Field>
              <Field label="تاريخ الانتهاء">
                <input name="ends_at" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
              </Field>
            </div>

            <Field label="عدد الأيام">
              <input name="days" type="number" min={1} defaultValue={1} className={inputClass} required />
            </Field>

            <Field label="سبب الإجازة">
              <textarea name="reason" rows={3} placeholder="اكتب تفاصيل أو سبب الإجازة..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setLeaveModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Check size={14} /> إرسال الطلب
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: PAYROLL ENTRY */}
      <Modal
        open={payrollModalOpen}
        onClose={() => { setPayrollModalOpen(false); setEditingPayroll(null); }}
        title={editingPayroll ? "تعديل مسير الراتب" : "إصدار مسير راتب جديد"}
        subtitle="حساب الأساسي والعمولات والمكافآت والخصومات بدقة"
        width="max-w-xl"
      >
        <form onSubmit={handleSavePayroll} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="الموظف">
              <select name="user_id" defaultValue={editingPayroll?.user_id || users[0]?.id} className={inputClass} required>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — ({getRoleLabel(u.role)})</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الشهر">
                <input name="period_month" type="date" defaultValue={editingPayroll?.period_month || selectedMonth} className={inputClass} required />
              </Field>
              <Field label="حالة المسير">
                <select name="status" defaultValue={editingPayroll?.status || "draft"} className={inputClass}>
                  <option value="draft">مسودة (Draft)</option>
                  <option value="approved">معتمد للصرف (Approved)</option>
                  <option value="paid">تم الصرف والتحويل (Paid)</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الراتب الأساسي (EGP / $)">
                <input name="base_salary" type="number" defaultValue={editingPayroll?.base_salary || 15000} className={inputClass} required />
              </Field>
              <Field label="المكافآت (+)">
                <input name="bonuses" type="number" defaultValue={editingPayroll?.bonuses || 0} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="العمولات البيعية (+)">
                <input name="commissions" type="number" defaultValue={editingPayroll?.commissions || 0} className={inputClass} />
              </Field>
              <Field label="الخصومات والجزاءات (-)">
                <input name="deductions" type="number" defaultValue={editingPayroll?.deductions || 0} className={inputClass} />
              </Field>
            </div>

            <Field label="الرقم المرجعي للتحويل البنكي (اختياري)">
              <input name="payment_reference" placeholder="مثال: TXN-202608-4902" defaultValue={editingPayroll?.payment_reference || ""} className={inputClass} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => { setPayrollModalOpen(false); setEditingPayroll(null); }}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Check size={14} /> حفظ مسير الراتب
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONTRACT ENTRY */}
      <Modal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        title="توثيق عقد موظف جديد"
        subtitle="تسجيل تفاصيل التعاقد والراتب المتفق عليه"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateContract} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="الموظف">
              <select name="user_id" defaultValue={users[0]?.id} className={inputClass} required>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — ({getRoleLabel(u.role)})</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نوع العقد">
                <select name="contract_type" className={inputClass} required>
                  <option value="full_time">دوام كامل (Full-Time)</option>
                  <option value="part_time">دوام جزئي (Part-Time)</option>
                  <option value="freelance">عقد عمل حر (Freelance)</option>
                  <option value="internship">تدريب مهني (Internship)</option>
                </select>
              </Field>

              <Field label="حالة العقد">
                <select name="status" defaultValue="active" className={inputClass}>
                  <option value="active">نشط وساري (Active)</option>
                  <option value="draft">مسودة (Draft)</option>
                  <option value="expired">منتهي (Expired)</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الراتب المتفق عليه">
                <input name="base_salary" type="number" defaultValue={15000} className={inputClass} required />
              </Field>

              <Field label="العملة">
                <select name="currency" defaultValue="EGP" className={inputClass}>
                  <option value="EGP">EGP (جنيه مصري)</option>
                  <option value="USD">USD (دولار أمريكي)</option>
                  <option value="SAR">SAR (ريال سعودي)</option>
                  <option value="AED">AED (درهم إماراتي)</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="تاريخ البدء">
                <input name="starts_at" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
              </Field>

              <Field label="تاريخ الانتهاء (اختياري)">
                <input name="ends_at" type="date" className={inputClass} />
              </Field>
            </div>

            <Field label="ملاحظات العقد والشروط">
              <textarea name="notes" rows={2} placeholder="أي بنود أو شروط خاصة بالتعاقد..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setContractModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Check size={14} /> حفظ العقد
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ADJUSTMENT (BONUS / DEDUCTION) */}
      <Modal
        open={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        title="إضافة مكافأة أو خصم أو بدل"
        subtitle="تسجيل قيد مالي في حساب الموظف مع السبب"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateAdjustment} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="الموظف">
              <select name="user_id" defaultValue={users[0]?.id} className={inputClass} required>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — ({getRoleLabel(u.role)})</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="النوع">
                <select name="type" defaultValue="bonus" className={inputClass} required>
                  <option value="bonus">مكافأة (+) (Bonus)</option>
                  <option value="allowance">بدل انتقال (+) (Allowance)</option>
                  <option value="deduction">خصم يدوي (-) (Deduction)</option>
                  <option value="penalty">جزاء إداري (-) (Penalty)</option>
                </select>
              </Field>

              <Field label="المبلغ">
                <input name="amount" type="number" min={1} defaultValue={500} className={inputClass} required />
              </Field>
            </div>

            <Field label="تاريخ التطبيق">
              <input name="effective_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
            </Field>

            <Field label="السبب">
              <input name="reason" placeholder="مثال: مكافأة إنجاز مشروع أو خصم تأخير..." className={inputClass} required />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setAdjustmentModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Check size={14} /> تسجيل القيد
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: BULK DEDUCTION */}
      <Modal
        open={bulkDeductionOpen}
        onClose={() => setBulkDeductionOpen(false)}
        title="تطبيق خصم جماعي على الموظفين"
        subtitle="تطبيق قيد خصم موحد على مجموعة موظفين دفعة واحدة"
        width="max-w-xl"
      >
        <form onSubmit={handleBulkDeduction} className="flex flex-col text-right">
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>سيتم تطبيق هذا الخصم على جميع موظفي الوكالة المحددين وإرسال إشعار فوري لكل منهم.</span>
            </div>

            <Field label="قيمة الخصم لكل موظف (EGP / $)">
              <input name="amount" type="number" min={1} defaultValue={100} className={inputClass} required />
            </Field>

            <Field label="سبب الخصم">
              <input name="reason" placeholder="مثال: خصم جماعي لتفويت موعد الاجتماع العام..." className={inputClass} required />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setBulkDeductionOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton className="bg-rose-500 hover:bg-rose-400 text-white">
              <MinusCircle size={14} /> تطبيق الخصم الجماعي
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 7: AUTOMATIC DEDUCTION RULE */}
      <Modal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title="إضافة قاعدة خصم تلقائي ذكية"
        subtitle="برمجة قاعدة لتطبيق الخصم فور حدوث الحدث عبر محرك الباك إند"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateRule} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="اسم القاعدة">
              <input name="name" placeholder="مثال: خصم التأخير الصباحي بعد 15 دقيقة" className={inputClass} required />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الحدث المشغل للخصم (Event)">
                <select name="event_type" className={inputClass} required>
                  <option value="late_attendance">تأخير في الحضور الصباحي (Late Attendance)</option>
                  <option value="missed_deadline">تفويت موعد تسليم مهمة (Missed Deadline)</option>
                  <option value="unexcused_absence">غياب بدون إذن (Unexcused Absence)</option>
                </select>
              </Field>

              <Field label="قيمة الخصم الثابت">
                <input name="amount" type="number" min={1} defaultValue={100} className={inputClass} required />
              </Field>
            </div>

            <Field label="حد التأخير بالدقائق (Threshold Minutes)">
              <input name="threshold_minutes" type="number" min={1} defaultValue={15} className={inputClass} required />
            </Field>

            <Field label="وصف توضيحي للقاعدة">
              <textarea name="description" rows={2} placeholder="اشرح تفاصيل متى تطبق القاعدة..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setRuleModalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <Zap size={14} /> تفعيل القاعدة
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
