"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockTasks } from "@/lib/mock-data";
import type { Client } from "@/lib/types";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Phone,
  Plus,
  StickyNote,
  User,
  Wrench,
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
  const [editOpen, setEditOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      api<Client>(`/clients/${params.id}`)
        .then(setClient)
        .catch(() => {});
    }
  }, [params.id]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Breadcrumb matching Screenshot 2 */}
      <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Link href="/sales" className="hover:text-zinc-300 transition">
          Sales Pipeline
        </Link>
        <ChevronRight size={13} className="text-zinc-600" />
        <span className="text-zinc-300">Client Profile</span>
      </nav>

      {/* Profile Header matching Screenshot 2 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-white">{client.name}</h1>
          <StatusBadge status={client.status || "active"} label="Active" />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-medium text-zinc-200 hover:bg-white/5 transition"
          >
            <Edit size={13} className="text-zinc-400" />
            <span>Edit Client</span>
          </button>

          <button
            onClick={() => setBriefOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a1c] px-3.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition"
          >
            <FileSpreadsheet size={13} />
            <span>Create Brief</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid Layout matching Screenshot 2 */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Business Overview & Service Details */}
        <div className="space-y-6">
          {/* Panel 1: Business Overview */}
          <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="text-[#facc15]">
                <Building2 size={17} />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide">Business Overview</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] font-medium text-zinc-500">
                  Business Name (اسم البزنس)
                </span>
                <strong className="mt-1 block text-sm text-zinc-200">{client.name}</strong>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-zinc-500">
                  Page Link (لينك الصفحة)
                </span>
                <a
                  href="https://linkedin.com/company/technova"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#facc15] hover:underline"
                >
                  <span>linkedin.com/company/technova</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </section>

          {/* Panel 2: Service Details */}
          <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-[#facc15]">
                <Wrench size={17} />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide">Service Details</h2>
            </div>

            {/* Service Details Card */}
            <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Required Service (الخدمة المطلوبة)
                    </span>
                    <strong className="block text-sm font-black text-white mt-0.5">
                      Social Media Management & SEO
                    </strong>
                    <span className="block text-xs text-zinc-400 mt-0.5">Tier 2 Enterprise Package</span>
                  </div>
                </div>

                <span className="self-start sm:self-center inline-block rounded-lg border border-white/10 bg-[#121213] px-3 py-1 text-[11px] font-bold text-zinc-300">
                  Q3 2024 Start
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Contact Info & Latest Note */}
        <div className="space-y-6">
          {/* Panel 3: Contact Info */}
          <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="text-[#facc15]">
                <FileText size={17} />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide">Contact Info</h2>
            </div>

            <div className="space-y-4 border-b border-white/7 pb-5">
              <div className="flex items-start gap-3">
                <User size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-zinc-500">Client Name</span>
                  <strong className="block text-xs font-bold text-zinc-200">
                    {client.contact_name || "Ahmed Al-Farsi"}
                  </strong>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-zinc-500">Contact Number</span>
                  <a
                    href={`tel:${client.contact_phone || "+971501234567"}`}
                    className="block text-xs font-bold text-zinc-200 hover:text-[#facc15]"
                  >
                    {client.contact_phone || "+971 50 123 4567"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-zinc-500">Address</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Dubai Internet City, Building 14, Office 302, Dubai, UAE
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => toast.success("تم بدء المحادثة مع العميل")}
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition"
              >
                <MessageCircle size={14} />
                <span>Contact Now</span>
              </button>
            </div>
          </section>

          {/* Panel 4: Latest Note */}
          <section className="panel bg-[#141415] border border-white/7 rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-[#facc15]">
                <StickyNote size={17} />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide">Latest Note</h2>
            </div>

            <div className="border-r-2 border-[#facc15] pr-3 py-1">
              <p className="text-xs italic text-zinc-300 leading-relaxed">
                &ldquo;Client requested emphasis on LinkedIn B2B lead generation. Follow up next Tuesday with
                initial content pillars.&rdquo;
              </p>
            </div>

            <span className="mt-4 block text-[10px] text-zinc-500 text-left">
              Added by Sarah • 2 hours ago
            </span>
          </section>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="تعديل بيانات العميل">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("تم تحديث بيانات العميل");
            setEditOpen(false);
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <Field label="اسم الشركة">
            <input defaultValue={client.name} name="name" className={inputClass} />
          </Field>
          <Field label="المجال">
            <input defaultValue={client.industry} name="industry" className={inputClass} />
          </Field>
          <Field label="الشخص المسؤول">
            <input defaultValue={client.contact_name} name="contact_name" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input defaultValue={client.contact_phone} name="contact_phone" className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-3">
            <SecondaryButton type="button" onClick={() => setEditOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>حفظ التعديلات</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Create Brief Modal */}
      <Modal open={briefOpen} onClose={() => setBriefOpen(false)} title="إنشاء Brief جديد للعميل">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("تم إنشاء البريف بنجاح");
            setBriefOpen(false);
          }}
          className="grid gap-4"
        >
          <Field label="عنوان البريف">
            <input required placeholder="مثال: Q3 Social Media Growth Campaign" className={inputClass} />
          </Field>
          <Field label="الأهداف الرئيسية">
            <textarea placeholder="حدد أهداف الحملة والمخرجات المطلوبة..." className={textareaClass} />
          </Field>
          <div className="flex justify-end gap-2 pt-3">
            <SecondaryButton type="button" onClick={() => setBriefOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>حفظ البريف</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
