"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockShoots } from "@/lib/mock-data";
import type { Metric, Paginated, ProductionShoot } from "@/lib/types";
import {
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  PackageOpen,
  Plus,
  UploadCloud,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProductionPage() {
  const [shoots, setShoots] = useState<ProductionShoot[]>(mockShoots);
  const [create, setCreate] = useState(false);

  useEffect(() => {
    api<Paginated<ProductionShoot>>("/production/shoots?per_page=100")
      .then((r) => {
        if (r?.data) setShoots(r.data);
      })
      .catch(() => {});
  }, []);

  const upcoming = shoots.filter((s) => new Date(s.scheduled_at) >= new Date());

  const metrics: Metric[] = [
    { key: "upcoming", label: "التصوير القادم", value: upcoming.length },
    {
      key: "week",
      label: "هذا الأسبوع",
      value: upcoming.filter((s) => new Date(s.scheduled_at).getTime() < Date.now() + 7 * 86400000).length,
    },
    { key: "completed", label: "تم هذا الشهر", value: 14, change: 16.4 },
    { key: "utilization", label: "استخدام المعدات", value: 78, format: "percent" },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Production Team"
        title="Production Calendar"
        description="مواعيد التصوير، المواقع، الفريق، المعدات، السيارة والـCall Sheet في شاشة تشغيل واحدة."
        icon={Camera}
        action={
          <PrimaryButton onClick={() => setCreate(true)}>
            <Plus size={15} /> حجز تصوير
          </PrimaryButton>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard metric={m} index={i} key={m.key} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Shoots List */}
        <div className="space-y-3.5">
          {shoots.map((shoot) => (
            <article
              className="panel bg-[#141415] border border-white/7 relative overflow-hidden p-5 rounded-2xl transition hover:border-white/15"
              key={shoot.id}
            >
              <div className="absolute right-0 top-0 h-full w-1 bg-[#facc15]" />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Date Chip */}
                <div className="flex min-w-24 shrink-0 items-center gap-3 lg:block lg:text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#facc15] text-black font-black text-xl lg:mx-auto">
                    {new Date(shoot.scheduled_at).getDate()}
                  </div>
                  <div className="lg:mt-1.5">
                    <strong className="block text-xs text-white">
                      {new Date(shoot.scheduled_at).toLocaleDateString("ar-EG", { month: "short" })}
                    </strong>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(shoot.scheduled_at).toLocaleDateString("ar-EG", { weekday: "short" })}
                    </span>
                  </div>
                </div>

                {/* Shoot Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white">{shoot.title}</h2>
                    <StatusBadge status={shoot.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">{shoot.client?.name}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <Mini
                      icon={Clock3}
                      label="Time"
                      value={new Date(shoot.scheduled_at).toLocaleTimeString("ar-EG", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    />
                    <Mini icon={MapPin} label="Location" value={shoot.location ?? "TBD"} />
                    <Mini icon={Car} label="Vehicle" value={shoot.vehicle ?? "Not assigned"} />
                    <Mini icon={Users} label="Team" value={`${shoot.team?.length ?? 0} members`} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 flex-wrap gap-2 lg:w-40 lg:flex-col">
                  <SecondaryButton
                    onClick={() => toast.success("تم فتح الـCall Sheet")}
                    className="flex-1 text-xs"
                  >
                    <FileText size={14} className="text-[#facc15]" /> Call Sheet
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() => toast.success("جاهز لاستقبال الـRaw files")}
                    className="flex-1 text-xs"
                  >
                    <UploadCloud size={14} /> Raw Files
                  </PrimaryButton>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar Widgets */}
        <aside className="space-y-4">
          <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">EQUIPMENT STATUS</span>
            <h2 className="mt-1 text-base font-bold text-white">المعدات الجاهزة</h2>
            <div className="mt-4 space-y-2.5">
              {[
                "Sony FX3 × 2",
                "Aputure 600D × 3",
                "24–70mm GM II",
                "DJI RS 4 Pro",
                "Wireless Lav × 4",
              ].map((item, i) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl bg-[#1c1c1f] p-3 text-xs">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-lg ${
                      i === 4 ? "bg-amber-500/15 text-amber-400" : "bg-[#facc15]/15 text-[#facc15]"
                    }`}
                  >
                    {i % 2 ? <Video size={15} /> : <Camera size={15} />}
                  </span>
                  <span className="flex-1 font-semibold text-zinc-200">{item}</span>
                  {i === 4 ? (
                    <span className="text-[10px] font-bold text-amber-400">2 in use</span>
                  ) : (
                    <CheckCircle2 size={15} className="text-[#facc15]" />
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className="panel bg-[#141415] border border-white/7 p-5 rounded-2xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
              <PackageOpen size={20} />
            </span>
            <h3 className="mt-3 text-sm font-bold text-white">Production checklist</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              تأكد من اعتماد البريف، الموقع، الفريق والمعدات قبل إرسال الـCall Sheet.
            </p>
            <div className="mt-4 h-1.5 rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-[#facc15]" style={{ width: "84%" }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
              <span>جاهزية اليوم</span>
              <strong className="text-[#facc15]">84%</strong>
            </div>
          </article>
        </aside>
      </section>

      <ShootModal
        open={create}
        onClose={() => setCreate(false)}
        onCreated={(s) => {
          setShoots((v) => [...v, s].sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)));
          setCreate(false);
        }}
      />
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1c1c1f] p-2.5">
      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
        <Icon size={11} className="text-[#facc15]" />
        {label}
      </div>
      <strong className="mt-1 block truncate text-xs text-zinc-200">{value}</strong>
    </div>
  );
}

function ShootModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (s: ProductionShoot) => void;
}) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const client = mockClients.find((c) => c.id === Number(fd.get("client_id"))) ?? mockClients[0];
    const payload = {
      client_id: client.id,
      title: String(fd.get("title")),
      location: String(fd.get("location")),
      scheduled_at: String(fd.get("scheduled_at")),
      vehicle: String(fd.get("vehicle")),
      team: ["Producer", "Photographer", "Assistant"],
      equipment: ["Sony FX3", "Aputure 600D"],
      status: "scheduled",
      notes: String(fd.get("notes")),
    };

    try {
      const s = await api<ProductionShoot>("/production/shoots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(s);
    } catch {
      onCreated({ ...payload, id: Date.now(), client });
    }
    toast.success("تم حجز موعد التصوير");
  }

  return (
    <Modal open={open} onClose={onClose} title="حجز جلسة تصوير">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="العنوان" className="md:col-span-2">
          <input required name="title" className={inputClass} placeholder="Summer Collection Promo" />
        </Field>
        <Field label="العميل">
          <select name="client_id" className={inputClass}>
            {mockClients.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الموعد">
          <input required name="scheduled_at" type="datetime-local" className={inputClass} />
        </Field>
        <Field label="المكان">
          <input name="location" className={inputClass} placeholder="New Cairo Studio" />
        </Field>
        <Field label="السيارة">
          <input name="vehicle" defaultValue="Production Van 01" className={inputClass} />
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <textarea name="notes" className={textareaClass} />
        </Field>
        <div className="flex justify-end gap-2 md:col-span-2 pt-2">
          <SecondaryButton type="button" onClick={onClose}>
            إلغاء
          </SecondaryButton>
          <PrimaryButton>
            <CalendarDays size={15} /> تأكيد الحجز
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
