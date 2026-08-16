import { cn, statusLabel } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  // Gold / Yellow Primary Accents
  active: "border-[#facc15]/50 bg-[#facc15]/10 text-[#facc15]",
  new: "border-[#facc15]/50 bg-[#facc15]/10 text-[#facc15]",
  won: "border-[#facc15] bg-[#facc15] text-black font-black",
  closed: "border-[#facc15] bg-[#facc15] text-black font-black",
  negotiation: "border-[#facc15]/50 bg-[#facc15]/10 text-[#facc15]",
  art_approved: "border-[#facc15] bg-[#facc15] text-black font-black",
  client_approved: "border-[#facc15] bg-[#facc15] text-black font-black",
  approved: "border-[#facc15] bg-[#facc15] text-black font-black",
  high: "border-[#facc15] bg-[#facc15] text-black font-black",
  urgent: "border-rose-500 bg-rose-500 text-white font-black",
  from_am: "border-[#facc15] bg-[#facc15] text-black font-black",
  
  // Grey / Subtle Dark Pill Accents
  in_progress: "border-white/10 bg-[#222225] text-zinc-300",
  review: "border-white/10 bg-[#222225] text-zinc-300",
  waiting_review: "border-white/10 bg-[#222225] text-zinc-300",
  pending_review: "border-white/10 bg-[#222225] text-zinc-300",
  pending: "border-white/10 bg-[#222225] text-zinc-400",
  draft: "border-white/10 bg-[#1e1e20] text-zinc-500",
  brief_ready: "border-white/10 bg-[#222225] text-zinc-300",
  account_review: "border-white/10 bg-[#222225] text-zinc-300",
  client_review: "border-white/10 bg-[#222225] text-zinc-300",
  
  // States
  published: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  done: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  paid: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  unpaid: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  need_revision: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  lost: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  contacted: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  qualified: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  proposal: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

export function StatusBadge({ status, className, showDot = true, label }: { status: string; className?: string; showDot?: boolean; label?: string }) {
  const norm = status?.toLowerCase().replace(/[\s-]/g, "_") ?? "";
  const style = statusStyles[norm] ?? "border-white/10 bg-white/5 text-zinc-300";
  const displayLabel = label ?? statusLabel(status);

  const isSolid = style.includes("text-black") || style.includes("font-black");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition",
        style,
        className
      )}
    >
      {showDot && !isSolid && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {displayLabel}
    </span>
  );
}

export function PackageBadge({ name }: { name: string }) {
  const norm = name.toUpperCase();
  if (norm === "ELITE") {
    return (
      <span className="inline-block rounded-full border border-[#facc15]/50 bg-[#facc15]/10 px-3 py-0.5 text-[10px] font-bold text-[#facc15]">
        ELITE
      </span>
    );
  }
  if (norm === "PRO") {
    return (
      <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-[10px] font-bold text-zinc-300">
        PRO
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full border border-white/10 bg-black/40 px-3 py-0.5 text-[10px] font-medium text-zinc-400">
      {norm}
    </span>
  );
}
