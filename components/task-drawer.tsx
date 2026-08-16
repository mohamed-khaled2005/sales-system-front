"use client";

import { useAuth } from "./auth-provider";
import { Avatar } from "./ui/avatar";
import { Field, PrimaryButton, SecondaryButton, textareaClass } from "./ui/form";
import { StatusBadge } from "./ui/status-badge";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { statusLabel } from "@/lib/utils";
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileImage,
  Flag,
  Hash,
  Link2,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const transitionMap: Record<string, { label: string; status: string; icon: typeof Check; kind?: "danger" | "primary" }[]> = {
  draft: [{ label: "اعتماد البريف", status: "brief_ready", icon: ClipboardCheck, kind: "primary" }],
  brief_ready: [{ label: "بدء التنفيذ", status: "in_progress", icon: Sparkles, kind: "primary" }],
  in_progress: [{ label: "Submit للمراجعة", status: "waiting_review", icon: Send, kind: "primary" }],
  waiting_review: [
    { label: "Approve", status: "art_approved", icon: CheckCircle2, kind: "primary" },
    { label: "Need Revision", status: "need_revision", icon: RotateCcw, kind: "danger" },
  ],
  need_revision: [{ label: "بدء التعديل", status: "in_progress", icon: Sparkles, kind: "primary" }],
  art_approved: [{ label: "إرسال للأكونت", status: "account_review", icon: Send, kind: "primary" }],
  account_review: [
    { label: "إرسال للعميل", status: "client_review", icon: Send, kind: "primary" },
    { label: "إرجاع للتعديل", status: "need_revision", icon: RotateCcw, kind: "danger" },
  ],
  client_review: [
    { label: "تسجيل موافقة العميل", status: "client_approved", icon: CheckCircle2, kind: "primary" },
    { label: "ملاحظات العميل", status: "need_revision", icon: RotateCcw, kind: "danger" },
  ],
  client_approved: [{ label: "تم النشر", status: "published", icon: CheckCircle2, kind: "primary" }],
  published: [{ label: "أرشفة", status: "archived", icon: Archive }],
  done: [{ label: "أرشفة", status: "archived", icon: Archive }],
};

