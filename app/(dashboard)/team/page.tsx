"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockEmployees } from "@/lib/mock-data";
import type { Department, Role, User } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Edit,
  Eye,
  EyeOff,
  Filter,
  FolderPlus,
  Key,
  Lock,
  Mail,
  MoreHorizontal,
  Percent,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const rolesList: { value: Role; label: string }[] = [
  { value: "ceo", label: "الرئيس التنفيذي (CEO)" },
  { value: "admin", label: "مدير النظام (System Admin)" },
  { value: "sales_leader", label: "مدير المبيعات (Sales Leader)" },
  { value: "sales", label: "مسؤول مبيعات (Sales Executive)" },
  { value: "account_manager", label: "مدير حسابات (Account Manager)" },
  { value: "art_director", label: "مدير فني (Art Director)" },
  { value: "designer", label: "مصمم جرافيك (Senior / Graphic Designer)" },
  { value: "video_editor", label: "مونتير فيديو (Video Editor)" },
  { value: "content_creator", label: "صانع محتوى (Content Creator)" },
  { value: "production", label: "مسؤول إنتاج وتصوير (Production Lead)" },
  { value: "finance", label: "المدير المالي (Finance Manager)" },
  { value: "quality", label: "مدير الجودة (Quality Manager)" },
  { value: "hr", label: "مدير الموارد البشرية (HR Manager)" },
];

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  // Modals
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const isExecutive = user?.role === "ceo" || user?.role === "admin" || user?.role === "hr";

  async function loadAll() {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api<User[]>("/users?include_inactive=1"),
        api<Department[]>("/departments"),
      ]);
      if (usersRes) setUsers(usersRes);
      if (deptsRes) setDepartments(deptsRes);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = (u.name + " " + u.email + " " + (u.job_title ?? "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (selectedRole !== "all" && u.role !== selectedRole) return false;
      if (selectedDept !== "all" && u.department_id !== Number(selectedDept)) return false;
      return true;
    });
  }, [users, search, selectedRole, selectedDept]);

  // Create User
  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      role: String(fd.get("role")) as Role,
      department_id: fd.get("department_id") ? Number(fd.get("department_id")) : undefined,
      job_title: String(fd.get("job_title") || ""),
      phone: String(fd.get("phone") || ""),
      target: fd.get("target") ? Number(fd.get("target")) : 0,
      commission_percentage: fd.get("commission_percentage") ? Number(fd.get("commission_percentage")) : 0,
      is_active: true,
    };

    try {
      const res = await api<User>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUsers((prev) => [res, ...prev]);
      toast.success(`تم إنشاء حساب الموظف ${res.name} بنجاح`);
      setCreateUserOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل إنشاء الحساب");
    }
  }

  // Update User (Full Granular Control)
  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;

    const fd = new FormData(e.currentTarget);
    const passwordVal = String(fd.get("password") || "").trim();

    const payload: Record<string, any> = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      role: String(fd.get("role")),
      department_id: fd.get("department_id") ? Number(fd.get("department_id")) : null,
      job_title: String(fd.get("job_title") || ""),
      phone: String(fd.get("phone") || ""),
      target: Number(fd.get("target") || 0),
      commission_percentage: Number(fd.get("commission_percentage") || 0),
      is_active: fd.get("is_active") === "true",
    };

    if (passwordVal) {
      payload.password = passwordVal;
    }

    try {
      const res = await api<User>(`/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setUsers((prev) => prev.map((u) => (u.id === res.id ? res : u)));
      toast.success("تم تحديث كافة بيانات وصلاحيات الحساب بنجاح");
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل تحديث الحساب");
    }
  }

  // Delete User
  async function handleDeleteUser() {
    if (!userToDelete) return;
    try {
      await api(`/users/${userToDelete.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(`تم حذف حساب ${userToDelete.name} نهائياً`);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف الحساب");
    }
  }

  // Create Team / Department
  async function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug") || ""),
      description: String(fd.get("description") || ""),
      icon: String(fd.get("icon") || "users"),
    };

    try {
      const res = await api<Department>("/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDepartments((prev) => [...prev, res]);
      toast.success(`تم إنشاء الفريق / القسم ${res.name} بنجاح`);
      setCreateTeamOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل إنشاء الفريق");
    }
  }

  // Update Team
  async function handleUpdateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingDept) return;

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug")),
      description: String(fd.get("description") || ""),
      icon: String(fd.get("icon") || "users"),
    };

    try {
      const res = await api<Department>(`/departments/${editingDept.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setDepartments((prev) => prev.map((d) => (d.id === res.id ? res : d)));
      toast.success("تم تحديث بيانات الفريق بنجاح");
      setEditingDept(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل تحديث الفريق");
    }
  }

  // Delete Team
  async function handleDeleteTeam() {
    if (!deptToDelete) return;
    try {
      await api(`/departments/${deptToDelete.id}`, { method: "DELETE" });
      setDepartments((prev) => prev.filter((d) => d.id !== deptToDelete.id));
      toast.success(`تم حذف الفريق ${deptToDelete.name} بنجاح`);
      setDeptToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف الفريق");
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Enterprise Administration"
        title="Teams & User Accounts Command"
        description="إدارة كاملة لهيكل الفرق والأقسام، وصلاحيات وحسابات المستخدمين مع تحكم دقيق في كافة التفاصيل."
        icon={Users}
        action={
          isExecutive && (
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={() => setCreateTeamOpen(true)}>
                <FolderPlus size={14} className="text-[#facc15]" /> + إضافة فريق / قسم جديد
              </SecondaryButton>
              <PrimaryButton onClick={() => setCreateUserOpen(true)}>
                <UserPlus size={14} /> + إضافة موظف جديد
              </PrimaryButton>
            </div>
          )
        }
      />

      {/* Navigation Tabs */}
      <div className="panel bg-[#141415] border border-white/7 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "users" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Users size={14} />
            <span>أعضاء الفريق وحسابات المستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "teams" ? "bg-[#facc15] text-black font-black" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Building2 size={14} />
            <span>الفرق والأقسام (Teams & Departments) ({departments.length})</span>
          </button>
        </div>

        <button
          onClick={loadAll}
          title="تحديث البيانات"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-zinc-400 hover:text-white"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* TAB 1: USERS & ACCOUNTS (WORDPRESS STYLE USER MANAGEMENT) */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="panel bg-[#141415] border border-white/7 p-4 rounded-2xl flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو المسمى الوظيفي..."
                className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 rounded-xl border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل الصلاحيات (All Roles)</option>
                {rolesList.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 rounded-xl border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="all">كل الأقسام والفرق (All Teams)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-right">
                <thead className="border-b border-white/7 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 text-right">المستخدم / الموظف</th>
                    <th className="pb-3 text-right">الدور والصلاحية</th>
                    <th className="pb-3 text-right">الفريق / القسم</th>
                    <th className="pb-3 text-center">التارجت / العمولة</th>
                    <th className="pb-3 text-center">حالة الحساب</th>
                    <th className="pb-3 text-left">التحكم والإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.is_active === false;
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition">
                        {/* User Identity */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" />
                            <div>
                              <strong className="block text-white font-bold">{u.name}</strong>
                              <span className="text-[10px] text-zinc-400 block">{u.email}</span>
                              {u.phone && <span className="text-[9px] text-zinc-500 block">{u.phone}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Role & Title */}
                        <td className="py-3.5">
                          <span className="rounded-full bg-[#facc15]/10 border border-[#facc15]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#facc15] block w-fit">
                            {u.role.replaceAll("_", " ")}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-1 block">{u.job_title || "Team Member"}</span>
                        </td>

                        {/* Team / Department */}
                        <td className="py-3.5 text-zinc-300">
                          {u.department ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Building2 size={13} className="text-[#facc15]" />
                              {u.department.name}
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>

                        {/* Targets / Commission */}
                        <td className="py-3.5 text-center">
                          {u.target ? (
                            <span className="block font-bold text-[#facc15]">{money(Number(u.target))}</span>
                          ) : null}
                          {u.commission_percentage !== undefined && (
                            <span className="text-[10px] text-zinc-400 block">عمولة: {u.commission_percentage}%</span>
                          )}
                          {!u.target && u.commission_percentage === undefined && <span className="text-zinc-500">—</span>}
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-black ${
                              isSuspended
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isSuspended ? "موقوف (Inactive)" : "نشط (Active)"}
                          </span>
                        </td>

                        {/* Controls */}
                        <td className="py-3.5 text-left">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1e1e22] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:text-[#facc15] transition"
                            >
                              <UserCog size={13} /> تحرير الحساب
                            </button>

                            {isExecutive && u.id !== user.id && (
                              <button
                                onClick={() => setUserToDelete(u)}
                                title="حذف الحساب"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                        لا يوجد موظفون مطابقون لخيارات البحث الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS & DEPARTMENTS */}
      {activeTab === "teams" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="panel bg-[#141415] border border-white/7 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#facc15]/15 text-[#facc15] font-black">
                      <Building2 size={22} />
                    </span>
                    <span className="rounded-full bg-[#facc15] px-2.5 py-0.5 text-[10px] font-black text-black">
                      {dept.users_count ?? (dept.users?.length ?? 0)} أعضاء
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{dept.name}</h3>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">slug: {dept.slug}</span>
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {dept.description || "فريق وقسم تشغيلي معتمد في الهيكل الإداري للوكالة."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setEditingDept(dept)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-[#facc15]"
                  >
                    <Edit size={13} /> تعديل الفريق
                  </button>

                  {isExecutive && (
                    <button
                      onClick={() => setDeptToDelete(dept)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: GRANULAR USER EDIT (WORDPRESS STYLE FULL CONTROL) */}
      {editingUser && (
        <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`التحكم الكامل في حساب: ${editingUser.name}`}>
          <form onSubmit={handleUpdateUser} className="space-y-4 text-right">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم الكامل">
                <input name="name" required defaultValue={editingUser.name} className={inputClass} />
              </Field>
              <Field label="البريد الإلكتروني">
                <input name="email" type="email" required defaultValue={editingUser.email} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الدور والصلاحية (Role)">
                <select name="role" defaultValue={editingUser.role} className={inputClass}>
                  {rolesList.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="الفريق / القسم">
                <select name="department_id" defaultValue={editingUser.department_id || ""} className={inputClass}>
                  <option value="">-- بدون قسم محدد --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المسمى الوظيفي (Job Title)">
                <input name="job_title" defaultValue={editingUser.job_title || ""} className={inputClass} />
              </Field>
              <Field label="رقم الهاتف">
                <input name="phone" defaultValue={editingUser.phone || ""} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="التارجت الشهري ($ / EGP)">
                <input name="target" type="number" defaultValue={editingUser.target || 0} className={inputClass} />
              </Field>
              <Field label="نسبة العمولة % (للمبيعات)">
                <input
                  name="commission_percentage"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editingUser.commission_percentage || 10}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-[#facc15]" />
                <strong className="text-xs text-white">إعادة تعيين كلمة المرور (Reset Password)</strong>
              </div>
              <input
                name="password"
                type="password"
                placeholder="اترك الحقل فارغاً إذا لم ترغب في تغيير كلمة المرور..."
                className={inputClass}
              />
            </div>

            <div className="rounded-xl border border-white/8 bg-[#1a1a1c] p-3.5 flex items-center justify-between">
              <div>
                <strong className="text-xs text-white block">حالة تفعيل الحساب (Account Status)</strong>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  إيقاف الحساب يمنع الموظف من تسجيل الدخول فوراً
                </span>
              </div>
              <select
                name="is_active"
                defaultValue={editingUser.is_active === false ? "false" : "true"}
                className="h-9 rounded-lg border border-white/10 bg-[#141416] px-3 text-xs text-white"
              >
                <option value="true">نشط ومفعل (Active)</option>
                <option value="false">موقوف (Suspended)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/7">
              <SecondaryButton type="button" onClick={() => setEditingUser(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton>
                <CheckCircle2 size={14} /> حفظ كافة التعديلات
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE USER */}
      <Modal open={createUserOpen} onClose={() => setCreateUserOpen(false)} title="إضافة موظف جديد إلى الوكالة">
        <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2 text-right">
          <Field label="الاسم الكامل">
            <input name="name" required placeholder="مثال: يوسف إبراهيم" className={inputClass} />
          </Field>
          <Field label="البريد الإلكتروني المهني">
            <input name="email" type="email" required placeholder="youssef@agency.local" className={inputClass} />
          </Field>
          <Field label="كلمة المرور">
            <input name="password" type="password" required minLength={8} placeholder="8 أحرف على الأقل" className={inputClass} />
          </Field>
          <Field label="الدور والصلاحية (Role)">
            <select name="role" required className={inputClass}>
              {rolesList.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الفريق / القسم">
            <select name="department_id" className={inputClass}>
              <option value="">-- بدون قسم محدد --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسمى الوظيفي">
            <input name="job_title" placeholder="Senior Creative Specialist" className={inputClass} />
          </Field>
          <Field label="رقم الهاتف">
            <input name="phone" placeholder="+20 100 000 0000" className={inputClass} />
          </Field>
          <Field label="نسبة العمولة %">
            <input name="commission_percentage" type="number" min={0} max={100} defaultValue={10} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateUserOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <UserPlus size={14} /> إنشاء الحساب
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE USER CONFIRMATION */}
      {userToDelete && (
        <Modal open={!!userToDelete} onClose={() => setUserToDelete(null)} title="تأكيد حذف الحساب">
          <div className="space-y-4 text-right">
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
              <AlertTriangle className="text-rose-400 shrink-0" size={20} />
              <p className="text-xs text-rose-300">
                هل أنت متأكد من رغبتك في حذف حساب <strong>{userToDelete.name}</strong> نهائياً؟ لن يتمكن من الوصول للنظام بعد الآن.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setUserToDelete(null)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeleteUser}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Trash2 size={14} /> تأكيد الحذف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CREATE TEAM / DEPARTMENT */}
      <Modal open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} title="إضافة فريق / قسم جديد">
        <form onSubmit={handleCreateTeam} className="space-y-4 text-right">
          <Field label="اسم الفريق / القسم">
            <input name="name" required placeholder="مثال: إدارة الحملات الرقمية (Performance Marketing)" className={inputClass} />
          </Field>
          <Field label="المعرف التعريفي (Slug)">
            <input name="slug" placeholder="performance-marketing" className={inputClass} />
          </Field>
          <Field label="وصف الفريق والمهام">
            <textarea name="description" placeholder="المهام والاختصاصات والمسؤوليات التابعة لهذا الفريق..." className={textareaClass} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateTeamOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <FolderPlus size={14} /> إنشاء الفريق
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT TEAM */}
      {editingDept && (
        <Modal open={!!editingDept} onClose={() => setEditingDept(null)} title={`تعديل فريق: ${editingDept.name}`}>
          <form onSubmit={handleUpdateTeam} className="space-y-4 text-right">
            <Field label="اسم الفريق">
              <input name="name" required defaultValue={editingDept.name} className={inputClass} />
            </Field>
            <Field label="المعرف التعريفي (Slug)">
              <input name="slug" required defaultValue={editingDept.slug} className={inputClass} />
            </Field>
            <Field label="وصف الفريق">
              <textarea name="description" defaultValue={editingDept.description || ""} className={textareaClass} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setEditingDept(null)}>
                إلغاء
              </SecondaryButton>
              <PrimaryButton>حفظ التعديلات</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DELETE TEAM CONFIRMATION */}
      {deptToDelete && (
        <Modal open={!!deptToDelete} onClose={() => setDeptToDelete(null)} title="تأكيد حذف الفريق">
          <div className="space-y-4 text-right">
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
              <AlertTriangle className="text-rose-400 shrink-0" size={20} />
              <p className="text-xs text-rose-300">
                هل أنت متأكد من حذف فريق <strong>{deptToDelete.name}</strong>؟
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setDeptToDelete(null)}>إلغاء</SecondaryButton>
              <button
                onClick={handleDeleteTeam}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Trash2 size={14} /> تأكيد الحذف
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
