"use client";

import { api, isDemoMode } from "@/lib/api";
import { demoUsers } from "@/lib/mock-data";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithFace: (email: string, faceSignature: string, faceDescriptor?: number[]) => Promise<{ confidence: number }>;
  enrollFaceAndLogin: (email: string, password: string, faceSignature: string, faceDescriptor?: number[]) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("agency_token") : null;
    const saved = typeof window !== "undefined" ? localStorage.getItem("agency_user") : null;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }

    try {
      const data = await api<{ user: User }>("/auth/me");
      setUser(data.user);
      localStorage.setItem("agency_user", JSON.stringify(data.user));
    } catch {
      // Keep cached state if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await api<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, device_name: "agency-web" }),
        });
        localStorage.setItem("agency_token", data.token);
        localStorage.setItem("agency_user", JSON.stringify(data.user));
        localStorage.setItem("agency_last_email", data.user.email);
        setUser(data.user);
      } catch (error) {
        if (!isDemoMode()) throw error;
        const demo = demoUsers[email.toLowerCase()];
        if (!demo || password !== "password") throw error;
        localStorage.setItem("agency_token", "demo-token");
        localStorage.setItem("agency_user", JSON.stringify(demo));
        localStorage.setItem("agency_last_email", demo.email);
        setUser(demo);
      }

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const next = params?.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    },
    [router]
  );

  const loginWithFace = useCallback(
    async (email: string, faceSignature: string, faceDescriptor?: number[]): Promise<{ confidence: number }> => {
      try {
        const data = await api<{ token: string; user: User; confidence_score?: number }>("/auth/face-id/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            face_signature: faceSignature,
            face_descriptor: faceDescriptor,
            device_name: "agency-web-face-id",
          }),
        });
        localStorage.setItem("agency_token", data.token);
        localStorage.setItem("agency_user", JSON.stringify(data.user));
        localStorage.setItem("agency_last_email", data.user.email);
        setUser(data.user);

        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const next = params?.get("next");
        router.replace(next && next.startsWith("/") ? next : "/dashboard");

        return { confidence: data.confidence_score ?? 96.2 };
      } catch (error: any) {
        if (!isDemoMode()) throw error;

        // Local offline verification with strict cosine similarity
        const storedBioStr = localStorage.getItem(`local_face_id_${email.toLowerCase()}`);
        if (!storedBioStr) {
          throw new Error("لم يتم تسجيل بصمة وجه لهذا الحساب بعد. يرجى تفعيل خيار 'تسجيل بصمة جديدة لأول مرة' وتأكيد كلمة المرور.");
        }

        const storedBio = JSON.parse(storedBioStr);
        if (storedBio.descriptor && faceDescriptor) {
          let dot = 0, magA = 0, magB = 0, sumSqDiff = 0;
          const len = Math.min(storedBio.descriptor.length, faceDescriptor.length);
          for (let i = 0; i < len; i++) {
            const a = Number(storedBio.descriptor[i]);
            const b = Number(faceDescriptor[i]);
            dot += a * b;
            magA += a * a;
            magB += b * b;
            const diff = a - b;
            sumSqDiff += diff * diff;
          }
          const cosine = (magA > 0.001 && magB > 0.001) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
          const euclidean = Math.sqrt(sumSqDiff) / Math.sqrt(len || 1);
          const cosineScore = Math.max(0, cosine);
          const euclideanScore = Math.max(0, 1.0 - (euclidean * 2.5));
          const similarity = Math.round(Math.min(99.4, Math.max(5, (cosineScore * 0.5 + euclideanScore * 0.5) * 100)) * 10) / 10;
          
          if (similarity < 80.0) {
            throw new Error(`بصمة الوجه لا تتطابق مع بصمة الموظف المسجلة (نسبة التطابق: ${similarity}% - الحد الأدنى المطلوب للأمان: 80%). تم رفض الدخول.`);
          }

          const demo = demoUsers[email.toLowerCase()] || demoUsers["ceo@agency.local"];
          if (!demo) throw error;
          localStorage.setItem("agency_token", "demo-token");
          localStorage.setItem("agency_user", JSON.stringify(demo));
          localStorage.setItem("agency_last_email", demo.email);
          setUser(demo);

          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const next = params?.get("next");
          router.replace(next && next.startsWith("/") ? next : "/dashboard");

          return { confidence: similarity };
        }

        throw error;
      }
    },
    [router]
  );

  const enrollFaceAndLogin = useCallback(
    async (email: string, password: string, faceSignature: string, faceDescriptor?: number[]) => {
      try {
        const data = await api<{ token: string; user: User }>("/auth/face-id/enroll", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            face_signature: faceSignature,
            face_descriptor: faceDescriptor,
            device_info: "Integrated WebCam Biometric Sensor",
          }),
        });
        localStorage.setItem("agency_token", data.token);
        localStorage.setItem("agency_user", JSON.stringify(data.user));
        localStorage.setItem("agency_last_email", data.user.email);
        setUser(data.user);
      } catch (error: any) {
        if (!isDemoMode()) throw error;
        const demo = demoUsers[email.toLowerCase()] || demoUsers["ceo@agency.local"];
        if (!demo || password !== "password") throw error;

        // Store local enrolled biometric signature & vector for offline comparison
        localStorage.setItem(
          `local_face_id_${email.toLowerCase()}`,
          JSON.stringify({ signature: faceSignature, descriptor: faceDescriptor, enrolled_at: new Date().toISOString() })
        );

        localStorage.setItem("agency_token", "demo-token");
        localStorage.setItem("agency_user", JSON.stringify(demo));
        localStorage.setItem("agency_last_email", demo.email);
        setUser(demo);
      }

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const next = params?.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("agency_token") !== "demo-token") {
        await api("/auth/logout", { method: "POST" });
      }
    } catch {}
    localStorage.removeItem("agency_token");
    localStorage.removeItem("agency_user");
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, loginWithFace, enrollFaceAndLogin, logout, refresh }),
    [user, loading, login, loginWithFace, enrollFaceAndLogin, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
