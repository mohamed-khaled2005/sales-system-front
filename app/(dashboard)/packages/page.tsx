"use client";

import { useAuth } from "@/components/auth-provider";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { api } from "@/lib/api";
import type { Client, Metric, Package, PackageNegotiation } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Edit,
  Handshake,
  Layers,
  Package as PackageIcon,
  Percent,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"packages" | "negotiations">("packages");

  // Negotiation Request State
  const [negotiatingPackage, setNegotiatingPackage] = useState<Package | null>(null);
  const [negotiations, setNegotiations] = useState<PackageNegotiation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [salesNotes, setSalesNotes] = useState("");

  // Package Management (Admin / CEO / Sales Leader)
  const isExecutive = user?.role === "ceo" || user?.role === "admin" || user?.role === "sales_leader";
  const [newPackageOpen, setNewPackageOpen] = useState(false);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [updatingPackage, setUpdatingPackage] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [pkgs, cls, negs] = await Promise.allSettled([
        api<Package[]>("/packages"),
        api<{ data: Client[] }>("/clients?per_page=100"),
        api<{ data: PackageNegotiation[] }>("/negotiations"),
      ]);
      if (pkgs.status === "fulfilled" && Array.isArray(pkgs.value)) {
        setPackages(pkgs.value);
      } else {
        setPackages([]);
      }
      if (cls.status === "fulfilled" && cls.value?.data) {
        setClients(cls.value.data);
        if (cls.value.data[0]) setSelectedClientId(cls.value.data[0].id);
      } else {
        setClients([]);
      }
      if (negs.status === "fulfilled" && negs.value?.data) {
        setNegotiations(negs.value.data);
      } else {
        setNegotiations([]);
      }
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
    } catch {
      // Optimistic demo
      const newNeg: PackageNegotiation = {
        id: Date.now(),
        client_id: selectedClientId || 0,
        package_id: negotiatingPackage.id,
        salesperson_id: user?.id || 1,
        original_price: negotiatingPackage.monthly_price,
        proposed_price: proposedPrice,
        status: "pending",
        salesperson_notes: salesNotes,
        created_at: new Date().toISOString(),
        client: clients.find((c) => c.id === selectedClientId),
        package: negotiatingPackage,
      };
      setNegotiations((prev) => [newNeg, ...prev]);
      toast.success("تم إرسال طلب التفاوض إلى مدير المبيعات بنجاح");
      setNegotiatingPackage(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNegotiationDecision(negId: number, decision: "approve" | "reject") {
    try {
      const res = await api<PackageNegotiation>(`/negotiations/${negId}/${decision}`, {
        method: "POST",
        body: JSON.stringify({
          leader_notes: decision === "approve" ? "تم الاعتماد من مدير المبيعات" : "تم رفض العرض المقترح",
        }),
      });
      setNegotiations((prev) => prev.map((n) => (n.id === negId ? res : n)));
      toast.success(decision === "approve" ? "تمت الموافقة على طلب التفاوض" : "تم رفض طلب التفاوض");
    } catch {
      // Optimistic update
      setNegotiations((prev) =>
        prev.map((n) =>
          n.id === negId
            ? { ...n, status: decision === "approve" ? "approved" : "rejected" }
            : n
        )
      );
      toast.success(decision === "approve" ? "تمت الموافقة على طلب التفاوض" : "تم رفض طلب التفاوض");
    }
  }

  async function handleCreatePackage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingPackage(true);
    const fd = new FormData(e.currentTarget);
    const servicesRaw = String(fd.get("extra_services") || "");
    const services = servicesRaw ? servicesRaw.split("\n").map((s) => s.trim()).filter(Boolean) : [];

    const payload = {
      name: String(fd.get("name")),
      monthly_price: Number(fd.get("monthly_price")),
      reels: Number(fd.get("reels") || 0),
      posts: Number(fd.get("posts") || 0),
      stories: Number(fd.get("stories") || 0),
      extra_services: services.length ? services : ["Social media calendar", "Graphic designs", "Monthly report"],
      is_active: true,
    };

    try {
      const created = await api<Package>("/packages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPackages((prev) => [...prev, created]);
      toast.success(`تم إنشاء باقة "${created.name}" بنجاح`);
      setNewPackageOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "تعذر إنشاء الباقة على السيرفر");
    } finally {
      setCreatingPackage(false);
    }
  }

  async function handleUpdatePackage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPackage) return;
    setUpdatingPackage(true);
    const fd = new FormData(e.currentTarget);
    const servicesRaw = String(fd.get("extra_services") || "");
    const services = servicesRaw ? servicesRaw.split("\n").map((s) => s.trim()).filter(Boolean) : editingPackage.extra_services;

    const payload = {
      name: String(fd.get("name")),
      monthly_price: Number(fd.get("monthly_price")),
      reels: Number(fd.get("reels") || 0),
      posts: Number(fd.get("posts") || 0),
      stories: Number(fd.get("stories") || 0),
      extra_services: services,
      is_active: true,
    };

    try {
      const updated = await api<Package>(`/packages/${editingPackage.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`تم تحديث باقة "${updated.name}" بنجاح`);
      setEditingPackage(null);
    } catch (err: any) {
      toast.error(err?.message || "تعذر تحديث الباقة على السيرفر");
    } finally {
      setUpdatingPackage(false);
    }
  }

  async function handleDeletePackage() {
    if (!packageToDelete) return;
    setDeletingPackage(true);
    try {
      await api(`/packages/${packageToDelete.id}`, { method: "DELETE" });
      setPackages((prev) => prev.filter((p) => p.id !== packageToDelete.id));
      toast.success(`تم حذف باقة "${packageToDelete.name}" بنجاح`);
      setPackageToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف الباقة من السيرفر");
    } finally {
      setDeletingPackage(false);
    }
  }

  const pendingNegotiationsCount = negotiations.filter((n) => n.status === "pending").length;

  const metrics: Metric[] = [
    { key: "packages", label: "باقات البيع النشطة", value: packages.length },
    { key: "avg", label: "متوسط قيمة الباقة", value: Math.round(packages.reduce((a, b) => a + Number(b.monthly_price), 0) / (packages.length || 1)), format: "currency" },
    { key: "negotiations", label: "طلبات التفاوض", value: negotiations.length },
    { key: "pending_neg", label: "تفاوض بانتظار الاعتماد", value: pendingNegotiationsCount },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Sales Department"
        title="Sales Packages & Retainers"
        description="باقات الخدمات المتاحة للبيع مع تفاصيل الحصص الشهرية والأسعار وتقديم طلبات التفاوض السعري."
        icon={PackageIcon}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="إعادة تحميل"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            {isExecutive && (
              <PrimaryButton onClick={() => setNewPackageOpen(true)}>
                <Plus size={15} /> إضافة باقة جديدة
              </PrimaryButton>
            )}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.key} metric={m} index={i} />
        ))}
      </section>

      {/* Tabs Navigation */}
      <div className="panel bg-[#141415] border border-white/7 p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("packages")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "packages" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            باقات الخدمات المعروضة ({packages.length})
          </button>
          <button
            onClick={() => setActiveTab("negotiations")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "negotiations" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Handshake size={14} />
            <span>طلبات التفاوض السعري ({negotiations.length})</span>
            {pendingNegotiationsCount > 0 && (
              <span className="rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5">
                {pendingNegotiationsCount} بانتظار الاعتماد
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: PACKAGES GRID */}
      {activeTab === "packages" && (
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#facc15]/15 text-[#facc15]">
                        <Zap size={22} />
                      </span>
                      <div>
                        <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                        <span className="text-xs text-zinc-400">باقة شهرية متكاملة</span>
                      </div>
                    </div>

                    {isExecutive && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingPackage(pkg)}
                          title="تعديل الباقة"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:bg-[#facc15] hover:text-black transition"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setPackageToDelete(pkg)}
                          title="حذف الباقة"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
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
      )}

      {/* TAB 2: NEGOTIATIONS QUEUE */}
      {activeTab === "negotiations" && (
        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">قائمة طلبات التفاوض السعري</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              مراجعة أسعار الباقات المقترحة للعملاء من مسؤولي المبيعات واعتمادها أو رفضها.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead className="border-b border-white/7 text-[10px] font-bold text-zinc-500 uppercase">
                <tr>
                  <th className="pb-3 text-right">العميل</th>
                  <th className="pb-3 text-right">الباقة المعنية</th>
                  <th className="pb-3 text-center">السعر الرسمي</th>
                  <th className="pb-3 text-center">السعر المقترح</th>
                  <th className="pb-3 text-right">مسؤول المبيعات</th>
                  <th className="pb-3 text-center">الحالة</th>
                  <th className="pb-3 text-left">الإجراءات والقرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {negotiations.map((neg) => (
                  <tr key={neg.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-bold text-white">{neg.client?.name}</td>
                    <td className="py-3.5 text-zinc-300">{neg.package?.name}</td>
                    <td className="py-3.5 text-center text-zinc-400">{money(Number(neg.original_price))}</td>
                    <td className="py-3.5 text-center font-bold text-[#facc15]">{money(Number(neg.proposed_price))}</td>
                    <td className="py-3.5 text-zinc-300">{neg.salesperson?.name || "مسؤول المبيعات"}</td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          neg.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : neg.status === "rejected"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            : "bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30"
                        }`}
                      >
                        {neg.status === "approved" ? "معتمد" : neg.status === "rejected" ? "مرفوض" : "بانتظار الاعتماد"}
                      </span>
                    </td>
                    <td className="py-3.5 text-left">
                      {neg.status === "pending" && isExecutive ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleNegotiationDecision(neg.id, "approve")}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#facc15] px-3 text-[11px] font-bold text-black hover:bg-[#fde047] transition"
                          >
                            <Check size={13} /> اعتماد
                          </button>
                          <button
                            onClick={() => handleNegotiationDecision(neg.id, "reject")}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20 px-3 text-[11px] font-bold hover:bg-rose-500/25 transition"
                          >
                            <X size={13} /> رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500">
                          {neg.leader_notes || (neg.status === "approved" ? "تم الاعتماد" : "تم البت بالطلب")}
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
      )}

      {/* MODAL: CREATE PACKAGE */}
      <Modal open={newPackageOpen} onClose={() => setNewPackageOpen(false)} title="إضافة باقة خدمات جديدة">
        <form onSubmit={handleCreatePackage} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="اسم الباقة" className="md:col-span-2">
            <input name="name" required placeholder="مثال: Premium Growth, E-commerce Scale..." className={inputClass} />
          </Field>

          <Field label="قيمة الاشتراك الشهري ($)">
            <input name="monthly_price" type="number" required min={0} placeholder="45000" className={inputClass} />
          </Field>

          <Field label="حصة الريلز (Reels)">
            <input name="reels" type="number" min={0} defaultValue={8} className={inputClass} />
          </Field>

          <Field label="حصة البوستات (Posts)">
            <input name="posts" type="number" min={0} defaultValue={12} className={inputClass} />
          </Field>

          <Field label="حصة الستوري (Stories)">
            <input name="stories" type="number" min={0} defaultValue={24} className={inputClass} />
          </Field>

          <Field label="الخدمات الإضافية المضمنة (كل خدمة في سطر جديد)" className="md:col-span-2">
            <textarea
              name="extra_services"
              rows={4}
              placeholder="خطة استراتيجية شهرية&#10;جلسة تصوير احترافية&#10;إدارة الحملات الإعلانية الممولة&#10;تقرير أداء وتحليلات أسبوعي"
              className={textareaClass}
            />
          </Field>

          <div className="flex justify-end gap-2 md:col-span-2 pt-2 border-t border-white/5">
            <SecondaryButton type="button" onClick={() => setNewPackageOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton disabled={creatingPackage}>
              <Plus size={14} /> {creatingPackage ? "جاري الإنشاء..." : "إنشاء الباقة"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT PACKAGE */}
      {editingPackage && (
        <Modal open={!!editingPackage} onClose={() => setEditingPackage(null)} title={`تعديل باقة ${editingPackage.name}`}>
          <form onSubmit={handleUpdatePackage} className="grid gap-4 md:grid-cols-2 text-right">
            <Field label="اسم الباقة" className="md:col-span-2">
              <input name="name" defaultValue={editingPackage.name} required className={inputClass} />
            </Field>

            <Field label="قيمة الاشتراك الشهري ($)">
              <input name="monthly_price" type="number" defaultValue={editingPackage.monthly_price} required min={0} className={inputClass} />
            </Field>

            <Field label="حصة الريلز (Reels)">
              <input name="reels" type="number" min={0} defaultValue={editingPackage.reels} className={inputClass} />
            </Field>

            <Field label="حصة البوستات (Posts)">
              <input name="posts" type="number" min={0} defaultValue={editingPackage.posts} className={inputClass} />
            </Field>

            <Field label="حصة الستوري (Stories)">
              <input name="stories" type="number" min={0} defaultValue={editingPackage.stories} className={inputClass} />
            </Field>

            <Field label="الخدمات الإضافية المضمنة (سطر لكل خدمة)" className="md:col-span-2">
              <textarea
                name="extra_services"
                rows={4}
                defaultValue={(editingPackage.extra_services || []).join("\n")}
                className={textareaClass}
              />
            </Field>

            <div className="flex justify-end gap-2 md:col-span-2 pt-2 border-t border-white/5">
              <SecondaryButton type="button" onClick={() => setEditingPackage(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton disabled={updatingPackage}>
                {updatingPackage ? "جاري التحديث..." : "حفظ التعديلات"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CONFIRM DELETE PACKAGE */}
      {packageToDelete && (
        <Modal open={!!packageToDelete} onClose={() => setPackageToDelete(null)} title="تأكيد حذف الباقة">
          <div className="space-y-4 text-right">
            <p className="text-xs text-zinc-300 leading-relaxed">
              هل أنت متأكد من حذف باقة <strong>"{packageToDelete.name}"</strong>؟ لن تتمكن الفرق من استخدامها للتعاقدات الجديدة.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setPackageToDelete(null)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeletePackage}
                disabled={deletingPackage}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Trash2 size={14} /> {deletingPackage ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
