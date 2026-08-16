import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
  framed = false,
  className,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  framed?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-16 w-16 text-lg",
  };

  const frameClasses = framed
    ? "rounded-2xl ring-2 ring-[#facc15] ring-offset-2 ring-offset-[#0d0d0e]"
    : "rounded-full";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("object-cover ring-1 ring-white/10 shrink-0", frameClasses, sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center bg-gradient-to-br from-zinc-700 to-zinc-900 font-bold text-zinc-100 ring-1 ring-white/10 select-none",
        frameClasses,
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
