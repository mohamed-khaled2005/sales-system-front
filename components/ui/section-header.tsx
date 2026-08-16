import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#facc15]">
            {Icon && <Icon size={14} />} {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
