"use client";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { api } from "@/lib/api";
import {
  allRolesList,
  getCompatibleDepartments,
  getDefaultDepartment,
  getRoleInfo,
  getRoleLabel,
  isRoleCompatibleWithDept,
  roleCategories,
} from "@/lib/roles";
import type { Department, Role, User } from "@/lib/types";
import { money } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clapperboard,
  Crown,
  Edit,
  ExternalLink,
  Eye,
  Filter,
  FolderPlus,
  Gauge,
  Headphones,
  Info,
  Lock,
  Mail,
  Megaphone,
  Palette,
  PenTool,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Icon mapping for departments
function getDeptIcon(slug?: string, iconName?: string) {
  switch (slug) {
    case "management":
      return Crown;
    case "sales":
      return BadgeDollarSign;
    case "account-management":
      return Users;
    case "content":
      return PenTool;
    case "design":
      return Palette;
    case "video":
      return Clapperboard;
    case "art-direction":
      return Sparkles;
    case "production":
      return Camera;
    case "finance":
      return Wallet;
    case "quality":
      return Gauge;
    case "hr":
      return UserCheck;
    case "operations":
      return Workflow;
    case "social-media":
      return Megaphone;
    case "media-buying":
      return Megaphone;
    case "customer-support":
      return Headphones;
    case "system":
      return Settings;
    default:
      return Building2;
  }
}

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  // Modals state
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Department Members Detail Modal
  const [viewingDeptMembers, setViewingDeptMembers] = useState<Department | null>(null);

  // Form State for Create User with Strict Dynamic Synchronization
  const [createRole, setCreateRole] = useState<Role>("sales");
  const [createDeptId, setCreateDeptId] = useState<number | string>("");

  // Form State for Edit User with Strict Dynamic Synchronization
  const [editRole, setEditRole] = useState<Role>("sales");
  const [editDeptId, setEditDeptId] = useState<number | string>("");

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
      // API error or demo mode fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // When opening Create User Modal, initialize role and department safely
  function handleOpenCreateUser(initialDeptId?: number) {
    if (initialDeptId) {
      const targetDept = departments.find((d) => d.id === initialDeptId);
      if (targetDept) {
        setCreateDeptId(initialDeptId);
        // Find matching role for this department
        const matchingRole = allRolesList.find((r) => r.compatibleDeptSlugs.includes(targetDept.slug));
        if (matchingRole) {
          setCreateRole(matchingRole.value);
        }
      }
    } else {
      const defaultRole: Role = "sales";
      setCreateRole(defaultRole);
      const defDept = getDefaultDepartment(defaultRole, departments);
      setCreateDeptId(defDept ? defDept.id : "");
    }
    setCreateUserOpen(true);
  }

  // Handle Role Change in Create User modal
  function handleCreateRoleChange(newRole: Role) {
    setCreateRole(newRole);
    const compatibleDepts = getCompatibleDepartments(newRole, departments);
    const currentStillValid = compatibleDepts.some((d) => d.id === Number(createDeptId));
    if (!currentStillValid) {
      const defDept = getDefaultDepartment(newRole, departments);
      setCreateDeptId(defDept ? defDept.id : (compatibleDepts[0]?.id ?? ""));
    }
  }

  // Handle Department Change in Create User modal
  function handleCreateDeptChange(newDeptIdStr: string) {
    setCreateDeptId(newDeptIdStr);
    if (!newDeptIdStr) return;
    const targetDept = departments.find((d) => d.id === Number(newDeptIdStr));
    if (targetDept && !isRoleCompatibleWithDept(createRole, targetDept)) {
      const validRole = allRolesList.find((r) => r.compatibleDeptSlugs.includes(targetDept.slug));
      if (validRole) {
        setCreateRole(validRole.value);
      }
    }
  }

  // Open Edit User Modal
  function handleOpenEditUser(u: User) {
    setEditingUser(u);
    setEditRole(u.role);
    setEditDeptId(u.department_id ?? "");
  }

  // Handle Role Change in Edit User modal
  function handleEditRoleChange(newRole: Role) {
    setEditRole(newRole);
    const compatibleDepts = getCompatibleDepartments(newRole, departments);
    const currentStillValid = compatibleDepts.some((d) => d.id === Number(editDeptId));
    if (!currentStillValid) {
      const defDept = getDefaultDepartment(newRole, departments);
      setEditDeptId(defDept ? defDept.id : (compatibleDepts[0]?.id ?? ""));
    }
  }

  // Handle Department Change in Edit User modal
  function handleEditDeptChange(newDeptIdStr: string) {
    setEditDeptId(newDeptIdStr);
    if (!newDeptIdStr) return;
    const targetDept = departments.find((d) => d.id === Number(newDeptIdStr));
    if (targetDept && !isRoleCompatibleWithDept(editRole, targetDept)) {
      const validRole = allRolesList.find((r) => r.compatibleDeptSlugs.includes(targetDept.slug));
      if (validRole) {
        setEditRole(validRole.value);
      }
    }
  }

  // Filter users in the main table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = (u.name + " " + u.email + " " + (u.job_title ?? "")).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (selectedRole !== "all" && u.role !== selectedRole) return false;
      if (selectedDept !== "all" && u.department_id !== Number(selectedDept)) return false;
      return true;
    });
  }, [users, search, selectedRole, selectedDept]);

  // Create User submit
  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const chosenDeptId = createDeptId ? Number(createDeptId) : undefined;

    // Frontend sanity check
    if (chosenDeptId) {
      const dept = departments.find((d) => d.id === chosenDeptId);
      if (dept && !isRoleCompatibleWithDept(createRole, dept)) {
        const allowed = getCompatibleDepartments(createRole, departments).map((d) => d.name).join("، ");
        toast.error(`الدور الوظيفي المحدد لا يتوافق مع قسم (${dept.name}). الأقسام المتوافقة: ${allowed}`);
        return;
      }
    }

    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      role: createRole,
      department_id: chosenDeptId,
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
      // Update department users count locally
      if (res.department_id) {
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === res.department_id
              ? {
                  ...d,
                  users_count: (d.users_count ?? 0) + 1,
                  users: d.users ? [res, ...d.users] : [res],
                }
              : d
          )
        );
      }
      toast.success(`تم إنشاء حساب الموظف ${res.name} بنجاح`);
      setCreateUserOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل إنشاء الحساب");
    }
  }

  // Update User submit
  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;

    const fd = new FormData(e.currentTarget);
    const passwordVal = String(fd.get("password") || "").trim();
    const chosenDeptId = editDeptId ? Number(editDeptId) : null;

    // Frontend sanity check
    if (chosenDeptId) {
      const dept = departments.find((d) => d.id === chosenDeptId);
      if (dept && !isRoleCompatibleWithDept(editRole, dept)) {
        const allowed = getCompatibleDepartments(editRole, departments).map((d) => d.name).join("، ");
        toast.error(`الدور الوظيفي المحدد لا يتوافق مع قسم (${dept.name}). الأقسام المتوافقة: ${allowed}`);
        return;
      }
    }

    const payload: Record<string, any> = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      role: editRole,
      department_id: chosenDeptId,
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
      // Refresh all to keep department counts in sync
      loadAll();
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
      loadAll();
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

  // Compatible departments for Create form
  const createCompatibleDepts = useMemo(() => {
    return getCompatibleDepartments(createRole, departments);
  }, [createRole, departments]);

  // Compatible departments for Edit form
  const editCompatibleDepts = useMemo(() => {
    return getCompatibleDepartments(editRole, departments);
  }, [editRole, departments]);

  // Members for the currently viewed department
  const viewingDeptUsers = useMemo(() => {
    if (!viewingDeptMembers) return [];
    return users.filter((u) => u.department_id === viewingDeptMembers.id);
  }, [viewingDeptMembers, users]);

  return (
    <div className="space-y-6 animate-enter">
      <SectionHeader
        eyebrow="Enterprise Administration"
        title="Teams & User Accounts Command"
        description="إدارة كاملة لهيكل الفرق والأقسام، وصلاحيات وحسابات المستخدمين مع ربط ذكي ودقيق بين الأدوار والأقسام."
        icon={Users}
        action={
          isExecutive && (
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={() => setCreateTeamOpen(true)}>
                <FolderPlus size={14} className="text-[#facc15]" /> + إضافة فريق / قسم جديد
              </SecondaryButton>
              <PrimaryButton onClick={() => handleOpenCreateUser()}>
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
              activeTab === "users" ? "bg-[#facc15] text-black font-black shadow-md shadow-[#facc15]/10" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Users size={14} />
            <span>أعضاء الفريق وحسابات المستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "teams" ? "bg-[#facc15] text-black font-black shadow-md shadow-[#facc15]/10" : "bg-[#1c1c1f] text-zinc-300 hover:text-white"
            }`}
          >
            <Building2 size={14} />
            <span>الفرق والأقسام (Teams & Departments) ({departments.length})</span>
          </button>
        </div>

        <button
          onClick={loadAll}
          title="تحديث البيانات"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-zinc-400 hover:text-white transition hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* TAB 1: USERS & ACCOUNTS */}
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
                className="h-10 w-full rounded-xl border border-white/8 bg-[#1a1a1c] pr-10 pl-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 rounded-xl border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-300 outline-none focus:border-[#facc15]/50"
              >
                <option value="all">كل الصلاحيات والأدوار (All Roles)</option>
                {roleCategories.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {cat.roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 rounded-xl border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-300 outline-none focus:border-[#facc15]/50"
              >
                <option value="all">كل الأقسام والفرق (All Teams)</option>
                {departments.map((d) => {
                  const deptCount = users.filter((u) => u.department_id === d.id).length;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({deptCount} موظف)
                    </option>
                  );
                })}
              </select>

              {(selectedRole !== "all" || selectedDept !== "all" || search) && (
                <button
                  onClick={() => {
                    setSelectedRole("all");
                    setSelectedDept("all");
                    setSearch("");
                  }}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-[#1e1e22] px-3 text-xs text-zinc-400 hover:text-white transition"
                >
                  <X size={12} /> إعادة ضبط
                </button>
              )}
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
                    const roleInfo = getRoleInfo(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition">
                        {/* User Identity */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" />
                            <div>
                              <strong className="block text-white font-bold">{u.name}</strong>
                              <span className="text-[10px] text-zinc-400 block font-mono">{u.email}</span>
                              {u.phone && <span className="text-[9px] text-zinc-500 block">{u.phone}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Role & Title */}
                        <td className="py-3.5">
                          <span className="rounded-full bg-[#facc15]/10 border border-[#facc15]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#facc15] inline-block">
                            {roleInfo?.label || u.role.replaceAll("_", " ")}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-1 block">{u.job_title || roleInfo?.enLabel || "Team Member"}</span>
                        </td>

                        {/* Team / Department */}
                        <td className="py-3.5 text-zinc-300">
                          {u.department ? (
                            <button
                              type="button"
                              onClick={() => {
                                const deptObj = departments.find((d) => d.id === u.department_id) || u.department;
                                if (deptObj) setViewingDeptMembers(deptObj);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 bg-white/5 border border-white/5 hover:border-[#facc15]/40 hover:bg-[#facc15]/10 hover:text-[#facc15] transition"
                            >
                              <Building2 size={13} className="text-[#facc15]" />
                              <span>{u.department.name}</span>
                            </button>
                          ) : (
                            <span className="text-zinc-500">— بدون قسم —</span>
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
                              onClick={() => handleOpenEditUser(u)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1e1e22] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:text-[#facc15] transition"
                            >
                              <UserCog size={13} /> تحرير الحساب
                            </button>

                            {isExecutive && u.id !== user?.id && (
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

      {/* TAB 2: TEAMS & DEPARTMENTS (CLICKABLE & INTERACTIVE CARDS) */}
      {activeTab === "teams" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept) => {
              const DeptIcon = getDeptIcon(dept.slug, dept.icon);
              const deptUsers = users.filter((u) => u.department_id === dept.id);
              const count = deptUsers.length;

              return (
                <div
                  key={dept.id}
                  onClick={() => setViewingDeptMembers(dept)}
                  className="group panel bg-[#141415] border border-white/7 hover:border-[#facc15]/40 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#facc15]/5"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#facc15]/15 text-[#facc15] font-black group-hover:bg-[#facc15] group-hover:text-black transition-colors duration-200">
                        <DeptIcon size={22} />
                      </span>
                      <span className="rounded-full bg-[#facc15]/15 border border-[#facc15]/30 group-hover:bg-[#facc15] group-hover:text-black px-2.5 py-0.5 text-[10px] font-black text-[#facc15] transition-colors">
                        {count} {count === 1 ? "عضو" : count === 2 ? "عضوان" : count > 2 && count < 11 ? "أعضاء" : "عضو"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#facc15] transition-colors">
                      {dept.name}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">slug: {dept.slug}</span>
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {dept.description || "فريق وقسم تشغيلي معتمد في الهيكل الإداري للوكالة."}
                    </p>

                    {/* Member Avatars Stack */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center -space-x-2 space-x-reverse overflow-hidden">
                        {deptUsers.slice(0, 4).map((u) => (
                          <div
                            key={u.id}
                            title={`${u.name} - ${getRoleLabel(u.role)}`}
                            className="inline-block ring-2 ring-[#141415] rounded-full overflow-hidden"
                          >
                            <Avatar name={u.name} size="xs" />
                          </div>
                        ))}
                        {count > 4 && (
                          <div className="grid h-6 w-6 place-items-center rounded-full bg-[#242428] text-[9px] font-bold text-zinc-300 ring-2 ring-[#141415]">
                            +{count - 4}
                          </div>
                        )}
                        {count === 0 && (
                          <span className="text-[10px] text-zinc-500">لا يوجد أعضاء حالياً</span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        استعراض <ArrowRight size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => setViewingDeptMembers(dept)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-[#facc15] transition"
                    >
                      <Users size={13} /> عرض الأعضاء
                    </button>

                    <div className="flex items-center gap-2">
                      {isExecutive && (
                        <button
                          type="button"
                          onClick={() => handleOpenCreateUser(dept.id)}
                          title="إضافة موظف لهذا القسم"
                          className="text-[#facc15] hover:text-[#fde047] text-xs font-bold transition"
                        >
                          + إضافة عضو
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingDept(dept)}
                        title="تعديل الفريق"
                        className="text-zinc-400 hover:text-white text-xs font-bold transition"
                      >
                        <Edit size={13} />
                      </button>

                      {isExecutive && (
                        <button
                          type="button"
                          onClick={() => setDeptToDelete(dept)}
                          title="حذف الفريق"
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: DEPARTMENT MEMBERS DETAIL VIEW */}
      {viewingDeptMembers && (
        <Modal
          open={!!viewingDeptMembers}
          onClose={() => setViewingDeptMembers(null)}
          title={
            <div className="flex items-center gap-2">
              <Building2 className="text-[#facc15]" size={18} />
              <span>أعضاء فريق: {viewingDeptMembers.name}</span>
            </div>
          }
          subtitle={`slug: ${viewingDeptMembers.slug} • إجمالي الأعضاء: ${viewingDeptUsers.length} موظف`}
          width="max-w-3xl"
        >
          <div className="space-y-4 text-right">
            {viewingDeptMembers.description && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 text-xs text-zinc-300">
                {viewingDeptMembers.description}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                قائمة الموظفين في هذا القسم ({viewingDeptUsers.length})
              </h4>
              {isExecutive && (
                <button
                  type="button"
                  onClick={() => {
                    const deptId = viewingDeptMembers.id;
                    setViewingDeptMembers(null);
                    handleOpenCreateUser(deptId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#facc15] px-3 py-1.5 text-xs font-black text-black hover:bg-[#fde047] transition shadow-md shadow-[#facc15]/10"
                >
                  <UserPlus size={13} /> + إضافة موظف لهذا القسم
                </button>
              )}
            </div>

            {viewingDeptUsers.length > 0 ? (
              <div className="divide-y divide-white/5 border border-white/8 rounded-2xl bg-[#141416] overflow-hidden">
                {viewingDeptUsers.map((u) => {
                  const isSuspended = u.is_active === false;
                  const roleInfo = getRoleInfo(u.role);
                  return (
                    <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <strong className="block text-white text-xs font-bold">{u.name}</strong>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-400 font-mono">{u.email}</span>
                            {u.phone && <span className="text-[10px] text-zinc-500">• {u.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="rounded-full bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 text-[9px] font-bold text-[#facc15] inline-block">
                            {roleInfo?.label || u.role}
                          </span>
                          <span
                            className={`rounded-full ml-1.5 px-2 py-0.5 text-[9px] font-black ${
                              isSuspended
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isSuspended ? "موقوف" : "نشط"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingDeptMembers(null);
                            handleOpenEditUser(u);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e22] px-2.5 text-xs font-bold text-zinc-200 hover:text-[#facc15] hover:bg-white/10 transition"
                        >
                          <UserCog size={12} /> تحرير
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center rounded-2xl border border-white/8 bg-[#141416] p-6 space-y-3">
                <Users className="mx-auto text-zinc-600" size={32} />
                <p className="text-xs text-zinc-400">لا يوجد موظفون معينون في هذا القسم حالياً.</p>
                {isExecutive && (
                  <button
                    type="button"
                    onClick={() => {
                      const deptId = viewingDeptMembers.id;
                      setViewingDeptMembers(null);
                      handleOpenCreateUser(deptId);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#facc15] px-4 py-2 text-xs font-black text-black hover:bg-[#fde047] transition"
                  >
                    <UserPlus size={14} /> إضافة أول موظف لهذا القسم
                  </button>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => {
                  const deptIdStr = String(viewingDeptMembers.id);
                  setViewingDeptMembers(null);
                  setActiveTab("users");
                  setSelectedDept(deptIdStr);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#facc15] hover:underline"
              >
                <ExternalLink size={13} /> عرض وتصفية في جدول الموظفين الكامل
              </button>

              <SecondaryButton onClick={() => setViewingDeptMembers(null)}>
                إغلاق
              </SecondaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CREATE USER (STRICT ROLE & DEPARTMENT SYNCHRONIZATION) */}
      <Modal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        title="إضافة موظف جديد إلى الوكالة"
        subtitle="حدد الدور والصلاحيات وسيتم ربطه تلقائياً بالأقسام المتوافقة فقط"
        width="max-w-2xl"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col text-right">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم الكامل">
                <input name="name" required placeholder="مثال: يوسف إبراهيم" className={inputClass} />
              </Field>
              <Field label="البريد الإلكتروني المهني">
                <input name="email" type="email" required placeholder="youssef@agency.local" className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="كلمة المرور">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  className={inputClass}
                />
              </Field>

              <Field label="المسمى الوظيفي (Job Title)">
                <input name="job_title" placeholder="Senior Creative Specialist" className={inputClass} />
              </Field>
            </div>

            {/* Smart Linked Role & Department */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-[#facc15]/20 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#facc15]" />
                <strong className="text-xs text-white">تحديد الصلاحية والدور مع القسم المتوافق</strong>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الدور والصلاحية (Role)">
                  <select
                    name="role"
                    value={createRole}
                    onChange={(e) => handleCreateRoleChange(e.target.value as Role)}
                    className={inputClass}
                    required
                  >
                    {roleCategories.map((cat) => (
                      <optgroup key={cat.key} label={cat.label}>
                        {cat.roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="الفريق / القسم (Department)">
                  <select
                    name="department_id"
                    value={createDeptId}
                    onChange={(e) => handleCreateDeptChange(e.target.value)}
                    className={inputClass}
                  >
                    {createCompatibleDepts.length === 0 ? (
                      <option value="">-- بدون قسم محدد --</option>
                    ) : (
                      createCompatibleDepts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.slug})
                        </option>
                      ))
                    )}
                  </select>
                </Field>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-3 py-2 rounded-xl">
                <Info size={14} className="shrink-0" />
                <span>
                  الأقسام المتوافقة مع صلاحية ({getRoleLabel(createRole)}):{" "}
                  <strong>{createCompatibleDepts.map((d) => d.name).join("، ") || "بدون قسم"}</strong>
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="رقم الهاتف">
                <input name="phone" placeholder="+20 100 000 0000" className={inputClass} />
              </Field>
              <Field label="التارجت الشهري ($ / EGP)">
                <input name="target" type="number" defaultValue={0} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نسبة العمولة % (للمبيعات)">
                <input
                  name="commission_percentage"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={10}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* Sticky Form Footer */}
          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
            <SecondaryButton type="button" onClick={() => setCreateUserOpen(false)}>
              إلغاء
            </SecondaryButton>
            <PrimaryButton>
              <UserPlus size={14} /> إنشاء الحساب
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* MODAL: GRANULAR USER EDIT (STRICT ROLE & DEPARTMENT SYNCHRONIZATION) */}
      {editingUser && (
        <Modal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`التحكم الكامل في حساب: ${editingUser.name}`}
          subtitle={`معرّف الموظف: #${editingUser.id} • ${editingUser.email}`}
          width="max-w-2xl"
        >
          <form onSubmit={handleUpdateUser} className="flex flex-col text-right">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الاسم الكامل">
                  <input name="name" required defaultValue={editingUser.name} className={inputClass} />
                </Field>
                <Field label="البريد الإلكتروني">
                  <input name="email" type="email" required defaultValue={editingUser.email} className={inputClass} />
                </Field>
              </div>

              {/* Linked Role & Department Box */}
              <div className="p-4 rounded-2xl bg-[#141416] border border-[#facc15]/20 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#facc15]" />
                  <strong className="text-xs text-white">تعديل الصلاحية والقسم المتوافق</strong>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="الدور والصلاحية (Role)">
                    <select
                      name="role"
                      value={editRole}
                      onChange={(e) => handleEditRoleChange(e.target.value as Role)}
                      className={inputClass}
                      required
                    >
                      {roleCategories.map((cat) => (
                        <optgroup key={cat.key} label={cat.label}>
                          {cat.roles.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </Field>

                  <Field label="الفريق / القسم">
                    <select
                      name="department_id"
                      value={editDeptId}
                      onChange={(e) => handleEditDeptChange(e.target.value)}
                      className={inputClass}
                    >
                      {editCompatibleDepts.length === 0 ? (
                        <option value="">-- بدون قسم محدد --</option>
                      ) : (
                        editCompatibleDepts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.slug})
                          </option>
                        ))
                      )}
                    </select>
                  </Field>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-3 py-2 rounded-xl">
                  <Info size={14} className="shrink-0" />
                  <span>
                    الأقسام المتوافقة مع ({getRoleLabel(editRole)}):{" "}
                    <strong>{editCompatibleDepts.map((d) => d.name).join("، ") || "بدون قسم"}</strong>
                  </span>
                </div>
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
            </div>

            {/* Sticky Form Footer */}
            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 p-4 bg-[#161618]/95 backdrop-blur-md border-t border-white/7 flex justify-end gap-2 shrink-0 z-10">
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
