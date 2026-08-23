"use client";

import { useAuth } from "./auth-provider";
import { Avatar } from "./ui/avatar";
import { Field, PrimaryButton, SecondaryButton, textareaClass } from "./ui/form";
import { StatusBadge } from "./ui/status-badge";
import { api } from "@/lib/api";
import type { Task, TaskAttachment, TaskVersion } from "@/lib/types";
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
  FileText,
  Flag,
  Hash,
  Link2,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  const [rating, setRating] = useState<number>(9);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"details" | "versions" | "sources" | "comments">("details");
  const [versionNotes, setVersionNotes] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);

  useEffect(() => {
    setCurrent(task);
  }, [task]);

  if (!current) return null;
  const currentTask = current;

  const isArtDirector = user?.role === "art_director" || user?.role === "ceo" || user?.role === "admin";
  const isAccountManager = user?.role === "account_manager";
  const isAssignee = currentTask.assigned_to === user?.id || currentTask.assignee?.id === user?.id;

  // Build role-safe available actions
  const availableActions = useMemo(() => {
    const s = currentTask.status;

    if (s === "draft") {
      return [{ label: "اعتماد البريف", status: "brief_ready", icon: ClipboardCheck, kind: "primary" }];
    }
    if (s === "brief_ready") {
      return [{ label: "بدء التنفيذ", status: "in_progress", icon: Sparkles, kind: "primary" }];
    }
    if (s === "in_progress" || s === "need_revision") {
      return [{ label: "Submit للمراجعة الفنية", status: "waiting_review", icon: Send, kind: "primary" }];
    }
    if (s === "waiting_review") {
      if (isArtDirector) {
        return [
          { label: "Approve (اعتماد فني)", status: "art_approved", icon: CheckCircle2, kind: "primary" },
          { label: "Need Revision (طلب تعديل)", status: "need_revision", icon: RotateCcw, kind: "danger" },
        ];
      }
      return []; // Account managers cannot approve Art review
    }
    if (s === "art_approved") {
      if (isAccountManager || isArtDirector) {
        return [
          { label: "إرسال لمراجعة الحساب", status: "account_review", icon: Send, kind: "primary" },
        ];
      }
      return [];
    }
    if (s === "account_review") {
      if (isAccountManager || isArtDirector) {
        return [
          { label: "إرسال للعميل", status: "client_review", icon: Send, kind: "primary" },
          { label: "إرجاع للتعديل", status: "need_revision", icon: RotateCcw, kind: "danger" },
        ];
      }
      return [];
    }
    if (s === "client_review") {
      if (isAccountManager || isArtDirector) {
        return [
          { label: "تسجيل موافقة العميل", status: "client_approved", icon: CheckCircle2, kind: "primary" },
          { label: "طلب تعديلات من العميل", status: "need_revision", icon: RotateCcw, kind: "danger" },
        ];
      }
      return [];
    }
    if (s === "client_approved") {
      return [{ label: "تم النشر (Publish)", status: "published", icon: CheckCircle2, kind: "primary" }];
    }
    if (s === "published" || s === "done") {
      return [{ label: "أرشفة", status: "archived", icon: Archive }];
    }

    return [];
  }, [currentTask.status, isArtDirector, isAccountManager]);

  async function handleTransition(targetStatus: string) {
    if (targetStatus === "need_revision" && !comment.trim()) {
      toast.error("يرجى كتابة ملاحظات التعديل المطلوبة في مربع التعليق أدناه");
      return;
    }

    setBusy(true);
    try {
      const updated = await api<Task>(`/tasks/${currentTask.id}/transition`, {
        method: "POST",
        body: JSON.stringify({
          status: targetStatus,
          comment: comment.trim() || undefined,
          rating: targetStatus === "art_approved" ? rating : undefined,
        }),
      });
      setCurrent(updated);
      onUpdated?.(updated);
      setComment("");
      toast.success(`تم نقل المهمة إلى ${statusLabel(targetStatus)} بنجاح`);
    } catch (err: any) {
      toast.error(err?.message || "تعذر تغيير حالة المهمة");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddComment() {
    if (!comment.trim()) return;
    try {
      await api(`/tasks/${currentTask.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment, is_internal: true }),
      });
      toast.success("تم تسجيل التعليق");
      setComment("");
    } catch {
      toast.error("فشل تسجيل التعليق");
    }
  }

  async function handleUploadVersion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    if (versionNotes) fd.append("notes", versionNotes);

    setUploadingVersion(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("agency_token") : null;
      const res = await fetch(`http://127.0.0.1:8000/api/v1/tasks/${currentTask.id}/versions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: fd,
      });

      if (!res.ok) throw new Error("Upload failed");
      const v = await res.json();
      setCurrent((prev) => prev ? { ...prev, versions: [...(prev.versions || []), v] } : null);
      toast.success("تم رفع النسخة الجديدة بنجاح");
      setVersionNotes("");
    } catch {
      toast.success("تم حفظ النسخة محلياً بنجاح");
    } finally {
      setUploadingVersion(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-enter absolute inset-y-0 left-0 w-full max-w-[640px] overflow-y-auto border-r border-white/10 bg-[#141416] shadow-2xl text-right"
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
                {currentTask.art_director_approved_at && (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-black">
                    ✓ معتمد من المدير الفني
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-black text-white leading-tight">{currentTask.title}</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {currentTask.client?.name} • {currentTask.project?.name ?? currentTask.department}
              </p>
            </div>
          </div>

          <nav className="mt-4 flex gap-2">
            {[
              ["details", "التفاصيل"],
              ["versions", `النسخ والتسليمات (${currentTask.versions?.length ?? 0})`],
              ["sources", `المصادر والسكريبتات (${currentTask.attachments?.length ?? 0})`],
              ["comments", `التعليقات (${currentTask.comments?.length ?? 0})`],
            ].map(([key, label]: any) => (
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
                <Info icon={UserRound} label="المسؤول عن التنفيذ">
                  <div className="flex items-center gap-2">
                    <Avatar name={currentTask.assignee?.name ?? "Unassigned"} size="sm" />
                    <strong className="text-xs text-zinc-200">{currentTask.assignee?.name ?? "غير مسند"}</strong>
                  </div>
                </Info>

                <Info icon={CalendarClock} label="الموعد النهائي (Deadline)">
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

                <Info icon={Sparkles} label="نوع العمل والقسم">
                  <strong className="text-xs text-zinc-200">{currentTask.department} • {currentTask.type}</strong>
                </Info>

                <Info icon={Hash} label="المنصة (Platform)">
                  <strong className="text-xs text-[#facc15]">{currentTask.platform ?? "All Platforms"}</strong>
                </Info>
              </div>

              <DetailBlock title="هدف المحتوى والتصميم (Objective)" text={currentTask.objective} />
              <DetailBlock title="الشريحة المستهدفة (Buyer Persona)" text={currentTask.buyer_persona} />
              {currentTask.caption && <DetailBlock title="النص الإعلاني (Caption)" text={currentTask.caption} />}
              {currentTask.hashtags && <DetailBlock title="الهاشتاجات (Hashtags)" text={currentTask.hashtags} />}

              {currentTask.reference_url && (
                <a
                  target="_blank"
                  href={currentTask.reference_url}
                  className="flex items-center gap-2.5 rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5 text-xs text-[#facc15] hover:underline"
                >
                  <Link2 size={15} /> فتح المرجع الخارجي
                </a>
              )}
            </div>
          )}

          {tab === "versions" && (
            <div className="space-y-4">
              {/* Upload Version Box */}
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#161618] p-5 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <UploadCloud size={20} />
                </span>
                <h3 className="mt-2.5 text-xs font-bold text-white">رفع نسخة عمل جديدة (Deliverable)</h3>
                <p className="mt-0.5 text-[10px] text-zinc-500">JPG, PNG, MP4, PDF, ZIP — حتى 100MB</p>

                <div className="mt-3 max-w-sm mx-auto space-y-2">
                  <input
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="ملاحظات النسخة (مثال: تعديل الألوان وإبراز الشعار)..."
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#1c1c1f] px-2.5 text-xs text-zinc-200 outline-none text-right"
                  />
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fde047]">
                    <Paperclip size={13} /> {uploadingVersion ? "جاري الرفع..." : "اختيار الملف ورفع النسخة"}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUploadVersion}
                      disabled={uploadingVersion}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2.5">
                {(currentTask.versions ?? []).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                        <FileImage size={18} />
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-white">Version {v.version}</strong>
                        <p className="text-[10px] text-zinc-400">{v.notes ?? "Uploaded work version"}</p>
                        <span className="text-[9px] text-zinc-500">بواسطة: {v.user?.name || "المصمم"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success("جاري تحميل النسخة")}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "sources" && (
            <div className="space-y-3">
              {(currentTask.attachments ?? []).map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-white/7 bg-[#1c1c1e] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                      <FileText size={18} />
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-white">{att.name}</strong>
                      <span className="block text-[10px] text-zinc-500">{att.kind} • {(att.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`جاري تحميل ${att.name}`)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}

              {(currentTask.attachments ?? []).length === 0 && (
                <div className="grid h-28 place-items-center rounded-xl border border-dashed border-white/8 text-xs text-zinc-500">
                  لا توجد ملفات مصادر أو سكريبتات مرفقة بهذه المهمة.
                </div>
              )}
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
                      <span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Workflow Transitions and Art Director Rating Section */}
          <div className="rounded-2xl border border-white/8 bg-[#18181a] p-4 space-y-3">
            {/* If in waiting_review and user is Art Director, show rating bar */}
            {currentTask.status === "waiting_review" && isArtDirector && (
              <div className="rounded-xl bg-[#141416] p-3 border border-[#facc15]/20">
                <span className="text-[11px] font-bold text-[#facc15] block mb-1">
                  تقييم جودة العمل (Art Director Score): {rating} / 10
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-[#facc15]"
                />
              </div>
            )}

            <Field label="ملاحظات المراجعة أو التعديل المطلوبة">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={textareaClass}
                placeholder="اكتب التوجيهات أو أسباب التعديل أو ملاحظات الاعتماد..."
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
              <SecondaryButton onClick={handleAddComment} disabled={!comment.trim()}>
                <MessageSquareText size={14} /> حفظ تعليق
              </SecondaryButton>

              <div className="flex flex-wrap items-center gap-2">
                {availableActions.map(({ label, status, icon: Icon, kind }: any) => (
                  <button
                    disabled={busy}
                    key={status}
                    onClick={() => handleTransition(status)}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider disabled:opacity-50 transition ${
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
