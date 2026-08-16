"use client";
import { api } from "./api";
import { useCallback, useEffect, useState } from "react";
export function useApiData<T>(path:string,fallback:T){const [data,setData]=useState<T>(fallback);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const refresh=useCallback(async()=>{setLoading(true);setError(null);try{setData(await api<T>(path));}catch(e){setError(e instanceof Error?e.message:"خطأ غير متوقع");setData(fallback);}finally{setLoading(false)}},[path,fallback]);useEffect(()=>{refresh()},[refresh]);return {data,setData,loading,error,refresh};}
