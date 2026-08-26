"use client";

import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui/avatar";
import {
  Building2,
  Camera,
  CheckCheck,
  ClipboardList,
  Coins,
  Gauge,
  Handshake,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Package,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaceIdModal } from "./face-id-modal";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[] | "all";
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home Dashboard", icon: Home, roles: "all" },
  { href: "/sales", label: "Sales Pipeline", icon: Handshake, roles: ["admin", "ceo", "sales_leader", "sales", "quality"] },
  { href: "/packages", label: "Sales Packages", icon: Package, roles: ["admin", "ceo", "sales_leader", "sales", "account_manager", "finance"] },
  { href: "/clients", label: "Clients Portfolio", icon: Building2, roles: ["admin", "ceo", "sales_leader", "sales", "account_manager", "finance", "quality", "customer_support"] },
  {
    href: "/tasks",
    label: "Workspace & Tasks",
    icon: ClipboardList,
    roles: [
      "admin",
      "ceo",
      "account_manager",
      "content_creator",
      "designer",
      "video_editor",
      "art_director",
      "production",
      "quality",
      "media_buyer",
      "copywriter",
      "photographer",
      "social_media_manager",
      "team_leader",
      "operations_manager",
      "customer_support",
    ],
  },
  { href: "/approvals", label: "Approvals", icon: CheckCheck, roles: ["admin", "ceo", "account_manager", "art_director", "quality"] },
  { href: "/production", label: "Production & Shoots", icon: Camera, roles: ["admin", "ceo", "account_manager", "art_director", "production", "photographer"] },
  { href: "/finance", label: "Finance & Bonuses", icon: Coins, roles: ["admin", "ceo", "finance", "designer", "content_creator", "video_editor"] },
  { href: "/quality", label: "Quality & Rating", icon: Gauge, roles: ["admin", "ceo", "quality", "art_director"] },
  { href: "/hr", label: "HR & Attendance", icon: Users, roles: ["admin", "ceo", "hr"] },
  { href: "/team", label: "Team Members", icon: ShieldCheck, roles: ["admin", "ceo", "hr", "quality", "sales_leader"] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [faceIdActive, setFaceIdActive] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);

  if (!user) return null;

  const items = navItems.filter(
    (item) => item.roles === "all" || (item.roles as Role[]).includes(user.role)
  );

  const content = (
    <div className="flex h-full flex-col justify-between p-3.5 text-white overflow-hidden select-none">
      {/* Top Header & Navigation Links */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Bar */}
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-[#facc15] to-[#ca8a04] text-black shadow-md shadow-[#facc15]/20">
              <Sparkles size={12} className="fill-black" />
            </div>
            <span className="text-[11px] font-black tracking-widest text-white uppercase">COMMAND CENTER</span>
          </div>
          <span className="rounded-md bg-[#facc15]/10 px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#facc15] font-mono border border-[#facc15]/20">
            PRO
          </span>
        </div>

        {/* User Profile Card */}
        <div className="mb-3 rounded-xl border border-white/8 bg-[#141416]/90 p-2.5 backdrop-blur-sm transition hover:border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Avatar name={user.name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#141416]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xs font-black tracking-wide text-white" title={user.name}>
                {user.name}
              </h2>
              <span className="block truncate text-[10px] font-bold text-[#facc15] font-mono">
                {user.job_title ?? user.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links with Optimized Spacing & Height */}
        <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-0.5 py-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobile(false)}
                className={cn(
                  "group flex h-9.5 items-center justify-between rounded-xl px-3 text-xs font-medium transition-all duration-150",
                  active
                    ? "bg-gradient-to-r from-[#facc15]/18 to-[#facc15]/5 text-[#facc15] font-bold border border-[#facc15]/30 shadow-[0_2px_10px_rgba(250,204,21,0.08)]"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-[#facc15]" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </span>
                {active ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#facc15] shadow-[0_0_6px_#facc15]" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent group-hover:bg-white/20 transition-colors" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Biometric Widget & Balanced Footer */}
      <div className="shrink-0 space-y-2.5 pt-2.5 border-t border-white/8 mt-2">
        {/* Biometric / Face ID Pill */}
        <div
          onClick={() => setShowFaceIdModal(true)}
          className="group flex items-center justify-between rounded-xl border border-white/8 bg-[#141416] p-2.5 hover:border-[#facc15]/35 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#facc15]/10 text-[#facc15] group-hover:bg-[#facc15] group-hover:text-black transition">
              <ScanFace size={15} />
            </span>
            <div className="min-w-0">
              <strong className="block text-[10.5px] font-bold text-white leading-tight truncate">
                {faceIdActive ? "Face ID Active" : "Face ID Inactive"}
              </strong>
              <span className="block text-[9px] text-zinc-500 font-mono truncate">Biometric Security</span>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-white/5 group-hover:bg-[#facc15] group-hover:text-black px-2 py-0.5 text-[9px] font-bold text-zinc-400 transition">
            Manage
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-[11px] font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <HelpCircle size={14} className="text-zinc-500" />
            <span>Help</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="panel max-w-sm w-full p-6 border border-white/10 bg-[#161618] text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white">مركز المساعدة والدعم</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              لأي استفسار أو مشكلة في النظام، يرجى التواصل مع المدير الفني أو مسؤول تكنولوجيا المعلومات.
            </p>
            <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-zinc-300 space-y-1">
              <div>📞 Support: +20 100 000 0000</div>
              <div>✉️ Email: support@agency.local</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setMobile(true)}
        className="fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-xl bg-[#facc15] text-black shadow-lg lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar (Fixed on Right) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[245px] flex-col border-l border-white/7 bg-[#0d0d0e] lg:flex overflow-hidden">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobile && (
        <div
          className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobile(false)}
        >
          <aside
            className="fixed inset-y-0 right-0 h-full w-[265px] bg-[#0d0d0e] border-l border-white/10 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setMobile(false)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}

      {/* Face ID Biometric Security Scanner Modal */}
      <FaceIdModal
        open={showFaceIdModal}
        onClose={() => setShowFaceIdModal(false)}
      />
    </>
  );
}
