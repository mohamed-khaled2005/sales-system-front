"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`panel animate-enter max-h-[90vh] w-full overflow-auto border border-white/10 bg-[#161618] p-6 shadow-2xl ${width}`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/7 pb-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
