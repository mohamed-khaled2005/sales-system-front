"use client";
import { api, isDemoMode } from "@/lib/api";
import { demoUsers } from "@/lib/mock-data";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue={user:User|null;loading:boolean;login:(email:string,password:string)=>Promise<void>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true); const router=useRouter();
 const refresh=useCallback(async()=>{const token=localStorage.getItem("agency_token");const saved=localStorage.getItem("agency_user");if(!token){setUser(null);setLoading(false);return;}if(token==="demo-token"&&saved){setUser(JSON.parse(saved));setLoading(false);return;}try{const me=await api<User>("/auth/me");setUser(me);localStorage.setItem("agency_user",JSON.stringify(me));}catch{localStorage.removeItem("agency_token");localStorage.removeItem("agency_user");setUser(null);}finally{setLoading(false);}},[]);
 useEffect(()=>{refresh()},[refresh]);
  const login=useCallback(async(email:string,password:string)=>{
    try{
      const data=await api<{token:string;user:User}>("/auth/login",{method:"POST",body:JSON.stringify({email,password,device_name:"agency-web"})});
      localStorage.setItem("agency_token",data.token);
      localStorage.setItem("agency_user",JSON.stringify(data.user));
      setUser(data.user);
    }catch(error){
      if(!isDemoMode())throw error;
      const demo=demoUsers[email.toLowerCase()];
      if(!demo||password!=="password")throw error;
      localStorage.setItem("agency_token","demo-token");
      localStorage.setItem("agency_user",JSON.stringify(demo));
      setUser(demo);
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const next = params?.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  },[router]);
 const logout=useCallback(async()=>{try{if(localStorage.getItem("agency_token")!=="demo-token")await api("/auth/logout",{method:"POST"});}catch{}localStorage.removeItem("agency_token");localStorage.removeItem("agency_user");setUser(null);router.replace("/login");},[router]);
 const value=useMemo(()=>({user,loading,login,logout,refresh}),[user,loading,login,logout,refresh]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value;}
