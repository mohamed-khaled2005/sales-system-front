import { cn } from "@/lib/utils";

export function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-[#161618] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#facc15]/60 focus:ring-2 focus:ring-[#facc15]/10";

export const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#161618] p-3.5 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#facc15]/60 focus:ring-2 focus:ring-[#facc15]/10";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#fde047] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1e20] px-4 text-xs font-bold text-zinc-200 transition hover:border-white/20 hover:bg-[#252528] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}
