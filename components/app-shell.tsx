"use client";

import { useAuth } from "./auth-provider";
import { Sidebar } from "./sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0d0d0e]">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#facc15] text-black">
            <LoaderCircle className="animate-spin" size={24} />
          </span>
          <p className="mt-4 text-xs font-semibold text-zinc-400 tracking-wider">جاري تجهيز مساحة العمل...</p>
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