export function TaskDrawer({
  task,
  onClose,
  onUpdated,
}: {
  task: Task | null;
  onClose: () => void;
  onUpdated?: (task: Task) => void;
}) {
  const { user } = useAuth();
  const [current, setCurrent] = useState<Task | null>(task);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"details" | "versions" | "comments">("details");

  useEffect(() => {
    setCurrent(task);
  }, [task]);

  const actions = useMemo(() => (current ? transitionMap[current.status] ?? [] : []), [current]);

  if (!current) return null;
  const currentTask = current;

  async function transition(status: string) {
    setBusy(true);
    try {
      let updated: Task;
      try {
        updated = await api<Task>(`/tasks/${currentTask.id}/transition`, {
          method: "POST",
          body: JSON.stringify({
            status,
            comment,
            rating: status === "art_approved" ? 9 : undefined,
          }),
        });
      } catch {
        updated = { ...currentTask, status };
      }
      setCurrent(updated);
      onUpdated?.(updated);
      setComment("");
      toast.success(`تم نقل المهمة إلى ${statusLabel(status)}`);
    } finally {
      setBusy(false);
    }
  }

  async function addComment() {
    if (!comment.trim()) return;
    try {
      await api(`/tasks/${currentTask.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment, is_internal: true }),
      });
    } catch {}
    toast.success("تم تسجيل التعليق");
    setComment("");
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-enter absolute inset-y-0 left-0 w-full max-w-[620px] overflow-y-auto border-r border-white/10 bg-[#141416] shadow-2xl"
      >
        <header className="sticky top-0 z-10 border-b border-white/7 bg-[#141416]/95 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={currentTask.status} />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    currentTask.priority === "urgent"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : currentTask.priority === "high"
                      ? "bg-[#facc15] text-black font-black"
                      : "bg-[#222] text-zinc-400 border border-white/10"
                  }`}
                >
                  <Flag size={10} className="ml-1 inline" />
                  {currentTask.priority}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white leading-tight">{currentTask.title}</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {currentTask.client?.name} • {currentTask.project?.name ?? currentTask.department}
              </p>
            </div>
          </div>

          <nav className="mt-4 flex gap-2">
            {(
              [
                ["details", "التفاصيل"],
                ["versions", "النسخ"],
                ["comments", "التعليقات"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tab === key ? "bg-[#facc15] text-black font-black" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <div className="p-5 space-y-5">
          {tab === "details" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info icon={UserRound} label="Assigned to">
                  <div className="flex items-center gap-2">
                    <Avatar name={currentTask.assignee?.name ?? "Unassigned"} size="sm" />
                    <strong className="text-xs text-zinc-200">{currentTask.assignee?.name ?? "غير مسند"}</strong>
                  </div>
                </Info>

                <Info icon={CalendarClock} label="Deadline">
                  <strong className="text-xs text-zinc-200">
                    {currentTask.deadline
                      ? new Date(currentTask.deadline).toLocaleString("ar-EG", {
                          day: "numeric",
                          month: "long",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "غير محدد"}
                  </strong>
                </Info>

                <Info icon={Sparkles} label="نوع المحتوى">
                  <strong className="text-xs text-zinc-200">{currentTask.type.replaceAll("_", " ")}</strong>
                </Info>

                <Info icon={Hash} label="Platform">
                  <strong className="text-xs text-[#facc15]">{currentTask.platform ?? "—"}</strong>
                </Info>
              </div>

              <DetailBlock title="هدف المحتوى" text={currentTask.objective} />
              <DetailBlock title="Buyer Persona" text={currentTask.buyer_persona} />
              {currentTask.caption && <DetailBlock title="Caption" text={currentTask.caption} />}
              {currentTask.hashtags && <DetailBlock title="Hashtags" text={currentTask.hashtags} />}

              {currentTask.reference_url && (
                <a
                  target="_blank"
                  href={currentTask.reference_url}
                  className="flex items-center gap-2.5 rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5 text-xs text-[#facc15] hover:underline"
                >
                  <Link2 size={15} /> فتح المرجع
                </a>
              )}

              {/* Upload Box */}
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#161618] p-5 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <UploadCloud size={20} />
                </span>
                <h3 className="mt-2.5 text-xs font-bold text-white">رفع ملف أو نسخة جديدة</h3>
                <p className="mt-0.5 text-[10px] text-zinc-500">Images, video, PDF, ZIP — up to 100MB</p>
                <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#222225] px-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/10">
                  <Paperclip size={13} /> اختيار ملف
                  <input
                    type="file"
                    className="hidden"
                    onChange={() => toast.success("تم اختيار الملف — اضغط رفع النسخة")}
                  />
                </label>
              </div>
            </div>
          )}

          {tab === "versions" && (
            <div className="space-y-2.5">
              {(
                currentTask.versions ?? [
                  {
                    id: 1,
                    version: 1,
                    path: "demo-v1.jpg",
                    status: "uploaded",
                    notes: "First creative direction",
                  },
                ]
              ).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                    <FileImage size={18} />
                  </span>
                  <div className="flex-1">
                    <strong className="text-xs font-bold text-white">Version {v.version}</strong>
                    <p className="text-[10px] text-zinc-400">{v.notes ?? "Uploaded file"}</p>
                  </div>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "comments" && (
            <div className="space-y-3">
              {(currentTask.comments ?? []).length === 0 ? (
                <div className="grid h-32 place-items-center rounded-xl border border-dashed border-white/8 text-center text-xs text-zinc-500">
                  <div>
                    <MessageSquareText className="mx-auto mb-1.5 opacity-50" size={20} />
                    <p>لا توجد تعليقات بعد</p>
                  </div>
                </div>
              ) : (
                currentTask.comments?.map((c) => (
                  <div key={c.id} className="rounded-xl bg-[#1c1c1e] p-3.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.user?.name ?? "User"} size="sm" />
                      <strong className="text-xs text-zinc-200">{c.user?.name}</strong>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Comment & Transition Actions */}
          <div className="rounded-2xl border border-white/8 bg-[#18181a] p-4 space-y-3">
            <Field label="تعليق أو ملاحظة للمراجعة">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={textareaClass}
                placeholder="اكتب ملاحظة واضحة وقابلة للتنفيذ..."
              />
            </Field>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <SecondaryButton onClick={addComment} disabled={!comment.trim()}>
                <MessageSquareText size={14} /> حفظ تعليق
              </SecondaryButton>

              {actions.map(({ label, status, icon: Icon, kind }) => (
                <button
                  disabled={busy}
                  key={status}
                  onClick={() => transition(status)}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider disabled:opacity-50 transition ${
                    kind === "primary"
                      ? "bg-[#facc15] text-black hover:bg-[#fde047]"
                      : kind === "danger"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                      : "bg-[#242428] text-white border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <Icon size={12} className="text-[#facc15]" />
        {label}
      </div>
      {children}
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5">
      <h3 className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{title}</h3>
      <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-200">
        {text ?? "لم تتم إضافة بيانات بعد."}
      </p>
    </div>
  );
}
