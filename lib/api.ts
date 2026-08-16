const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export class ApiError extends Error { constructor(message:string, public status:number, public errors?:Record<string,string[]>) { super(message); } }
export function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("agency_token"); }
export async function api<T>(path:string, options:RequestInit = {}):Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type","application/json");
  const token=getToken(); if(token && token!=="demo-token") headers.set("Authorization",`Bearer ${token}`);
  const response=await fetch(`${API_URL}${path}`,{...options,headers,cache:"no-store"});
  if(!response.ok){let payload:Record<string,unknown>={};try{payload=await response.json()}catch{};throw new ApiError(String(payload.message??"تعذر تنفيذ الطلب"),response.status,payload.errors as Record<string,string[]>);}
  if(response.status===204)return undefined as T;
  return response.json() as Promise<T>;
}
export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
