"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", fn);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", fn);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
      onMouseDown={onClose}
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", position: "fixed" }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`panel animate-enter relative flex flex-col w-full border border-white/10 bg-[#161618] shadow-2xl rounded-2xl overflow-hidden ${width}`}
        style={{ maxHeight: "min(88vh, 760px)" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/7 px-5 py-4 sm:px-6 bg-[#161618] z-10">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
