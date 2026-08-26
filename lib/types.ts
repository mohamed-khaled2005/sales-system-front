export type Role =
  | "admin"
  | "ceo"
  | "sales_leader"
  | "sales"
  | "account_manager"
  | "content_creator"
  | "designer"
  | "video_editor"
  | "art_director"
  | "production"
  | "finance"
  | "quality"
  | "hr"
  | "team_leader"
  | "operations_manager"
  | "social_media_manager"
  | "media_buyer"
  | "copywriter"
  | "photographer"
  | "customer_support";

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  users_count?: number;
  users?: User[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  job_title?: string;
  avatar?: string;
  target?: number;
  commission_percentage?: number;
  phone?: string;
  is_active?: boolean;
  department?: Department;
  department_id?: number;
}

export interface Metric {
  key: string;
  label: string;
  value: number;
  format?: "currency" | "percent" | "score";
  change?: number;
}

export interface DashboardData {
  scope: string;
  metrics: Metric[];
  pipeline?: { stage: string; count: number; value: number }[];
  trend?: { month: string; value: number }[];
  cash_flow?: { month: string; value: number }[];
  tasks?: { status: string; count: number }[];
  clients?: Client[];
  review_queue?: Task[];
  upcoming?: Task[];
  overdue?: Invoice[];
  employees?: EmployeePerformance[];
}

export interface Lead {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage: string;
  temperature: "hot" | "warm" | "cold";
  estimated_value: number;
  probability: number;
  next_follow_up_at?: string;
  notes?: string;
  owner?: User;
}

export interface Package {
  id: number;
  name: string;
  monthly_price: number;
  reels: number;
  posts: number;
  stories: number;
  extra_services?: string[];
  is_active?: boolean;
}

export interface PackageNegotiation {
  id: number;
  client_id: number;
  salesperson_id: number;
  package_id: number;
  original_price: number;
  proposed_price: number;
  salesperson_notes?: string;
  status: "pending" | "approved" | "rejected";
  leader_id?: number;
  leader_notes?: string;
  decided_at?: string;
  created_at: string;
  client?: Client;
  package?: Package;
  salesperson?: User;
  leader?: User;
}

export interface PersonalReminder {
  id: number;
  user_id: number;
  client_id?: number;
  lead_id?: number;
  task_id?: number;
  title: string;
  type: "call" | "follow_up" | "task" | "reminder";
  remind_at: string;
  is_completed: boolean;
  notes?: string;
  created_at?: string;
  client?: Client;
  lead?: Lead;
  task?: Task;
}

export interface Subscription {
  id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  reels_used: number;
  posts_used: number;
  stories_used: number;
  package: Package;
}

export interface Brief {
  id: number;
  client_id: number;
  project_id?: number;
  created_by?: number;
  type: string;
  objective?: string;
  buyer_persona?: string;
  platform?: string;
  brand_tone?: string;
  requirements?: string[];
  references?: string[];
  status: string;
  created_at: string;
  creator?: User;
}

export interface ClientPublishApproval {
  id: number;
  client_id: number;
  task_id?: number;
  account_manager_id: number;
  status: string;
  notes?: string;
  recorded_at: string;
  created_at: string;
  account_manager?: User;
  accountManager?: User;
  task?: Task;
}

export interface Client {
  id: number;
  name: string;
  industry?: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: string;
  health_score: number;
  notes?: string;
  account_manager?: User;
  accountManager?: User;
  subscriptions?: Subscription[];
  projects?: Project[];
  tasks?: Task[];
  briefs?: Brief[];
  shoots?: ProductionShoot[];
  publish_approvals?: ClientPublishApproval[];
  publishApprovals?: ClientPublishApproval[];
  negotiations?: PackageNegotiation[];
}

export interface Project {
  id: number;
  name: string;
  type: string;
  status: string;
  progress: number;
  priority: string;
  due_at?: string;
  client?: Client;
  account_manager?: User;
  accountManager?: User;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  user_id?: number;
  name: string;
  path: string;
  mime?: string;
  size: number;
  kind: "source_file" | "script" | "reference" | "attachment" | "deliverable" | string;
  version: number;
  created_at: string;
  user?: User;
}

export interface TaskVersion {
  id: number;
  version: number;
  path: string;
  notes?: string;
  status: string;
  user?: User;
  created_at?: string;
}

export interface TaskComment {
  id: number;
  body: string;
  is_internal: boolean;
  created_at: string;
  user?: User;
}

export interface Approval {
  id: number;
  stage: string;
  status: string;
  comment?: string;
  rating?: number;
  reviewer?: User;
  reviewed_at?: string;
}

