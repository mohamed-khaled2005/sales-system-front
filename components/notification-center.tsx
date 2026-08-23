"use client";

import { api } from "@/lib/api";
import type { NotificationItem, NotificationPreferences } from "@/lib/types";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Mail,
  MessageSquare,
  Radio,
  Settings2,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal } from "./ui/modal";
import { PrimaryButton, SecondaryButton } from "./ui/form";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    in_app: true,
    email: true,
    push: true,
  });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const res = await api<{ notifications: NotificationItem[]; unread_count: number }>("/notifications");
      if (res) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count);
      }
    } catch {
      // Fallback
    }
  }

  async function loadPreferences() {
    try {
      const res = await api<NotificationPreferences>("/preferences/notifications");
      if (res) setPreferences(res);
    } catch {}
  }

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAsRead(id: string) {
    try {
      await api(`/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("تم تحديد كل الإشعارات كمقروءة");
    } catch {}
  }

  async function savePreferences(updated: NotificationPreferences) {
    setPreferences(updated);
    try {
      await api("/preferences/notifications", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      toast.success("تم تحديث إعدادات الإشعارات");
    } catch {
      toast.error("فشل حفظ الإعدادات");
    }
  }

  async function enablePush() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("متصفحك لا يدعم إشعارات الويب أو الـ Push");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("تم رفض إذن الإشعارات من المتصفح");
        return;
      }

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Register Push endpoint
        await api("/push/subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: "pwa-webpush-endpoint-" + Date.now(),
            public_key: "dummy-key",
            auth_token: "dummy-token",
          }),
        });
        toast.success("تم تفعيل إشعارات الهاتف / الـ Web Push بنجاح!");
      }
    } catch (e) {
      toast.error("تعذر تفعيل خدمة الإشعارات");
    }
  }

  const items = notifications.filter((n) => (filter === "unread" ? !n.read_at : true));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#161618] text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#facc15] px-1 text-[10px] font-black text-black ring-2 ring-[#0d0d0e]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[380px] sm:w-[420px] rounded-2xl border border-white/10 bg-[#141416] p-4 shadow-2xl backdrop-blur-xl animate-enter">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/7 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#facc15]/15 text-[#facc15]">
                <Bell size={14} />
              </span>
              <h3 className="text-sm font-bold text-white">مركز الإشعارات</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#facc15] px-2 py-0.5 text-[10px] font-black text-black">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPrefsOpen(true)}
                title="إعدادات الإشعارات"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <Settings2 size={14} />
              </button>
              <button
                onClick={markAllAsRead}
                title="تحديد الكل كمقروء"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-[#facc15] transition"
              >
                <CheckCheck size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                filter === "all" ? "bg-[#facc15] text-black font-black" : "bg-[#1e1e20] text-zinc-400 hover:text-white"
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                filter === "unread" ? "bg-[#facc15] text-black font-black" : "bg-[#1e1e20] text-zinc-400 hover:text-white"
              }`}
            >
              غير مقروء ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {items.map((n) => {
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markAsRead(n.id);
                  }}
                  className={`group relative rounded-xl border p-3 text-right transition cursor-pointer ${
                    isUnread
                      ? "border-[#facc15]/30 bg-[#1a1a1c] hover:bg-[#202024]"
                      : "border-white/5 bg-[#141416] hover:bg-[#18181a] opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />}
                        <h4 className="text-xs font-bold text-white group-hover:text-[#facc15] transition">
                          {n.title}
                        </h4>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{n.message}</p>
                      <span className="mt-2 block text-[9px] text-zinc-500">
                        {new Date(n.created_at).toLocaleString("ar-EG", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnread) markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-zinc-400 hover:bg-[#facc15] hover:text-black transition shrink-0"
                      >
                        <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="grid h-36 place-items-center text-center text-xs text-zinc-500">
                <div>
                  <Sparkles className="mx-auto mb-1.5 text-zinc-600" size={18} />
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)} title="قنوات وتفضيلات الإشعارات">
        <div className="space-y-4 text-right">
          <p className="text-xs text-zinc-400 leading-relaxed">
            حدد القنوات التي ترغب في استلام التنبيهات والتحديثات عبرها.
          </p>

          <div className="space-y-3">
            {/* In-App */}
            <label className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 cursor-pointer hover:border-white/15">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <MessageSquare size={16} />
                </span>
                <div>
                  <strong className="block text-xs font-bold text-white">إشعارات داخل النظام (In-App)</strong>
                  <span className="text-[10px] text-zinc-400">ظهور التنبيهات في الجرس وشريط المهام</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.in_app}
                onChange={(e) => savePreferences({ ...preferences, in_app: e.target.checked })}
                className="h-4 w-4 accent-[#facc15]"
              />
            </label>

            {/* Mobile / Web Push */}
            <label className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 cursor-pointer hover:border-white/15">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <Smartphone size={16} />
                </span>
                <div>
                  <strong className="block text-xs font-bold text-white">إشعارات الهاتف و الـ Web Push</strong>
                  <span className="text-[10px] text-zinc-400">تنبيهات فورية تظهر على شاشة الهاتف والمتصفح</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.push}
                onChange={(e) => savePreferences({ ...preferences, push: e.target.checked })}
                className="h-4 w-4 accent-[#facc15]"
              />
            </label>

            {/* Email */}
            <label className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 cursor-pointer hover:border-white/15">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#facc15]/15 text-[#facc15]">
                  <Mail size={16} />
                </span>
                <div>
                  <strong className="block text-xs font-bold text-white">إشعارات البريد الإلكتروني</strong>
                  <span className="text-[10px] text-zinc-400">ملخصات وتنبيهات المهام على بريدك المسجل</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.email}
                onChange={(e) => savePreferences({ ...preferences, email: e.target.checked })}
                className="h-4 w-4 accent-[#facc15]"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl bg-[#1e1e22] p-3.5 flex items-center justify-between">
            <div className="text-right">
              <strong className="block text-xs font-bold text-white">تفعيل إشعارات الهاتف الآن</strong>
              <span className="text-[10px] text-zinc-400">طلب إذن المتصفح وتثبيت اشتراك الـPush</span>
            </div>
            <PrimaryButton onClick={enablePush} className="text-xs">
              <Radio size={13} /> تفعيل
            </PrimaryButton>
          </div>

          <div className="flex justify-end pt-2">
            <SecondaryButton onClick={() => setPrefsOpen(false)}>إغلاق</SecondaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
