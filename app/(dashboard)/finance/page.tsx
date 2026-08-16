"use client";

import { CashFlowChart } from "@/components/charts";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockInvoices } from "@/lib/mock-data";
import type { Invoice, Metric, Paginated } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  Download,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const flow = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month, i) => ({
  month,
  value: 220000 + i * 42000 + (i % 2 ? -30000 : 0),
}));

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [tab, setTab] = useState("invoices");

  useEffect(() => {
    api<Paginated<Invoice>>("/finance/invoices?per_page=100")
      .then((r) => {
        if (r?.data) setInvoices(r.data);
      })
      .catch(() => {});
  }, []);

  const totals = useMemo(
    () => ({
      revenue: invoices.reduce((a, i) => a + Number(i.paid_amount), 0),
      receivable: invoices.reduce(
        (a, i) => a + Math.max(0, Number(i.total) - Number(i.paid_amount)),
        0
      ),
      overdue: invoices
        .filter((i) => i.status !== "paid" && new Date(i.due_date) < new Date())
        .reduce((a, i) => a + Number(i.total) - Number(i.paid_amount), 0),
    }),
    [invoices]
  );

  const metrics: Metric[] = [
    { key: "revenue", label: "التحصيلات", value: totals.revenue, format: "currency", change: 14.2 },
    { key: "receivable", label: "Accounts Receivable", value: totals.receivable, format: "currency", change: 8.6 },
    { key: "profit", label: "صافي الربح", value: 465000, format: "currency", change: 11.1 },
    { key: "overdue", label: "متأخرات العملاء", value: totals.overdue, format: "currency", change: -4.2 },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Finance Department"
        title="Finance Control"
        description="الفواتير، الأقساط، التحصيلات، المصروفات والتدفق النقدي مع تنبيهات التأخير."
        icon={WalletCards}
        action={
          <div className="flex gap-2">
            <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-bold text-zinc-300 hover:bg-white/5">
              <Download size={14} className="text-[#facc15]" /> تقرير
            </button>
            <button className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fde047]">
              <Plus size={14} /> فاتورة جديدة
            </button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">CASH FLOW</span>
              <h2 className="mt-0.5 text-base font-bold text-white">التدفق النقدي الشهري</h2>
            </div>
            <select className="rounded-lg border border-white/8 bg-[#1a1a1c] px-3 py-1.5 text-xs text-zinc-300 outline-none">
              <option>آخر 6 أشهر</option>
            </select>
          </div>
          <CashFlowChart data={flow} />
        </article>

        <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
          <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">PAYMENT ALERTS</span>
          <h2 className="mt-0.5 text-base font-bold text-white">تنبيهات التحصيل</h2>
          <div className="mt-4 space-y-2.5">
            {invoices
              .filter((i) => i.status !== "paid")
              .slice(0, 5)
              .map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl bg-[#1c1c1f] p-3 border border-white/5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
                    <AlertTriangle size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs text-white">{i.client?.name}</strong>
                    <span className="text-[10px] text-zinc-500">
                      استحقاق {new Date(i.due_date).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <strong className="text-xs font-black text-rose-400">
                    {money(Number(i.total) - Number(i.paid_amount))}
                  </strong>
                </div>
              ))}
          </div>
        </article>
      </section>

      {/* Invoice Table Section */}
      <section className="panel bg-[#141415] border border-white/7 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-white/7 p-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["invoices", "الفواتير"],
              ["expenses", "المصروفات"],
              ["payments", "التحصيلات"],
              ["salaries", "المرتبات والعمولات"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  tab === v ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative mr-auto w-full md:w-64">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="بحث..."
              className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] pr-9 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
            />
          </div>
        </div>

        {tab === "invoices" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-[#121213] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3.5">Invoice</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Issue date</th>
                  <th className="p-3.5">Due date</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((i) => (
                  <tr key={i.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3.5 font-mono text-xs font-bold text-[#facc15]">{i.number}</td>
                    <td className="p-3.5 text-xs font-bold text-white">{i.client?.name}</td>
                    <td className="p-3.5 text-xs text-zinc-400">
                      {new Date(i.issue_date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3.5 text-xs text-zinc-400">
                      {new Date(i.due_date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3.5 text-xs font-black text-white">{money(Number(i.total))}</td>
                    <td className="p-3.5 text-xs text-zinc-400">{money(Number(i.paid_amount))}</td>
                    <td className="p-3.5">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="p-3.5">
                      <button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                <ReceiptText size={22} />
              </span>
              <h3 className="mt-3 font-bold text-sm text-white">قسم {tab}</h3>
              <p className="mt-1 text-xs text-zinc-500">الـAPI والهيكل جاهزان لإضافة وتصفية وتصدير السجلات.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