export interface Task {
  id: number;
  client_id?: number;
  project_id?: number;
  brief_id?: number;
  title: string;
  department: string;
  type: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  objective?: string;
  buyer_persona?: string;
  platform?: string;
  deadline?: string;
  caption?: string;
  hashtags?: string;
  reference_url?: string;
  metadata?: Record<string, unknown>;
  client?: Client;
  project?: Project;
  assignee?: User;
  creator?: User;
  created_by?: number;
  assigned_to?: number;
  submitted_at?: string;
  art_director_approved_at?: string;
  client_approved_at?: string;
  completed_at?: string;
  versions?: TaskVersion[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  approvals?: Approval[];
}

export interface Invoice {
  id: number;
  client_id?: number;
  number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid" | "overdue" | string;
  notes?: string | null;
  created_at?: string;
  client?: Client;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoice_id?: number | null;
  client_id: number;
  amount: number;
  paid_at: string;
  method?: "bank_transfer" | "cash" | "cheque" | "vodafone_cash" | "instapay" | "credit_card" | string;
  reference?: string | null;
  notes?: string | null;
  created_at?: string;
  client?: Client;
  invoice?: Invoice;
}

export interface Expense {
  id: number;
  category: "operational" | "marketing" | "software" | "equipment" | "travel" | "office" | "salaries" | "other" | string;
  description: string;
  amount: number;
  expense_date: string;
  vendor?: string | null;
  approved_by?: number | null;
  attachment?: string | null;
  created_at?: string;
  approver?: User;
}

export interface FinanceSummaryResponse {
  total_revenue: number;
  accounts_receivable: number;
  total_expenses: number;
  total_salaries_paid: number;
  net_profit: number;
  overdue_amount: number;
  cash_flow: { month: string; value: number; inflow?: number; outflow?: number; net?: number }[];
}

export interface ShootReschedule {
  id: number;
  shoot_id: number;
  previous_scheduled_at: string;
  new_scheduled_at: string;
  requested_by: number;
  reason?: string;
  created_at: string;
  requester?: User;
}

export interface ProductionShoot {
  id: number;
  client_id?: number;
  project_id?: number;
  title: string;
  location?: string | null;
  client_phone?: string | null;
  scheduled_at: string;
  team?: string[] | null;
  equipment?: string[] | null;
  vehicle?: string | null;
  photographer_id?: number | null;
  assistant_id?: number | null;
  call_sheet?: string | null;
  raw_files?: string[] | null;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rescheduled" | string;
  notes?: string | null;
  client?: Client;
  project?: Project;
  photographer?: User;
  assistant?: User;
  reschedules?: ShootReschedule[];
}

export interface EmployeePerformance extends User {
  tasks_count: number;
  completed_count: number;
  late_count: number;
  quality_score: number;
  speed_score?: number;
  manager_score?: number;
  client_score?: number;
  revision_count?: number;
  department?: Department;
}

export interface QualityReview {
  id: number;
  task_id: number;
  employee_id: number;
  reviewer_id?: number | null;
  quality_score: number;
  speed_score: number;
  manager_score?: number | null;
  client_score?: number | null;
  revision_count: number;
  comment?: string | null;
  reviewed_at?: string;
  created_at?: string;
  task?: Task;
  employee?: User;
  reviewer?: User;
}

export interface QualityReportSummary {
  tasks: number;
  completed: number;
  late: number;
  quality_score: number;
  speed_score?: number;
  revision_count: number;
  on_time_rate?: number;
}

export interface QualityReportResponse {
  period: "weekly" | "monthly" | "all" | string;
  from: string;
  to: string;
  summary: QualityReportSummary;
  employees: EmployeePerformance[];
  trend?: { month: string; value: number }[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
}

export interface AutomaticDeductionRule {
  id: number;
  name: string;
  event_type: "late_attendance" | "missed_deadline" | "unexcused_absence" | string;
  deduction_type: "fixed" | "percentage";
  amount: number;
  threshold_minutes: number;
  is_active: boolean;
  description?: string;
}

export interface EmployeeAdjustment {
  id: number;
  user_id: number;
  created_by?: number;
  type: "bonus" | "penalty" | "allowance" | "deduction";
  amount: number;
  effective_date: string;
  reason: string;
  notes?: string | null;
  user?: User;
  creator?: User;
}

export interface EmployeeRequest {
  id: number;
  request_type: "leave" | "negotiation" | "profile";
  type_label: string;
  employee?: User;
  details: string;
  status: string;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: "present" | "absent" | "late" | string;
  minutes_late: number;
  notes?: string | null;
  created_at?: string;
  user: User;
}

export interface LeaveRequestItem {
  id: number;
  user_id: number;
  type: string;
  starts_at: string;
  ends_at: string;
  days: number;
  reason?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at?: string;
  user: User;
  reviewer?: User;
}

export interface EmployeeContractItem {
  id: number;
  user_id: number;
  contract_type: string;
  starts_at: string;
  ends_at?: string | null;
  base_salary: number;
  currency: string;
  document_path?: string | null;
  status: "active" | "expired" | "terminated" | "draft" | string;
  notes?: string | null;
  created_at?: string;
  user: User;
}

export interface PayrollItem {
  id: number;
  user_id: number;
  period_month: string;
  base_salary: number;
  bonuses: number;
  commissions: number;
  deductions: number;
  net_salary: number;
  status: "draft" | "approved" | "paid" | string;
  paid_at?: string | null;
  payment_reference?: string | null;
  created_at?: string;
  user: User;
}

export interface DeductionEventLogItem {
  id: number;
  rule_id: number;
  user_id: number;
  event_signature: string;
  amount: number;
  adjustment_id?: number | null;
  created_at?: string;
  rule?: AutomaticDeductionRule;
  user?: User;
  adjustment?: EmployeeAdjustment;
}
