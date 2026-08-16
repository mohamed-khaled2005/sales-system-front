"use client";

import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui/avatar";
import {
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Coins,
  FileCheck2,
  FolderArchive,
  Gauge,
  Handshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScanFace,
  ShieldCheck,
  Users,
  WalletCards,
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
  { href: "/dashboard", label: "Home", icon: Home, roles: "all" },
  { href: "/sales", label: "Closed Deals", icon: Handshake, roles: ["admin", "ceo", "sales", "quality"] },
  { href: "/clients", label: "Packages & Offers", icon: Package, roles: ["admin", "ceo", "sales", "account_manager", "finance", "quality"] },
  { href: "/tasks", label: "Workspace & Tasks", icon: ClipboardList, roles: ["admin", "ceo", "account_manager", "content_creator", "designer", "video_editor", "art_director", "production", "quality"] },
  { href: "/approvals", label: "Approvals", icon: CheckCheck, roles: ["admin", "ceo", "account_manager", "art_director", "quality"] },
  { href: "/production", label: "Production & Shoots", icon: Camera, roles: ["admin", "ceo", "account_manager", "art_director", "production"] },
  { href: "/finance", label: "Finance & Bonuses", icon: Coins, roles: ["admin", "ceo", "finance", "designer", "content_creator", "video_editor"] },
  { href: "/quality", label: "Quality & Rating", icon: Gauge, roles: ["admin", "ceo", "quality", "art_director"] },
  { href: "/hr", label: "HR & Attendance", icon: Users, roles: ["admin", "ceo", "hr"] },
  { href: "/team", label: "Team Members", icon: ShieldCheck, roles: ["admin", "ceo", "hr", "quality"] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [faceIdActive, setFaceIdActive] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);

  if (!user) return null;

  const isCreativeOrProduction = ["designer", "video_editor", "content_creator", "production"].includes(user.role);

  const items = navItems.filter(
    (item) => item.roles === "all" || (item.roles as Role[]).includes(user.role)
  );

  const content = (
    <div className="flex h-full flex-col justify-between p-4 text-white">
      <div>
        {/* User Profile Header */}
        <div className="flex flex-col items-center pt-3 pb-6 text-center">
          <div className="relative mb-3">
            <Avatar name={user.name} size="xl" framed />
          </div>
          <h2 className="text-sm font-black tracking-wider text-white uppercase">{user.name}</h2>
          <span className="mt-0.5 text-[10px] font-bold tracking-widest text-[#8e8e93] uppercase">
            {user.job_title ?? user.role.replace("_", " ")}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobile(false)}
                className={cn(
                  "group flex h-10 items-center justify-between rounded-xl px-3 text-xs font-semibold transition-all",
                  active
                    ? "bg-[#232326] text-white shadow-inner font-bold"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors",
                      active ? "text-[#facc15]" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span>{label}</span>
                </span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Middle & Bottom Widgets */}
      <div className="space-y-3 pt-4">
        {/* Shift Timer Widget for Creative / Production Users */}
        {isCreativeOrProduction && (
          <div className="rounded-2xl border border-white/7 bg-[#141416] p-3">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#facc15]/10 text-[#facc15]">
                  <Clock size={13} />
                </span>
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Shift Timer</span>
              </div>
              <strong className="font-mono text-xs text-white">08:00:00</strong>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mb-1.5">
                <span>DAILY PROGRESS</span>
                <span className="font-bold text-[#facc15]">65%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#facc15]" style={{ width: "65%" }} />
              </div>
              <span className="mt-1.5 block text-[9px] text-zinc-500">Daily Target Reached</span>
            </div>
          </div>
        )}

        {/* Biometric / Face ID Card Widget */}
        <div className="rounded-2xl border border-white/7 bg-[#141416] p-3.5 text-center transition hover:border-[#facc15]/30">
          <div
            onClick={() => setShowFaceIdModal(true)}
            className="cursor-pointer"
          >
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15] transition hover:scale-105">
              <ScanFace size={22} />
            </div>
            <strong className="block text-xs font-black text-white">
              {faceIdActive ? "Face ID Active" : "Face ID Inactive"}
            </strong>
            <span className="block text-[9px] text-zinc-500">Biometric Security</span>
          </div>

          <button
            onClick={() => setShowFaceIdModal(true)}
            className="mt-3 w-full rounded-xl bg-[#facc15] py-2 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#fde047] active:scale-95 flex items-center justify-center gap-1.5"
          >
            <ScanFace size={13} />
            <span>Manage Security</span>
          </button>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="space-y-1 border-t border-white/7 pt-3">
          <button
            onClick={() => setShowHelp(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <HelpCircle size={15} className="text-zinc-500" />
            <span>Help Center</span>
          </button>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut size={15} />
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
                onClick={() => setShowHelp(false)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-zinc-400"
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
        onClick={() => setMobile(true)}
        className="fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-xl bg-[#facc15] text-black shadow-lg lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar (Fixed on Right) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[260px] flex-col border-l border-white/7 bg-[#0d0d0e] lg:flex overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobile && (
        <div
          className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobile(false)}
        >
          <aside
            className="fixed inset-y-0 right-0 h-full w-[270px] bg-[#0d0d0e] border-l border-white/10 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobile(false)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400"
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
