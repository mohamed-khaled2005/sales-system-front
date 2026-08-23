"use client";

import { useAuth } from "@/components/auth-provider";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { api } from "@/lib/api";
import { mockClients } from "@/lib/mock-data";
import type { Client, Metric, Package, PackageNegotiation } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Handshake,
  Layers,
  Package as PackageIcon,
  Percent,
  Plus,
  Radio,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const defaultPackages: Package[] = [
  {
    id: 1,
    name: "Launch",
    monthly_price: 25000,
    reels: 4,
    posts: 8,
    stories: 12,
    extra_services: ["Monthly strategy", "Community report"],
    is_active: true,
  },
  {
    id: 2,
    name: "Growth",
    monthly_price: 48000,
    reels: 8,
    posts: 12,
    stories: 24,
    extra_services: ["Monthly shoot", "Paid campaign setup", "Community management"],
    is_active: true,
  },
  {
    id: 3,
    name: "Scale",
    monthly_price: 85000,
    reels: 16,
    posts: 20,
    stories: 40,
    extra_services: ["Two shoot days", "Influencer coordination", "Weekly analytics"],
    is_active: true,
  },
];

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [loading, setLoading] = useState(true);
  const [negotiatingPackage, setNegotiatingPackage] = useState<Package | null>(null);
  const [negotiations, setNegotiations] = useState<PackageNegotiation[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Negotiation Form state
  const [selectedClientId, setSelectedClientId] = useState<number>(mockClients[0]?.id || 1);
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [salesNotes, setSalesNotes] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [pkgs, cls, negs] = await Promise.all([
        api<Package[]>("/packages"),
        api<{ data: Client[] }>("/clients?per_page=100"),
        api<{ data: PackageNegotiation[] }>("/negotiations"),
      ]);
      if (pkgs && pkgs.length > 0) setPackages(pkgs);
      if (cls?.data) setClients(cls.data);
      if (negs?.data) setNegotiations(negs.data);
    } catch {
      setPackages(defaultPackages);
      setClients(mockClients);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenNegotiation(pkg: Package) {
    setNegotiatingPackage(pkg);
    setProposedPrice(pkg.monthly_price * 0.9); // default 10% discount proposed
    setSalesNotes("");
  }

  async function submitNegotiation(e: React.FormEvent) {
    e.preventDefault();
    if (!negotiatingPackage) return;

    setSubmitting(true);
    try {
      const res = await api<PackageNegotiation>("/negotiations", {
        method: "POST",
        body: JSON.stringify({
          client_id: selectedClientId,
          package_id: negotiatingPackage.id,
          proposed_price: proposedPrice,
          salesperson_notes: salesNotes,
        }),
      });
      setNegotiations((prev) => [res, ...prev]);
      toast.success("تم إرسال طلب التفاوض إلى مدير المبيعات بنجاح");
      setNegotiatingPackage(null);
    } catch (e) {
      toast.error("فشل إرسال طلب التفاوض");
    } finally {
      setSubmitting(false);
    }
  }

  const metrics: Metric[] = [
    { key: "packages", label: "باقات البيع النشطة", value: packages.length },
    { key: "avg", label: "متوسط قيمة الباقة", value: Math.round(packages.reduce((a, b) => a + Number(b.monthly_price), 0) / (packages.length || 1)), format: "currency" },
    { key: "negotiations", label: "طلبات التفاوض", value: negotiations.length },
    { key: "commission", label: "عمولتي على الباقات", value: user?.commission_percentage ?? 10, format: "percent" },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Sales Department"
        title="Sales Packages & Retainers"
        description="باقات الخدمات المتاحة للبيع مع تفاصيل الحصص الشهرية والأسعار وتقديم طلبات التفاوض السعري."
        icon={PackageIcon}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Packages Grid */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg, idx) => {
          const isFeatured = idx === 1;
          return (
            <article
              key={pkg.id}
              className={`panel bg-[#141415] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between transition hover:-translate-y-1 ${
                isFeatured ? "border-2 border-[#facc15] gold-glow" : "border border-white/8"
              }`}
            >
              {isFeatured && (
                <span className="absolute top-4 left-4 rounded-full bg-[#facc15] px-3 py-0.5 text-[10px] font-black text-black uppercase tracking-wider">
                  الأكثر مبيعًا
                </span>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#facc15]/15 text-[#facc15]">
                    <Zap size={22} />
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                    <span className="text-xs text-zinc-400">باقة شهرية متكاملة</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="my-6 rounded-2xl bg-[#1c1c1f] p-4 text-center border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">قيمة الاشتراك الشهري</span>
                  <strong className="text-3xl font-black text-[#facc15] block mt-1">
                    {money(Number(pkg.monthly_price))}
                  </strong>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    العمولة المقدرة: {money(Number(pkg.monthly_price) * ((user?.commission_percentage ?? 10) / 100))} ({user?.commission_percentage ?? 10}%)
                  </span>
                </div>

                {/* Quotas */}
                <div className="grid grid-cols-3 gap-2 text-center mb-6">
                  <div className="rounded-xl bg-[#1a1a1c] p-2.5 border border-white/5">
                    <strong className="block text-base font-black text-white">{pkg.reels}</strong>
                    <span className="text-[10px] text-zinc-400 font-semibold">Reels / ريلز</span>
                  </div>
                  <div className="rounded-xl bg-[#1a1a1c] p-2.5 border border-white/5">
                    <strong className="block text-base font-black text-white">{pkg.posts}</strong>
                    <span className="text-[10px] text-zinc-400 font-semibold">Posts / بوستات</span>
                  </div>
                  <div className="rounded-xl bg-[#1a1a1c] p-2.5 border border-white/5">
                    <strong className="block text-base font-black text-white">{pkg.stories}</strong>
                    <span className="text-[10px] text-zinc-400 font-semibold">Stories / ستوري</span>
                  </div>
                </div>

                {/* Included Features */}
                <div className="space-y-2.5 border-t border-white/7 pt-4">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block mb-2">
                    الخدمات المضمنة في الباقة
                  </span>
                  {(pkg.extra_services ?? ["Social media strategy", "Content calendar & copywriting", "Graphic visual designs", "Monthly analytics & reporting"]).map((service, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <CheckCircle2 size={14} className="text-[#facc15] shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="mt-8 pt-4 border-t border-white/7">
                <button
                  onClick={() => handleOpenNegotiation(pkg)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#222225] py-3 text-xs font-bold text-white transition hover:bg-[#facc15] hover:text-black active:scale-95"
                >
                  <Handshake size={15} />
                  <span>طلب تفاوض على السعر</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Package Negotiation Request Modal */}
      {negotiatingPackage && (
        <Modal
          open={!!negotiatingPackage}
          onClose={() => setNegotiatingPackage(null)}
          title={`طلب تفاوض على باقة ${negotiatingPackage.name}`}
        >
          <form onSubmit={submitNegotiation} className="space-y-4 text-right">
            <p className="text-xs text-zinc-400 leading-relaxed">
              عند رغبة العميل في التعاقد ولكن مع اعتراض على السعر، أرسل تفاصيل السعر المقترح ومبرراتك لمدير المبيعات للاعتماد.
            </p>

            <Field label="اختر العميل المعني">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                className={inputClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.contact_name || "بدون جهة اتصال"})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#1a1a1c] p-3 border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">السعر الأصلي للباقة</span>
                <strong className="text-base text-zinc-300 block mt-1">
                  {money(Number(negotiatingPackage.monthly_price))}
                </strong>
              </div>

              <Field label="السعر المقترح للتفاوض ($)">
                <input
                  type="number"
                  required
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="سبب التفاوض / ملاحظاتك لمدير المبيعات">
              <textarea
                required
                value={salesNotes}
                onChange={(e) => setSalesNotes(e.target.value)}
                placeholder="اكتب سبب طلب الخصم (مثلاً: تعاقد سنوي بدفع مقدم، علامة تجارية واعدة، باقة مخصصة)..."
                className={textareaClass}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setNegotiatingPackage(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton disabled={submitting}>
                <Send size={14} />
                {submitting ? "جاري الإرسال..." : "إرسال طلب التفاوض"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
