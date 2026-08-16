"use client";

import { Avatar } from "@/components/ui/avatar";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients } from "@/lib/mock-data";
import type { Client, Metric, Paginated } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Filter,
  Grid2X2,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api<Paginated<Client>>("/clients?per_page=100")
      .then((r) => {
        if (r?.data) setClients(r.data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        (c.name + " " + (c.industry ?? "")).toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  const revenue = clients.reduce(
    (a, c) => a + Number(c.subscriptions?.[0]?.package.monthly_price ?? 0),
    0
  );

  const metrics: Metric[] = [
    { key: "active", label: "العملاء النشطون", value: clients.length, change: 8.7 },
    { key: "retainers", label: "Monthly Retainers", value: revenue, format: "currency", change: 11.2 },
    {
      key: "health",
      label: "متوسط صحة الحساب",
      value: Math.round(clients.reduce((a, c) => a + c.health_score, 0) / clients.length),
      format: "percent",
    },
    { key: "renewals", label: "تجديدات قريبة", value: 4 },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Account Management"
        title="Clients Portfolio"
        description="الباقات، استهلاك المحتوى، المشاريع النشطة وصحة كل حساب في عرض موحد."
        icon={Building2}
        action={
          <Link
            href="/clients/1"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#facc15] px-4 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#fde047]"
          >
            <Plus size={15} /> عميل جديد
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Filter Bar */}
      <div className="panel bg-[#141415] border border-white/7 flex flex-col gap-3 p-4 md:flex-row md:items-center rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عميل أو مجال..."
            className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
          />
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#1e1e20] px-4 text-xs font-bold text-zinc-300 hover:bg-white/10">
          <Filter size={14} className="text-[#facc15]" /> الفلاتر
        </button>
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
                      {client.account_manager?.name ?? "عمر خالد"}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressRing value={client.health_score} size={38} strokeWidth={3} />
                  <ArrowLeft size={14} className="text-zinc-500 transition group-hover:-translate-x-1 group-hover:text-[#facc15]" />
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
