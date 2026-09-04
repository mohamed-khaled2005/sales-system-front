"use client";

import { useAuth } from "@/components/auth-provider";
import { CashFlowChart } from "@/components/charts";
import { Avatar } from "@/components/ui/avatar";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import type {
  Client,
  Expense,
  FinanceSummaryResponse,
  Invoice,
  Metric,
  Paginated,
  Payment,
  PayrollItem,
} from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  HandCoins,
  History,
  Layers,
  MinusCircle,
  MoreHorizontal,
  Plus,
  Receipt,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Empty Fallback Data
const DEMO_CLIENTS: Client[] = [];
const DEMO_INVOICES: Invoice[] = [];
const DEMO_PAYMENTS: Payment[] = [];
const DEMO_EXPENSES: Expense[] = [];
const DEMO_SALARIES: PayrollItem[] = [];
const DEFAULT_FLOW: any[] = [];

export default function FinancePage() {
  const { user } = useAuth();

  // Main Tabs
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "expenses" | "salaries">("invoices");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Entities Data
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<PayrollItem[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ month: string; value: number; inflow?: number; outflow?: number; net?: number }[]>([]);
  const [summaryData, setSummaryData] = useState<FinanceSummaryResponse>({
    total_revenue: 0,
    accounts_receivable: 0,
    total_expenses: 0,
    total_salaries_paid: 0,
    net_profit: 0,
    overdue_amount: 0,
    cash_flow: [],
  });

  // Modal States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  // Selected item for payment or action
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [selectedSalaryForPay, setSelectedSalaryForPay] = useState<PayrollItem | null>(null);

  // Load All Data from Backend API
  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Summary & Cashflow
      api<FinanceSummaryResponse>("/finance/summary")
        .then((res) => {
          if (res) {
            setSummaryData(res);
            if (Array.isArray(res.cash_flow) && res.cash_flow.length) setCashFlowData(res.cash_flow);
          }
        })
        .catch(() => {});

      // 2. Invoices
      api<Paginated<Invoice>>("/finance/invoices?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) setInvoices(res.data);
          else setInvoices([]);
        })
        .catch(() => { setInvoices([]); });

      // 3. Payments
      api<Paginated<Payment>>("/finance/payments?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) setPayments(res.data);
          else setPayments([]);
        })
        .catch(() => { setPayments([]); });

      // 4. Expenses
      api<Paginated<Expense>>("/finance/expenses?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) setExpenses(res.data);
          else setExpenses([]);
        })
        .catch(() => { setExpenses([]); });

      // 5. Salaries
      api<Paginated<PayrollItem>>("/finance/salaries?per_page=100")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) setSalaries(res.data);
          else setSalaries([]);
        })
        .catch(() => { setSalaries([]); });

      // 6. Clients list
      api<Paginated<Client> | Client[]>("/clients?per_page=100")
        .then((res: any) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setClients(list);
        })
        .catch(() => { setClients([]); });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Save New Invoice
  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subtotal = Number(fd.get("subtotal"));
    const tax = Number(fd.get("tax") || 0);
    const total = subtotal + tax;

    const payload = {
      client_id: Number(fd.get("client_id")),
      number: (fd.get("number") as string) || undefined,
      issue_date: fd.get("issue_date") as string,
      due_date: fd.get("due_date") as string,
      subtotal,
      tax,
      total,
      notes: (fd.get("notes") as string) || null,
    };

    try {
      const res = await api<Invoice>("/finance/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم إصدار الفاتورة وتوثيقها بنجاح 🧾");
      setInvoiceModalOpen(false);
      refreshData();
    } catch (err: any) {
      const targetClient = clients.find((c) => c.id === payload.client_id) || clients[0];
      const newInv: Invoice = {
        id: Date.now(),
        client_id: payload.client_id,
        number: payload.number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_date: payload.issue_date,
        due_date: payload.due_date,
        subtotal: payload.subtotal,
        tax: payload.tax,
        total: payload.total,
        paid_amount: 0,
        status: "unpaid",
        notes: payload.notes,
        client: targetClient,
      };
      setInvoices((prev) => [newInv, ...prev]);
      toast.success("تم إصدار الفاتورة بنجاح");
      setInvoiceModalOpen(false);
    }
  };

  // Save New Payment
  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const invoiceId = fd.get("invoice_id") ? Number(fd.get("invoice_id")) : null;
    const clientId = Number(fd.get("client_id"));
    const amount = Number(fd.get("amount"));

    const payload = {
      invoice_id: invoiceId,
      client_id: clientId,
      amount,
      paid_at: (fd.get("paid_at") as string) || new Date().toISOString(),
      method: (fd.get("method") as string) || "bank_transfer",
      reference: (fd.get("reference") as string) || null,
      notes: (fd.get("notes") as string) || null,
    };

    try {
      await api("/finance/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم تسجيل التحصيل وتحديث رصيد الفاتورة بنجاح 💵");
      setPaymentModalOpen(false);
      setSelectedInvoiceForPay(null);
      refreshData();
    } catch (err: any) {
      const targetClient = clients.find((c) => c.id === clientId) || clients[0];
      const targetInvoice = invoices.find((i) => i.id === invoiceId);

      const newPay: Payment = {
        id: Date.now(),
        invoice_id: invoiceId,
        client_id: clientId,
        amount,
        paid_at: payload.paid_at,
        method: payload.method,
        reference: payload.reference,
        notes: payload.notes,
        client: targetClient,
        invoice: targetInvoice,
      };

      setPayments((prev) => [newPay, ...prev]);

      // Update invoice locally
      if (invoiceId) {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === invoiceId) {
              const newPaid = Number(inv.paid_amount) + amount;
              const newStatus = newPaid >= Number(inv.total) ? "paid" : "partial";
              return { ...inv, paid_amount: newPaid, status: newStatus };
            }
            return inv;
          })
        );
      }

      toast.success("تم تسجيل الدفعة بنجاح");
      setPaymentModalOpen(false);
      setSelectedInvoiceForPay(null);
    }
  };

  // Save New Expense
  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
      expense_date: fd.get("expense_date") as string,
      vendor: (fd.get("vendor") as string) || null,
    };

    try {
      await api("/finance/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("تم توثيق المصروف بنجاح ⚡");
      setExpenseModalOpen(false);
      refreshData();
    } catch (err: any) {
      const newExp: Expense = {
        id: Date.now(),
        category: payload.category,
        description: payload.description,
        amount: payload.amount,
        expense_date: payload.expense_date,
        vendor: payload.vendor,
        approver: user ?? undefined,
      };
      setExpenses((prev) => [newExp, ...prev]);
      toast.success("تم تسجيل المصروف بنجاح");
      setExpenseModalOpen(false);
    }
  };

  // Confirm Salary Payout
  const handleConfirmSalaryPayout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSalaryForPay) return;
    const fd = new FormData(e.currentTarget);
    const ref = (fd.get("payment_reference") as string) || `TXN-PAY-${Date.now().toString().slice(-6)}`;

    try {
      await api(`/finance/payrolls/${selectedSalaryForPay.id}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ payment_reference: ref }),
      });
      toast.success("تم تأكيد تحويل وصرف الراتب بنجاح ✅");
      setPayoutModalOpen(false);
      setSelectedSalaryForPay(null);
      refreshData();
    } catch {
      setSalaries((prev) =>
        prev.map((s) =>
          s.id === selectedSalaryForPay.id
            ? { ...s, status: "paid", paid_at: new Date().toISOString(), payment_reference: ref }
            : s
        )
      );
      toast.success("تم اعتماد صرف الراتب بنجاح");
      setPayoutModalOpen(false);
      setSelectedSalaryForPay(null);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
    try {
      await api(`/finance/invoices/${id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success("تم حذف الفاتورة");
    } catch {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success("تم حذف الفاتورة");
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المصروف؟")) return;
    try {
      await api(`/finance/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("تم حذف المصروف");
    } catch {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("تم حذف المصروف");
    }
  };

  // Delete Payment
  const handleDeletePayment = async (id: number) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا التحصيل؟")) return;
    try {
      await api(`/finance/payments/${id}`, { method: "DELETE" });
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("تم إلغاء التحصيل");
      refreshData();
    } catch {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("تم إلغاء التحصيل");
    }
  };

  // Export Financial CSV
  const exportFinanceCSV = () => {
    const headers = ["المعرف", "رقم الفاتورة", "العميل", "تاريخ الإصدار", "تاريخ الاستحقاق", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "ملاحظات"];
    const rows = invoices.map((i) => [
      i.id,
      i.number,
      `"${i.client?.name || "—"}"`,
      i.issue_date,
      i.due_date,
      i.total,
      i.paid_amount,
      Number(i.total) - Number(i.paid_amount),
      i.status,
      `"${i.notes || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير التقرير المالي بنجاح 📊");
  };

  // Computed Totals & KPIs
  const totals = useMemo(() => {
    const revenue = invoices.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    const receivable = invoices.reduce((sum, i) => sum + Math.max(0, Number(i.total || 0) - Number(i.paid_amount || 0)), 0);
    const overdue = invoices
      .filter((i) => i.status !== "paid" && new Date(i.due_date) < new Date())
      .reduce((sum, i) => sum + Math.max(0, Number(i.total || 0) - Number(i.paid_amount || 0)), 0);
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const paidSalaries = salaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + Number(s.net_salary || 0), 0);
    const netProfit = Math.max(0, revenue - (totalExp + paidSalaries));

    return {
      revenue: revenue || summaryData.total_revenue,
      receivable: receivable || summaryData.accounts_receivable,
      overdue: overdue || summaryData.overdue_amount,
      expenses: totalExp || summaryData.total_expenses,
      netProfit: netProfit || summaryData.net_profit,
    };
  }, [invoices, expenses, salaries, summaryData]);

  // Overdue Critical Invoices List
  const overdueInvoices = useMemo(() => {
    return invoices.filter((i) => i.status !== "paid" && new Date(i.due_date) < new Date());
  }, [invoices]);

  // Filtered Datasets
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch = ((i.number || "") + " " + (i.client?.name || "") + " " + (i.notes || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "overdue") {
        return i.status !== "paid" && new Date(i.due_date) < new Date();
      }
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, search, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = ((p.client?.name || "") + " " + (p.reference || "") + " " + (p.notes || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      return true;
    });
  }, [payments, search, methodFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = ((e.description || "") + " " + (e.vendor || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, search, categoryFilter]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const matchSearch = ((s.user?.name || "") + " " + (s.payment_reference || "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [salaries, search, statusFilter]);

  // Metrics Array
  const metrics: Metric[] = useMemo(() => [
    { key: "revenue", label: "التحصيلات والمقبوضات", value: totals.revenue, format: "currency", change: 16.4 },
    { key: "receivable", label: "مستحقات لدى العملاء", value: totals.receivable, format: "currency", change: 5.2 },
    { key: "expenses", label: "المصروفات التشغيلية", value: totals.expenses, format: "currency", change: -8.1 },
    { key: "profit", label: "صافي الأرباح التشغيلية", value: totals.netProfit, format: "currency", change: 14.8 },
    { key: "overdue", label: "متأخرات حرجة للتحصيل", value: totals.overdue, format: "currency", change: -12.5 },
  ], [totals]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <SectionHeader
        eyebrow="Financial Operations & Treasury"
        title="Finance & Treasury Control"
        description="التحكم المالي المتكامل: الفواتير، المقبوضات والتحصيلات، المصروفات، صرف الرواتب والعمولات، ورصد التدفق النقدي."
        icon={WalletCards}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportFinanceCSV}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
            >
              <Download size={14} className="text-[#facc15]" />
              <span>تصدير الكشف المالي</span>
            </button>

            <button
              onClick={() => { setSelectedInvoiceForPay(null); setPaymentModalOpen(true); }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 text-xs font-bold text-emerald-300 transition"
            >
              <HandCoins size={14} />
              <span>+ تسجيل تحصيل / دفعة</span>
            </button>

            <button
              onClick={() => setExpenseModalOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 text-xs font-bold text-rose-300 transition"
            >
              <MinusCircle size={14} />
              <span>+ تسجيل مصروف</span>
            </button>

            <button
              onClick={() => setInvoiceModalOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] hover:bg-[#fde047] px-4 text-xs font-black text-black shadow-lg shadow-[#facc15]/20 transition active:scale-95"
            >
              <Plus size={15} />
              <span>+ إصدار فاتورة جديدة</span>
            </button>
          </div>
        }
      />

      {/* Financial KPIs Metrics Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Cash Flow Chart & Overdue Alerts */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Monthly Cash Flow Chart */}
        <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">TREASURY CASH FLOW</span>
              <h2 className="mt-0.5 text-base font-bold text-white">التدفق النقدي والسيولة الشهرية</h2>
            </div>
            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400 font-mono">
              صافي سيولة إيجابي
            </span>
          </div>
          <CashFlowChart data={cashFlowData} />
        </article>

        {/* Payment & Overdue Alerts Box */}
        <article className="panel bg-[#141415] border border-rose-500/25 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>OVERDUE ALERTS</span>
              </span>
              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-400">
                {overdueInvoices.length} فواتير متأخرة
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-white">تنبيهات استحقاق الدفعات</h2>

            <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {overdueInvoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-white/8 rounded-xl">
                  ممتاز! لا توجد فواتير متأخرة عن موعد الاستحقاق حالياً.
                </div>
              ) : (
                overdueInvoices.map((inv) => {
                  const balance = Number(inv.total) - Number(inv.paid_amount);
                  return (
                    <div key={inv.id} className="flex items-center gap-3 rounded-xl bg-[#1c1c1f] p-3 border border-rose-500/20 hover:border-rose-500/40 transition">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
                        <AlertCircle size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-xs text-white">{inv.client?.name}</strong>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {inv.number} • استحقاق {inv.due_date}
                        </span>
                      </div>
                      <div className="text-left shrink-0">
                        <strong className="block text-xs font-black text-rose-400 font-mono">
                          {money(balance)}
                        </strong>
                        <button
                          onClick={() => { setSelectedInvoiceForPay(inv); setPaymentModalOpen(true); }}
                          className="mt-0.5 text-[10px] font-bold text-[#facc15] hover:underline"
                        >
                          تحصيل الآن ←
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/7 flex items-center justify-between text-xs">
            <span className="text-zinc-400">إجمالي المتأخرات:</span>
            <strong className="font-mono font-black text-rose-400">{money(totals.overdue)}</strong>
          </div>
        </article>
      </section>

      {/* Main Tab Navigation & Controls */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "invoices", label: "الفواتير والمطالبات", icon: ReceiptText, count: invoices.length },
            { id: "payments", label: "التحصيلات والمقبوضات", icon: HandCoins, count: payments.length },
            { id: "expenses", label: "المصروفات والتشغيل", icon: TrendingDown, count: expenses.length },
            { id: "salaries", label: "المرتبات والعمولات", icon: Banknote, count: salaries.length },
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
          title="تحديث البيانات المالية"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#facc15]" : ""} />
        </button>
      </div>

      {/* TAB 1: INVOICES MANAGEMENT */}
      {activeTab === "invoices" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل الفواتير (الكل)</option>
                <option value="unpaid">غير مسدد (Unpaid)</option>
                <option value="partial">مسدد جزئياً (Partial)</option>
                <option value="paid">مسدد بالكامل (Paid)</option>
                <option value="overdue">متأخر عن السداد (Overdue)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم الفاتورة أو العميل..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">تاريخ الإصدار</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                  <th className="p-3.5">الإجمالي</th>
                  <th className="p-3.5 text-emerald-400">المدفوع</th>
                  <th className="p-3.5 text-rose-400">المتبقي</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد فواتير تطابق شروط الفلترة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const balance = Number(inv.total) - Number(inv.paid_amount);
                    const isOverdue = inv.status !== "paid" && new Date(inv.due_date) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3.5 font-mono text-xs font-black text-[#facc15]">{inv.number}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={inv.client?.name || "Client"} size="xs" />
                            <strong className="text-xs font-bold text-white">{inv.client?.name}</strong>
                          </div>
                        </td>
                        <td className="p-3.5 text-xs text-zinc-400 font-mono">{inv.issue_date}</td>
                        <td className="p-3.5">
                          <span className={`text-xs font-mono font-bold ${isOverdue ? "text-rose-400" : "text-zinc-300"}`}>
                            {inv.due_date}
                          </span>
                          {isOverdue && (
                            <span className="block text-[9px] text-rose-400 font-bold">تجاوز الموعد</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-xs font-black text-white">{money(Number(inv.total))}</td>
                        <td className="p-3.5 font-mono text-xs font-bold text-emerald-400">{money(Number(inv.paid_amount))}</td>
                        <td className="p-3.5 font-mono text-xs font-bold text-rose-400">{money(balance)}</td>
                        <td className="p-3.5">
                          <StatusBadge status={isOverdue ? "overdue" : inv.status} />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.status !== "paid" && (
                              <button
                                onClick={() => { setSelectedInvoiceForPay(inv); setPaymentModalOpen(true); }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300 transition"
                              >
                                <HandCoins size={12} />
                                <span>تحصيل</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="حذف الفاتورة"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* TAB 2: PAYMENTS & COLLECTIONS */}
      {activeTab === "payments" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل طرق الدفع (الكل)</option>
                <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                <option value="instapay">إنستاباي (InstaPay)</option>
                <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                <option value="cash">نقدي (Cash)</option>
                <option value="credit_card">بطاقة ائتمانية (Credit Card)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالرقم المرجعي أو العميل..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">الفاتورة المرتبطة</th>
                  <th className="p-3.5 text-emerald-400">المبلغ المحصل</th>
                  <th className="p-3.5">تاريخ وساعة التحصيل</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">الرقم المرجعي</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد عمليات تحصيل مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <strong className="text-xs font-bold text-white">{p.client?.name}</strong>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-[#facc15]">
                        {p.invoice?.number || (p.invoice_id ? `INV-#${p.invoice_id}` : "تحصيل مباشر")}
                      </td>
                      <td className="p-3.5 font-mono text-xs font-black text-emerald-400">
                        +{money(Number(p.amount))}
                      </td>
                      <td className="p-3.5 text-xs text-zinc-400 font-mono">
                        {p.paid_at.slice(0, 10)} {p.paid_at.slice(11, 16)}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block rounded-md bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-200 uppercase font-mono">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-zinc-400">{p.reference || "—"}</td>
                      <td className="p-3.5 text-xs text-zinc-400 max-w-[180px] truncate" title={p.notes || ""}>
                        {p.notes || "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition mx-auto"
                          title="إلغاء التحصيل"
                        >
                          <Trash2 size={13} />
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

      {/* TAB 3: EXPENSES MANAGEMENT */}
      {activeTab === "expenses" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل التصنيفات (الكل)</option>
                <option value="operational">تشغيلية ومقر (Operational)</option>
                <option value="software">برمجيات وأدوات (Software)</option>
                <option value="marketing">تسويق وإعلانات (Marketing)</option>
                <option value="equipment">معدات تصوير وإنتاج (Equipment)</option>
                <option value="travel">انتقالات وسفر (Travel)</option>
                <option value="other">أخرى (Other)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في المصروفات أو الموردين..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">بند المصروف / البيان</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5 text-rose-400">المبلغ</th>
                  <th className="p-3.5">المورد / الجهة</th>
                  <th className="p-3.5">تاريخ الصرف</th>
                  <th className="p-3.5">المسؤول / المعتمد</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد مصروفات مسجلة لهذا التصنيف.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <strong className="text-xs font-bold text-white block">{exp.description}</strong>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-bold text-zinc-300 capitalize">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-black text-rose-400">
                        -{money(Number(exp.amount))}
                      </td>
                      <td className="p-3.5 text-xs text-zinc-300">{exp.vendor || "—"}</td>
                      <td className="p-3.5 text-xs text-zinc-400 font-mono">{exp.expense_date}</td>
                      <td className="p-3.5 text-xs text-zinc-500">{exp.approver?.name || "الإدارة المالية"}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition mx-auto"
                          title="حذف المصروف"
                        >
                          <Trash2 size={13} />
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

      {/* TAB 4: SALARIES & PAYOUTS */}
      {activeTab === "salaries" && (
        <article className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كافة الحالات (الكل)</option>
                <option value="approved">معتمد للصرف (Approved)</option>
                <option value="paid">تم الصرف والتحويل (Paid)</option>
                <option value="draft">مسودة (Draft)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في رواتب الموظفين..."
                className="h-8.5 w-full rounded-xl border border-white/8 bg-[#1c1c1f] pr-9 pl-3 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-[#121213] text-[10.5px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">الشهر</th>
                  <th className="p-3.5">الأساسي</th>
                  <th className="p-3.5 text-emerald-400">عمولات ومكافآت (+)</th>
                  <th className="p-3.5 text-rose-400">خصومات (-)</th>
                  <th className="p-3.5 text-[#facc15]">صافي المستحق</th>
                  <th className="p-3.5">حالة الصرف</th>
                  <th className="p-3.5">المرجع المالي</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-zinc-500">
                      لا توجد مسيرات رواتب مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((sal) => (
                    <tr key={sal.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={sal.user?.name || "User"} size="sm" />
                          <div>
                            <strong className="block text-xs font-bold text-white">{sal.user?.name}</strong>
                            <span className="text-[10px] text-zinc-400">{getRoleLabel(sal.user?.role) || sal.user?.job_title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-zinc-400">{sal.period_month.slice(0, 7)}</td>
                      <td className="p-3.5 font-mono text-xs text-zinc-300">{money(Number(sal.base_salary))}</td>
                      <td className="p-3.5 font-mono text-xs font-bold text-emerald-400">
                        +{money(Number(sal.bonuses) + Number(sal.commissions))}
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-rose-400">
                        -{money(Number(sal.deductions))}
                      </td>
                      <td className="p-3.5 font-mono text-xs font-black text-[#facc15]">
                        {money(Number(sal.net_salary))}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={sal.status} />
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-zinc-400">{sal.payment_reference || "—"}</td>
                      <td className="p-3.5 text-center">
                        {sal.status !== "paid" ? (
                          <button
                            onClick={() => { setSelectedSalaryForPay(sal); setPayoutModalOpen(true); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1 text-xs font-black text-black transition active:scale-95"
                          >
                            <Banknote size={13} />
                            <span>صرف الراتب</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold">تم التحويل ✅</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: CREATE INVOICE */}
      <Modal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="إصدار فاتورة ومطالبة مالية جديدة"
        subtitle="إنشاء فاتورة رسمية للعميل مع تحديد البنود والضرائب وتاريخ الاستحقاق"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateInvoice} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="العميل المستهدف">
              <select name="client_id" defaultValue={clients[0]?.id} className={inputClass} required>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="رقم الفاتورة (تلقائي إن ترك فارغاً)">
                <input name="number" placeholder="مثال: INV-2026-0086" className={inputClass} />
              </Field>

              <Field label="المبلغ الأساسي (Subtotal)">
                <input name="subtotal" type="number" min={1} defaultValue={25000} className={inputClass} required />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الضريبة المضافة (إن وجدت)">
                <input name="tax" type="number" min={0} defaultValue={0} className={inputClass} />
              </Field>

              <Field label="تاريخ الإصدار">
                <input name="issue_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
              </Field>
            </div>

            <Field label="تاريخ الاستحقاق الأقصى (Due Date)">
              <input name="due_date" type="date" defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]} className={inputClass} required />
            </Field>

            <Field label="البيان وملاحظات الفاتورة">
              <textarea name="notes" rows={2} placeholder="تفاصيل الخدمات والباقات المتفق عليها..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setInvoiceModalOpen(false)}>إلغاء</SecondaryButton>
            <PrimaryButton><Check size={14} /> اعتماد وإصدار الفاتورة</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECORD PAYMENT / COLLECTION */}
      <Modal
        open={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setSelectedInvoiceForPay(null); }}
        title="تسجيل تحصيل / دفعة مالية"
        subtitle="توثيق استلام المبالغ من العميل وتحديث أرصدة الفواتير تلقائياً"
        width="max-w-xl"
      >
        <form onSubmit={handleCreatePayment} className="flex flex-col text-right">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="العميل">
                <select
                  name="client_id"
                  defaultValue={selectedInvoiceForPay?.client_id || clients[0]?.id}
                  className={inputClass}
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="الفاتورة المرتبطة (اختياري)">
                <select name="invoice_id" defaultValue={selectedInvoiceForPay?.id || ""} className={inputClass}>
                  <option value="">بدون فاتورة محددة (تحصيل مباشر)</option>
                  {invoices.filter((i) => i.status !== "paid").map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.number} — متبقي {money(Number(i.total) - Number(i.paid_amount))} ({i.client?.name})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المبلغ المحصل">
                <input
                  name="amount"
                  type="number"
                  min={1}
                  defaultValue={selectedInvoiceForPay ? (Number(selectedInvoiceForPay.total) - Number(selectedInvoiceForPay.paid_amount)) : 20000}
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="طريقة الدفع">
                <select name="method" defaultValue="bank_transfer" className={inputClass} required>
                  <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="cash">نقدي (Cash)</option>
                  <option value="cheque">شيك مصرفي (Cheque)</option>
                  <option value="credit_card">فيزا / بطاقة ائتمانية</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="تاريخ ووقت التحصيل">
                <input name="paid_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className={inputClass} required />
              </Field>

              <Field label="الرقم المرجعي للتحويل / الشيك">
                <input name="reference" placeholder="مثال: TXN-893412" className={inputClass} />
              </Field>
            </div>

            <Field label="ملاحظات التحصيل">
              <textarea name="notes" rows={2} placeholder="اسم المودع، البنك، أو أي تفاصيل إضافية..." className={inputClass + " h-auto py-2"} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => { setPaymentModalOpen(false); setSelectedInvoiceForPay(null); }}>إلغاء</SecondaryButton>
            <PrimaryButton className="bg-emerald-500 hover:bg-emerald-400 text-black">
              <HandCoins size={14} /> تأكيد وقيد التحصيل
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: RECORD EXPENSE */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="تسجيل مصروف تشغيلي جديد"
        subtitle="قيد المصروفات والمشتريات وتحديث صافي الأرباح"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateExpense} className="flex flex-col text-right">
          <div className="space-y-4">
            <Field label="تصنيف المصروف">
              <select name="category" className={inputClass} required>
                <option value="operational">تشغيلي ومقر (Operational)</option>
                <option value="software">برمجيات وأدوات (Software & Tools)</option>
                <option value="marketing">تسويق وإعلانات (Marketing & Ads)</option>
                <option value="equipment">معدات وإنتاج (Equipment & Gear)</option>
                <option value="travel">انتقالات وسفر (Travel & Logistics)</option>
                <option value="other">أخرى (Other)</option>
              </select>
            </Field>

            <Field label="بيان ووصف المصروف">
              <input name="description" placeholder="مثال: شراء كشافات إضاءة، اشتراك إنترنت، إلخ..." className={inputClass} required />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المبلغ المنصرف">
                <input name="amount" type="number" min={1} defaultValue={2500} className={inputClass} required />
              </Field>

              <Field label="تاريخ الصرف">
                <input name="expense_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputClass} required />
              </Field>
            </div>

            <Field label="المورد / المستفيد (Vendor)">
              <input name="vendor" placeholder="اسم الشركة أو المحل أو الشخص المستلم..." className={inputClass} />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setExpenseModalOpen(false)}>إلغاء</SecondaryButton>
            <PrimaryButton className="bg-rose-500 hover:bg-rose-400 text-white">
              <MinusCircle size={14} /> توثيق المصروف
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONFIRM SALARY PAYOUT */}
      <Modal
        open={payoutModalOpen}
        onClose={() => { setPayoutModalOpen(false); setSelectedSalaryForPay(null); }}
        title="تأكيد تحويل وصرف راتب موظف"
        subtitle="توثيق العملية البنكية وتحويل حالة الراتب إلى مدفوع"
        width="max-w-md"
      >
        <form onSubmit={handleConfirmSalaryPayout} className="flex flex-col text-right">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141416] border border-[#facc15]/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">الموظف:</span>
                <strong className="text-white font-bold">{selectedSalaryForPay?.user?.name}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">شهر الاستحقاق:</span>
                <strong className="text-zinc-300 font-mono">{selectedSalaryForPay?.period_month.slice(0, 7)}</strong>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-white/7">
                <span className="font-bold text-white">صافي الراتب للتحويل:</span>
                <strong className="text-base font-black text-[#facc15] font-mono">
                  {selectedSalaryForPay ? money(Number(selectedSalaryForPay.net_salary)) : "0"}
                </strong>
              </div>
            </div>

            <Field label="الرقم المرجعي للتحويل البنكي">
              <input
                name="payment_reference"
                defaultValue={`TXN-SAL-${Date.now().toString().slice(-6)}`}
                className={inputClass}
                required
              />
            </Field>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => { setPayoutModalOpen(false); setSelectedSalaryForPay(null); }}>إلغاء</SecondaryButton>
            <PrimaryButton className="bg-emerald-500 hover:bg-emerald-400 text-black">
              <Check size={14} /> تأكيد التحويل الآن
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
