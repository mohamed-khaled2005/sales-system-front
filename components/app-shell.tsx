"use client";

import { useAuth } from "./auth-provider";
import { Sidebar } from "./sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [slowLoading, setSlowLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  // If loading takes more than 2.5s, give recovery options
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) setSlowLoading(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0d0d0e] p-4 text-center">
        <div className="max-w-sm w-full space-y-4">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#facc15] text-black shadow-lg shadow-[#facc15]/20">
            <LoaderCircle className="animate-spin" size={24} />
          </span>
          <div>
            <p className="text-sm font-bold text-white">جاري تجهيز مساحة العمل...</p>
            <p className="mt-1 text-xs text-zinc-500">يتم التحقق من جلسة الدخول والصلاحيات</p>
          </div>

          {slowLoading && (
            <div className="pt-2 flex flex-col gap-2 animate-enter">
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#facc15] text-xs font-black text-black hover:bg-[#fde047] transition"
              >
                <LogIn size={14} />
                <span>الانتقال لصفحة تسجيل الدخول</span>
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("agency_token");
                  localStorage.removeItem("agency_user");
                  window.location.href = "/login";
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
              >
                مسح الجلسة السابقة وإعادة المحاولة
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-zinc-100">
      <Sidebar />
      <div className="lg:pr-[245px] min-h-screen flex flex-col">
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
