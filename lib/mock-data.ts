import type { Client, DashboardData, EmployeePerformance, Invoice, Lead, Metric, ProductionShoot, Role, Task, User } from "./types";

export const demoUsers: Record<string, User> = {
  "ceo@agency.local": { id: 2, name: "Ibrahim", email: "ceo@agency.local", role: "ceo", job_title: "CEO" },
  "gamal@agency.local": { id: 55, name: "Mohamed gamal", email: "gamal@agency.local", role: "photographer", job_title: "Photographer" },
  "doha@agency.local": { id: 36, name: "DOHA AHMED", email: "DOHA@agency.local", role: "sales", job_title: "Sales" },
  "mariam@agency.local": { id: 50, name: "Mariam abdelwahed", email: "Mariam@agency.local", role: "sales", job_title: "Sales" },
};

export const mockClients: Client[] = [];
export const mockLeads: Lead[] = [];
export const mockTasks: Task[] = [];
export const mockInvoices: Invoice[] = [];
export const mockShoots: ProductionShoot[] = [];
export const mockEmployees: EmployeePerformance[] = [];

const leadStages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const taskStatuses = ["draft", "brief_ready", "in_progress", "waiting_review", "need_revision", "art_approved", "account_review", "client_review", "client_approved", "scheduled", "published", "done", "archived"];

export function mockDashboard(role: Role = "ceo"): DashboardData {
  const initialMetrics: Metric[] = [
    { key: "clients", label: "عدد العملاء", value: 0 },
    { key: "projects", label: "المشاريع النشطة", value: 0 },
    { key: "sales", label: "المبيعات", value: 0, format: "currency" },
    { key: "collections", label: "التحصيلات", value: 0, format: "currency" },
    { key: "profit", label: "الأرباح", value: 0, format: "currency" },
    { key: "late", label: "المشاريع المتأخرة", value: 0 },
  ];

  const base: DashboardData = {
    scope: role,
    metrics: initialMetrics,
    pipeline: leadStages.map((stage) => ({ stage, count: 0, value: 0 })),
    cash_flow: [],
    tasks: taskStatuses.map((status) => ({ status, count: 0 })),
    review_queue: [],
    upcoming: [],
    clients: [],
    overdue: [],
    employees: [],
  };

  if (role === "sales") {
    base.metrics = [
      { key: "leads", label: "عدد الـ Leads", value: 0 },
      { key: "new", label: "العملاء الجدد", value: 0 },
      { key: "deals", label: "قيمة الـ Deals", value: 0, format: "currency" },
      { key: "conversion", label: "Conversion Rate", value: 0, format: "percent" },
      { key: "target", label: "Target", value: 0, format: "currency" },
      { key: "achievement", label: "تحقيق التارجت", value: 0, format: "percent" },
    ];
  } else if (["designer", "video_editor", "content_creator", "production", "photographer"].includes(role)) {
    base.metrics = [
      { key: "tasks", label: "مهامي", value: 0 },
      { key: "today", label: "تسليم اليوم", value: 0 },
      { key: "review", label: "بانتظار المراجعة", value: 0 },
      { key: "done", label: "تم هذا الشهر", value: 0 },
    ];
  } else if (role === "finance") {
    base.metrics = [
      { key: "revenue", label: "الإيرادات", value: 0, format: "currency" },
      { key: "expenses", label: "المصروفات", value: 0, format: "currency" },
      { key: "profit", label: "صافي الربح", value: 0, format: "currency" },
      { key: "overdue", label: "متأخرات العملاء", value: 0, format: "currency" },
    ];
  } else if (role === "quality") {
    base.metrics = [
      { key: "quality", label: "Quality Score", value: 0, format: "score" },
      { key: "late", label: "Late Tasks", value: 0 },
      { key: "completed", label: "Completed Tasks", value: 0 },
      { key: "revision", label: "Revision Rate", value: 0, format: "percent" },
    ];
  }

  return base;
}
