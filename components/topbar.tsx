"use client";

import { CalendarDays, Search } from "lucide-react";
import { useAuth } from "./auth-provider";
import { NotificationCenter } from "./notification-center";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function Topbar({
  title,
  onSearch,
  action,
}: {
  title?: string;
  onSearch?: (query: string) => void;
  action?: React.ReactNode;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  if (!user) return null;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {title ? (
          <h1 className="text-2xl font-black text-white">{title}</h1>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-[#facc15]">
              <CalendarDays size={15} />
            </span>
            <span>{format(new Date(), "EEEE، d MMMM", { locale: ar })}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onSearch && (
          <div className="relative min-w-[220px] flex-1 sm:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search..."
              className="h-10 w-full rounded-xl border border-white/8 bg-[#161618] pr-10 pl-3 text-xs text-zinc-200 outline-none transition focus:border-[#facc15]/50 focus:ring-1 focus:ring-[#facc15]/20"
            />
          </div>
        )}

        {/* Global Notification Center with Bell */}
        <NotificationCenter />

        {action}
      </div>
    </div>
  );
}
