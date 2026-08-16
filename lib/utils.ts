import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function money(value: number, currency = "EGP") { return new Intl.NumberFormat("ar-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
export function compact(value: number) { return new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
export function initials(name: string) { return name.split(" ").slice(0,2).map((word)=>word[0]).join("").toUpperCase(); }
export function statusLabel(value: string) { const labels: Record<string,string> = {draft:"مسودة",brief_ready:"البريف جاهز",in_progress:"قيد التنفيذ",waiting_review:"بانتظار المراجعة",need_revision:"يحتاج تعديلات",art_approved:"موافقة المدير الفني",account_review:"مراجعة الأكونت",client_review:"مراجعة العميل",client_approved:"موافقة العميل",scheduled:"مجدول",published:"منشور",done:"مكتمل",archived:"مؤرشف",new:"جديد",contacted:"تم التواصل",qualified:"مؤهل",proposal:"عرض سعر",negotiation:"تفاوض",won:"مغلق بنجاح",lost:"مفقود"}; return labels[value] ?? value.replaceAll("_"," "); }
