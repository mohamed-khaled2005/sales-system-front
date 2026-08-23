"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients } from "@/lib/mock-data";
import type { Brief, Client, ClientPublishApproval, ProductionShoot, Task } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  Layers,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  StickyNote,
  UploadCloud,
  User,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ClientProfilePage() {
  const params = useParams<{ id: string }>();
  const fallback =
    mockClients.find((c) => c.id === Number(params.id)) ?? {
      ...mockClients[0],
      name: "TechNova Solutions",
      industry: "Technology",
      contact_name: "Ahmed Al-Farsi",
      contact_phone: "+971 50 123 4567",
      contact_email: "ahmed@technova.com",
    };

  const [client, setClient] = useState<Client>(fallback);
  const [activeTab, setActiveTab] = useState<"overview" | "briefs" | "deliverables" | "shoots" | "source_files" | "publish_approvals">("overview");

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [publishApprovalOpen, setPublishApprovalOpen] = useState(false);
  const [shootModalOpen, setShootModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState<ProductionShoot | null>(null);
  const [uploadSourceOpen, setUploadSourceOpen] = useState(false);

  // Form states
  const [newShootDate, setNewShootDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [publishNotes, setPublishNotes] = useState("");
  const [selectedTaskForPublish, setSelectedTaskForPublish] = useState<number | undefined>(undefined);

  async function loadClient() {
    if (!params.id) return;
    try {
      const data = await api<Client>(`/clients/${params.id}`);
      if (data) setClient(data);
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    loadClient();
  }, [params.id]);

  // Handle Brief Creation
  async function handleCreateBrief(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: String(fd.get("type")),
      objective: String(fd.get("objective")),
      buyer_persona: String(fd.get("buyer_persona")),
      platform: String(fd.get("platform")),
      brand_tone: String(fd.get("brand_tone")),
      requirements: fd.get("requirements") ? [String(fd.get("requirements"))] : [],
      references: fd.get("references") ? [String(fd.get("references"))] : [],
    };

    try {
      const created = await api<Brief>(`/clients/${client.id}/briefs`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setClient((prev) => ({
        ...prev,
        briefs: [created, ...(prev.briefs || [])],
      }));
      toast.success("تم إنشاء البريف وربطه بالعميل بنجاح");
      setBriefOpen(false);
    } catch {
      toast.error("فشل حفظ البريف");
    }
  }

  // Handle Client Publish Approval Sign-off
  async function handlePublishApproval(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<ClientPublishApproval>(`/clients/${client.id}/publish-approvals`, {
        method: "POST",
        body: JSON.stringify({
          task_id: selectedTaskForPublish,
          notes: publishNotes,
          status: "approved",
        }),
      });
      setClient((prev) => ({
        ...prev,
        publishApprovals: [res, ...(prev.publishApprovals || [])],
      }));
      toast.success("تم تسجيل موافقة العميل على النشر بنجاح");
      setPublishApprovalOpen(false);
      setPublishNotes("");
    } catch {
      toast.error("فشل تسجيل الموافقة");
    }
  }

  // Handle Shooting Reschedule / Postpone
  async function handleRescheduleShoot(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleModalOpen) return;

    try {
      const res = await api<ProductionShoot>(`/production/shoots/${rescheduleModalOpen.id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          new_scheduled_at: newShootDate,
          reason: rescheduleReason,
        }),
      });
      setClient((prev) => ({
        ...prev,
        shoots: (prev.shoots || []).map((s) => (s.id === res.id ? res : s)),
      }));
      toast.success("تم تأجيل/تعديل موعد التصوير بنجاح");
      setRescheduleModalOpen(null);
      setNewShootDate("");
      setRescheduleReason("");
    } catch (err: any) {
      toast.error(err?.message || "تعذر تعديل الموعد لوجود تعارض في الحجز");
    }
  }

  // Handle Shooting Cancellation
  async function handleCancelShoot(shootId: number) {
    try {
      const res = await api<ProductionShoot>(`/production/shoots/${shootId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "إلغاء بناء على طلب العميل" }),
      });
      setClient((prev) => ({
        ...prev,
        shoots: (prev.shoots || []).map((s) => (s.id === shootId ? res : s)),
      }));
      toast.success("تم إلغاء موعد التصوير بنجاح");
    } catch {
      toast.error("فشل إلغاء موعد التصوير");
    }
  }

  const sub = client.subscriptions?.[0];

  return (
    <div className="space-y-6 animate-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Link href="/clients" className="hover:text-zinc-300 transition">
          Clients Portfolio
        </Link>
        <ChevronRight size={13} className="text-zinc-600" />
        <span className="text-zinc-300">{client.name}</span>
      </nav>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {/* Logo with dimension-safe container & fallback */}
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1a1a1c] border border-white/10 overflow-hidden shrink-0">
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="h-full w-full object-contain p-1.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-xl font-black text-[#facc15]">{client.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">{client.name}</h1>
              <StatusBadge status={client.status || "active"} />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {client.industry || "General Industry"} • إدارة الحساب: {client.accountManager?.name || "عمر خالد"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-medium text-zinc-200 hover:bg-white/5 transition"
          >
            <Edit size={13} className="text-zinc-400" />
            <span>تعديل العميل</span>
          </button>

          <button
            onClick={() => setBriefOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-medium text-zinc-200 hover:bg-white/5 transition"
          >
            <FileSpreadsheet size={13} className="text-[#facc15]" />
            <span>+ إنشاء Brief</span>
          </button>

          <PrimaryButton onClick={() => setPublishApprovalOpen(true)} className="h-9 text-xs">
            <CheckCircle2 size={13} />
            <span>تسجيل موافقة نشر</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="panel bg-[#141415] border border-white/7 p-2 rounded-2xl flex flex-wrap gap-1.5">
        {[
          ["overview", "نظرة عامة والاشتراك", Building2],
          ["briefs", `البريفات (${client.briefs?.length ?? 0})`, FileSpreadsheet],
          ["deliverables", `المخرجات والأعمال (${client.tasks?.length ?? 0})`, Layers],
          ["shoots", `مواعيد التصوير (${client.shoots?.length ?? 0})`, Camera],
          ["source_files", "الملفات والمصادر والسكريبتات", Paperclip],
          ["publish_approvals", `موافقات النشر (${client.publishApprovals?.length ?? 0})`, CheckCircle2],
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === key ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <Building2 size={17} className="text-[#facc15]" />
                <h2 className="text-sm font-bold text-white tracking-wide">بيانات النشاط التجاري</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="block text-[11px] text-zinc-500">اسم النشاط</span>
                  <strong className="mt-1 block text-sm text-zinc-200">{client.name}</strong>
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500">المجال / Industry</span>
                  <strong className="mt-1 block text-sm text-zinc-200">{client.industry || "Marketing & Media"}</strong>
                </div>
              </div>
            </section>

            {/* Package & Quotas */}
            <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wrench size={17} className="text-[#facc15]" />
                  <h2 className="text-sm font-bold text-white tracking-wide">تفاصيل الباقة واستهلاك المحتوى</h2>
                </div>
                <span className="rounded-full bg-[#facc15]/15 px-3 py-1 text-xs font-black text-[#facc15]">
                  {sub?.package.name ?? "Growth Retainer"}
                </span>
              </div>

              <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">قيمة العقد الشهري</span>
                    <strong className="text-lg font-black text-[#facc15] mt-0.5 block">
                      {money(Number(sub?.package.monthly_price ?? 48000))}
                    </strong>
                  </div>
                  <div className="text-left text-xs text-zinc-400">
                    <div>تاريخ البدء: {sub?.starts_at || "2026-01-01"}</div>
                    <div>تاريخ التجديد: {sub?.ends_at || "2026-12-31"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Reels", used: sub?.reels_used ?? 3, total: sub?.package.reels ?? 8 },
                  { label: "Posts", used: sub?.posts_used ?? 7, total: sub?.package.posts ?? 12 },
                  { label: "Stories", used: sub?.stories_used ?? 14, total: sub?.package.stories ?? 24 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/5 bg-[#1a1a1c] p-3">
                    <strong className="block text-base font-black text-white">
                      {item.used} / {item.total}
                    </strong>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">{item.label}</span>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[#facc15]"
                        style={{ width: `${Math.min(100, (item.used / item.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Contact Info Column */}
          <div className="space-y-6">
            <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <div className="mb-5 flex items-center gap-2.5">
                <FileText size={17} className="text-[#facc15]" />
                <h2 className="text-sm font-bold text-white tracking-wide">بيانات التواصل</h2>
              </div>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <User size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-zinc-500">الشخص المسؤول</span>
                    <strong className="block text-xs font-bold text-zinc-200">
                      {client.contact_name || "غير محدد"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-zinc-500">رقم الهاتف</span>
                    <a
                      href={`tel:${client.contact_phone}`}
                      className="block text-xs font-bold text-[#facc15] hover:underline"
                    >
                      {client.contact_phone || "لا يوجد هاتف"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-zinc-500">البريد الإلكتروني</span>
                    <a
                      href={`mailto:${client.contact_email}`}
                      className="block text-xs font-bold text-zinc-200 hover:text-white"
                    >
                      {client.contact_email || "لا يوجد بريد"}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <StickyNote size={17} className="text-[#facc15]" />
                <h2 className="text-sm font-bold text-white tracking-wide">ملاحظات الحساب</h2>
              </div>
              <p className="text-xs italic text-zinc-300 leading-relaxed">
                {client.notes || "عميل نشط بخطة محتوى شهرية مستمرة مع تركيز على حملات الفيديو وتوليد العملاء."}
              </p>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: BRIEFS */}
      {activeTab === "briefs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">البريفات الإبداعية للعميل (Briefs)</h3>
            <PrimaryButton onClick={() => setBriefOpen(true)} className="text-xs">
              <Plus size={14} /> إنشاء Brief جديد
            </PrimaryButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(client.briefs || []).map((brief) => (
              <div key={brief.id} className="panel bg-[#141415] border border-white/7 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#facc15] tracking-wider block">
                      {brief.type}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{brief.brand_tone || "Brand Campaign Brief"}</h4>
                  </div>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-zinc-400">
                    {new Date(brief.created_at).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300 border-t border-white/5 pt-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-bold">الهدف (Objective):</span>
                    <p className="mt-0.5">{brief.objective || "زيادة المبيعات وبناء التفاعل المستمر."}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-bold">الجمهور المستهدف (Buyer Persona):</span>
                    <p className="mt-0.5">{brief.buyer_persona || "المهنيون وأصحاب الأعمال في الفئة 25-45."}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-bold">المنصات (Platforms):</span>
                    <p className="mt-0.5 text-[#facc15] font-semibold">{brief.platform || "Instagram, TikTok"}</p>
                  </div>
                </div>
              </div>
            ))}

            {(client.briefs || []).length === 0 && (
              <div className="col-span-2 panel bg-[#141415] border border-white/7 p-12 text-center text-xs text-zinc-500 rounded-2xl">
                لا توجد بريفات محفوظة لهذا العميل بعد. اضغط &quot;إنشاء Brief جديد&quot; للبدء.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERABLES */}
      {activeTab === "deliverables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">مخرجات وأعمال العميل المسلمة</h3>
            <span className="text-xs text-zinc-500">إجمالي {client.tasks?.length ?? 0} مهمة وعمل</span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {(client.tasks || []).map((task) => (
              <div key={task.id} className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="rounded-full bg-[#facc15]/15 px-2.5 py-0.5 text-[9px] font-black text-[#facc15]">
                      {task.department}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {task.objective || "تصميم ومحتوى إبداعي معتمد."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>المسؤول: {task.assignee?.name || "غير محدد"}</span>
                  <span className="font-mono text-zinc-400">v{(task.versions?.length || 1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SHOOTING DATES */}
      {activeTab === "shoots" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">مواعيد وجلسات التصوير للعميل</h3>
            <Link
              href="/production"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#facc15] px-3.5 text-xs font-black text-black hover:bg-[#fde047]"
            >
              <Plus size={14} /> حجز جلسة تصوير
            </Link>
          </div>

          <div className="space-y-3">
            {(client.shoots || []).map((shoot) => (
              <div
                key={shoot.id}
                className="panel bg-[#141415] border border-white/7 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15] shrink-0 font-black text-lg">
                    {new Date(shoot.scheduled_at).getDate()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{shoot.title}</h4>
                      <StatusBadge status={shoot.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span>🕒 {new Date(shoot.scheduled_at).toLocaleString("ar-EG")}</span>
                      <span>📍 {shoot.location || "Studio"}</span>
                      <span>📞 {shoot.client_phone || client.contact_phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {shoot.status !== "cancelled" && (
                    <>
                      <button
                        onClick={() => {
                          setRescheduleModalOpen(shoot);
                          setNewShootDate(shoot.scheduled_at ? new Date(shoot.scheduled_at).toISOString().slice(0, 16) : "");
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e22] px-3 text-xs font-bold text-zinc-200 hover:bg-white/5"
                      >
                        <Clock size={13} /> تأجيل / تعديل
                      </button>
                      <button
                        onClick={() => handleCancelShoot(shoot.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20 px-3 text-xs font-bold hover:bg-rose-500/25"
                      >
                        <X size={13} /> إلغاء
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {(client.shoots || []).length === 0 && (
              <div className="panel bg-[#141415] border border-white/7 p-12 text-center text-xs text-zinc-500 rounded-2xl">
                لا توجد مواعيد تصوير مسجلة لهذا العميل.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SOURCE FILES & SCRIPTS (Replaced Raw Files) */}
      {activeTab === "source_files" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">ملفات ومصادر وسكريبتات العميل</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                السكريبتات المعتمدة، ملفات التصوير الخام، الخطوط، والمصادر الإبداعية.
              </p>
            </div>
            <PrimaryButton onClick={() => setUploadSourceOpen(true)} className="text-xs">
              <UploadCloud size={14} /> رفع ملف / سكريبت جديد
            </PrimaryButton>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { name: "Brand Voice & Script Pillars 2026.docx", kind: "script", uploader: "نور علي", date: "منذ يومين", size: "2.4 MB" },
              { name: "Primary Brand Assets & Vectors.zip", kind: "source_file", uploader: "ليلى حسن", date: "منذ 4 أيام", size: "48.1 MB" },
              { name: "Shooting Moodboard & References.pdf", kind: "reference", uploader: "كريم عادل", date: "منذ أسبوع", size: "12.8 MB" },
            ].map((file, idx) => (
              <div key={idx} className="panel bg-[#141415] border border-white/7 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15] shrink-0">
                    <FileText size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-bold text-white truncate">{file.name}</strong>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">
                      بواسطة: {file.uploader} • {file.date}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{file.size}</span>
                  <button
                    onClick={() => toast.success(`جاري تحميل ${file.name}`)}
                    className="inline-flex items-center gap-1 text-[#facc15] hover:underline font-bold"
                  >
                    <Download size={12} /> تحميل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CLIENT PUBLISH APPROVALS */}
      {activeTab === "publish_approvals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">سجل موافقات العميل على النشر</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                توثيق اعتماد العميل للنشر مع التوقيت وملاحظات مسؤول الحساب.
              </p>
            </div>
            <PrimaryButton onClick={() => setPublishApprovalOpen(true)} className="text-xs">
              <CheckCircle2 size={14} /> + تسجيل موافقة نشر
            </PrimaryButton>
          </div>

          <div className="space-y-3">
            {(client.publishApprovals || []).map((app) => (
              <div
                key={app.id}
                className="panel bg-[#141415] border border-white/7 rounded-2xl p-4.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white">
                        {app.task ? app.task.title : "موافقة نشر شاملة لخطة المحتوى"}
                      </strong>
                      <span className="rounded-full bg-[#facc15] px-2.5 py-0.5 text-[9px] font-black text-black">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {app.notes || "تم استلام الموافقة من العميل عبر الواتساب/البريد وجاهز للنشر."}
                    </p>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      المسؤول: {app.accountManager?.name || "Account Manager"} • {new Date(app.recorded_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {(client.publishApprovals || []).length === 0 && (
              <div className="panel bg-[#141415] border border-white/7 p-12 text-center text-xs text-zinc-500 rounded-2xl">
                لا توجد موافقات نشر مسجلة بعد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE BRIEF */}
      <Modal open={briefOpen} onClose={() => setBriefOpen(false)} title="إنشاء Brief إبداعي للعميل">
        <form onSubmit={handleCreateBrief} className="space-y-4 text-right">
          <Field label="نوع البريف / الحملة">
            <input name="type" required defaultValue="حملة المحتوى الشهرية" className={inputClass} />
          </Field>
          <Field label="الهدف الإعلاني (Objective)">
            <textarea name="objective" required placeholder="ما هو الهدف المطلوب تحقيقه من الحملة؟..." className={textareaClass} />
          </Field>
          <Field label="الجمهور المستهدف (Buyer Persona)">
            <textarea name="buyer_persona" placeholder="صفات الشريحة المستهدفة، الفئة العمرية والاهتمامات..." className={textareaClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المنصات">
              <input name="platform" defaultValue="Instagram, TikTok, Facebook" className={inputClass} />
            </Field>
            <Field label="نبرة الصوت (Brand Tone)">
              <input name="brand_tone" defaultValue="Professional, Engaging & Premium" className={inputClass} />
            </Field>
          </div>
          <Field label="المتطلبات الأساسية وملاحظات الهوية">
            <textarea name="requirements" placeholder="الألوان، الخطوط، الشعار، والرسالة الرئيسية..." className={textareaClass} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setBriefOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <FileSpreadsheet size={14} /> حفظ البريف
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD PUBLISH APPROVAL */}
      <Modal open={publishApprovalOpen} onClose={() => setPublishApprovalOpen(false)} title="تسجيل موافقة العميل على النشر">
        <form onSubmit={handlePublishApproval} className="space-y-4 text-right">
          <p className="text-xs text-zinc-400 leading-relaxed">
            قم بتوثيق اعتماد العميل لنشر التصاميم والمحتوى.
          </p>
          <Field label="ربط بمهمة محددة (اختياري)">
            <select
              value={selectedTaskForPublish || ""}
              onChange={(e) => setSelectedTaskForPublish(e.target.value ? Number(e.target.value) : undefined)}
              className={inputClass}
            >
              <option value="">-- موافقة عامة على المحتوى --</option>
              {(client.tasks || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ملاحظات الاعتماد">
            <textarea
              value={publishNotes}
              onChange={(e) => setPublishNotes(e.target.value)}
              placeholder="مثال: تم إرسال الموافقة من العميل أحمد عبر واتساب بتاريخ اليوم..."
              className={textareaClass}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setPublishApprovalOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <CheckCircle2 size={14} /> توثيق الموافقة
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESCHEDULE SHOOT */}
      {rescheduleModalOpen && (
        <Modal open={!!rescheduleModalOpen} onClose={() => setRescheduleModalOpen(null)} title="تأجيل / تعديل موعد جلسة التصوير">
          <form onSubmit={handleRescheduleShoot} className="space-y-4 text-right">
            <p className="text-xs text-zinc-400">
              سيقوم النظام بالتحقق من عدم وجود تعارض في مواعيد المصور قبل تأكيد الحجز الجديد.
            </p>
            <Field label="الموعد الجديد المقترح">
              <input
                type="datetime-local"
                required
                value={newShootDate}
                onChange={(e) => setNewShootDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="سبب التأجيل / التعديل">
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="طلب العميل، تجهيز الموقع، الأحوال الجوية..."
                className={textareaClass}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setRescheduleModalOpen(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton>
                <Clock size={14} /> تأكيد الموعد الجديد
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: UPLOAD SOURCE FILE / SCRIPT */}
      <Modal open={uploadSourceOpen} onClose={() => setUploadSourceOpen(false)} title="رفع ملفات ومصادر وسكريبتات">
        <div className="space-y-4 text-right">
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#161618] p-6 text-center">
            <UploadCloud className="mx-auto text-[#facc15]" size={28} />
            <h4 className="text-xs font-bold text-white mt-2">اختر السكريبت أو ملفات المصدر</h4>
            <p className="text-[10px] text-zinc-500 mt-1">DOCX, PDF, ZIP, RAW, PSD — حتى 100MB</p>
            <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#222225] px-4 text-xs font-semibold text-zinc-200 hover:bg-white/10">
              <Paperclip size={13} /> اختيار الملف
              <input
                type="file"
                className="hidden"
                onChange={() => {
                  toast.success("تم رفع الملف والمصادر وربطها بالعميل بنجاح");
                  setUploadSourceOpen(false);
                }}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <SecondaryButton onClick={() => setUploadSourceOpen(false)}>إلغاء</SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* MODAL: EDIT CLIENT */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="تعديل بيانات العميل">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name")),
              industry: String(fd.get("industry")),
              contact_name: String(fd.get("contact_name")),
              contact_phone: String(fd.get("contact_phone")),
              contact_email: String(fd.get("contact_email")),
            };
            try {
              const updated = await api<Client>(`/clients/${client.id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
              });
              setClient((prev) => ({ ...prev, ...updated }));
              toast.success("تم تحديث بيانات العميل بنجاح");
              setEditOpen(false);
            } catch {
              toast.error("فشل التحديث");
            }
          }}
          className="grid gap-4 md:grid-cols-2 text-right"
        >
          <Field label="اسم الشركة">
            <input defaultValue={client.name} name="name" required className={inputClass} />
          </Field>
          <Field label="المجال">
            <input defaultValue={client.industry} name="industry" className={inputClass} />
          </Field>
          <Field label="الشخص المسؤول">
            <input defaultValue={client.contact_name} name="contact_name" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input defaultValue={client.contact_phone} name="contact_phone" required className={inputClass} />
          </Field>
          <Field label="البريد الإلكتروني" className="md:col-span-2">
            <input defaultValue={client.contact_email} name="contact_email" type="email" className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setEditOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>حفظ التعديلات</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
