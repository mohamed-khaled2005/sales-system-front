"use client";

import { useAuth } from "@/components/auth-provider";
import { Field, inputClass, PrimaryButton } from "@/components/ui/form";
import { ArrowLeft, Check, Crown, Eye, EyeOff, LoaderCircle, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { FaceIdModal } from "@/components/face-id-modal";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaceId, setShowFaceId] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("مرحبًا بك في مساحة العمل");
    } catch {
      toast.error("بيانات الدخول غير صحيحة. يرجى التحقق والمحاولة مجددًا.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0b] p-4 md:p-8 flex items-center justify-center">
      {/* Background glow effects */}
      <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-[#facc15]/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-amber-500/8 blur-[140px] pointer-events-none" />

      <div className="mx-auto grid min-h-[560px] w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-white/8 bg-[#121214] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Side Presentation */}
        <section className="soft-grid relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between border-l border-white/5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#facc15] text-black">
              <Crown size={20} />
            </span>
            <div>
              <strong className="block text-sm font-black text-white tracking-wider">AGENCY OS</strong>
              <small className="text-[10px] font-bold text-zinc-500 tracking-widest">COMMAND CENTER</small>
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-3.5 py-1 text-xs font-bold text-[#facc15]">
              <Sparkles size={13} /> نظام تشغيل المبيعات والعمليات
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
              كل فريقك.<br />
              <span className="text-[#facc15]">مسار عمل واحد.</span>
            </h1>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              من أول فرصة مبيعات ومتابعة العملاء، إلى إنتاج المحتوى واعتمادات المدير الفني وحسابات الأرباح.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {["Sales Pipeline & Deals", "Creative Task Workflows", "Biometric Face Access", "Performance Scorecards"].map(
                (x) => (
                  <div
                    key={x}
                    className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#161618] p-3 text-xs text-zinc-300"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#facc15] text-black">
                      <Check size={11} />
                    </span>
                    <span className="truncate">{x}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="text-[11px] text-zinc-500">
            Powered by Enterprise Architecture • 2026
          </div>
        </section>

        {/* Right Side Login Form */}
        <section className="flex items-center justify-center bg-[#141416] p-6 sm:p-10">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#facc15]/10 border border-[#facc15]/20 px-3 py-1 text-[10px] font-bold text-[#facc15]">
                <ShieldCheck size={13} /> دخول آمن ومخصص
              </span>
              <h2 className="mt-3 text-2xl font-black text-white">تسجيل الدخول</h2>
              <p className="mt-1 text-xs text-zinc-400">
                أدخل بيانات حسابك للوصول إلى لوحة التحكم الخاصة بك.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field label="البريد الإلكتروني">
                <input
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="name@agency.local"
                  required
                />
              </Field>

              <Field label="كلمة المرور">
                <div className="relative">
                  <input
                    className={`${inputClass} pl-10`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <div className="flex flex-col gap-2.5 pt-2">
                <PrimaryButton disabled={loading} className="w-full !h-12 !rounded-xl">
                  {loading ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>دخول إلى النظام</span>
                      <ArrowLeft size={16} />
                    </>
                  )}
                </PrimaryButton>

                <button
                  type="button"
                  onClick={() => setShowFaceId(true)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#facc15]/30 bg-[#facc15]/10 text-xs font-bold text-[#facc15] hover:bg-[#facc15]/15 transition"
                >
                  <ScanFace size={16} />
                  <span>تسجيل الدخول ببصمة الوجه (Face ID)</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Face ID Login Modal */}
      <FaceIdModal
        open={showFaceId}
        onClose={() => setShowFaceId(false)}
        mode="login"
        initialEmail={email}
        onVerified={() => {
          setShowFaceId(false);
        }}
      />
    </main>
  );
}
