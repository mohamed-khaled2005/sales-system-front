"use client";

import { TaskDrawer } from "@/components/task-drawer";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { mockClients, mockTasks } from "@/lib/mock-data";
import type { Paginated, Task } from "@/lib/types";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCode,
  FileImage,
  FileText,
  Filter,
  Folder,
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selected, setSelected] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedAdd, setShowDetailedAdd] = useState(false);

  // Quick project input state
  const [projectName, setProjectName] = useState("");
  const [copywriting, setCopywriting] = useState("");
  const [textInVisual, setTextInVisual] = useState("");
  const [references, setReferences] = useState("");
  const [selectedClient, setSelectedClient] = useState("Acme Corp");

  async function load() {
    setRefreshing(true);
    try {
      const res = await api<Paginated<Task>>("/tasks?per_page=100");
      if (res?.data) setTasks(res.data);
    } catch {
      setTasks(mockTasks);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleCreateQuickProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error("يرجى كتابة اسم المشروع");
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: projectName,
      department: "design",
      type: "design_project",
      status: "in_progress",
      priority: "high",
      client: {
        id: 1,
        name: selectedClient,
        primary_color: "#facc15",
        secondary_color: "#111",
        status: "active",
        health_score: 90,
      },
      objective: copywriting || "تنفيذ المشروع حسب المتطلبات المرفقة.",
      deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setProjectName("");
    setCopywriting("");
    setTextInVisual("");
    setReferences("");
    toast.success("تم إنشاء المشروع بنجاح");
  }

  const updateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  // Grouped task categories matching Screenshots 3 & 4
  const accountManagerTasks = useMemo(() => {
    return tasks
      .filter((t) => ["waiting_review", "need_revision"].includes(t.status) || t.priority === "urgent")
      .slice(0, 4);
  }, [tasks]);

  const activeTasks = useMemo(() => {
    return tasks
      .filter((t) => ["in_progress", "draft", "brief_ready"].includes(t.status))
      .slice(0, 6);
  }, [tasks]);

  const submittedTasks = useMemo(() => {
    return tasks
      .filter((t) => ["waiting_review", "account_review", "client_review"].includes(t.status))
      .slice(0, 4);
  }, [tasks]);

  const approvedTasks = useMemo(() => {
    return tasks
      .filter((t) => ["art_approved", "client_approved", "published", "done"].includes(t.status))
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header matching Screenshot 3 & 4 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 w-full rounded-xl border border-white/8 bg-[#161618] pr-10 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1c] px-3 text-xs font-medium text-zinc-300 hover:bg-white/5 transition">
            <Filter size={13} className="text-[#facc15]" />
            <span>Filter</span>
          </button>

          <button
            onClick={load}
            title="Refresh"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            title="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
          >
            <Bell size={14} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#1a1a1c]" />
          </button>

          <button
            title="Settings"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#1a1a1c] text-zinc-300 hover:bg-white/5 transition"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Account Manager Tasks (Screenshot 4) */}
      {accountManagerTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400">Account Manager Tasks</h2>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {accountManagerTasks.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                className="group cursor-pointer rounded-2xl border border-white/7 bg-[#161618] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1a1a1d]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-[#facc15] transition">
                    <Folder size={16} />
                  </div>
                  <span className="rounded-full bg-[#facc15] px-2.5 py-0.5 text-[9px] font-black text-black">
                    From AM
                  </span>
                </div>

                <strong className="block text-sm font-bold text-white truncate">{t.title}</strong>
                <p className="mt-1 text-[11px] text-zinc-400 truncate">
                  {t.objective || `Review ${t.client?.name ?? "client"} comments`}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-zinc-500">
                  <span>{idx % 2 === 0 ? "Today" : "Yesterday"}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      idx % 2 === 0 ? "bg-zinc-600" : "bg-[#facc15]"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects Section (Add Project Form matching Screenshots 3 & 4) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400">Projects</h2>
          <button
            onClick={() => setShowDetailedAdd((v) => !v)}
            className="text-[11px] font-medium text-[#facc15] hover:underline"
          >
            {showDetailedAdd ? "Simple View" : "Advanced Form"}
          </button>
        </div>

        <div className="panel bg-[#141415] border border-white/7 rounded-2xl p-4">
          {!showDetailedAdd ? (
            /* Screenshot 3 style: Single line input */
            <form onSubmit={handleCreateQuickProject} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="+ Enter new project name..."
                  className="h-11 w-full rounded-xl border border-white/8 bg-[#1a1a1c] px-4 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#facc15]/50"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 text-xs font-bold text-black transition hover:bg-[#fde047] active:scale-95"
              >
                <FolderPlus size={15} />
                <span>Add Project</span>
              </button>
            </form>
          ) : (
            /* Screenshot 4 style: Add Content Project multi-fields */
            <form onSubmit={handleCreateQuickProject} className="space-y-4">
              <span className="block text-xs font-bold text-zinc-300">Add Content Project</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <span className="block text-[9px] font-bold tracking-wider text-zinc-500 uppercase mb-1">
                    COPYWRITING
                  </span>
                  <input
                    value={copywriting}
                    onChange={(e) => setCopywriting(e.target.value)}
                    placeholder="Enter content copy..."
                    className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold tracking-wider text-zinc-500 uppercase mb-1">
                    TEXT IN VISUAL
                  </span>
                  <input
                    value={textInVisual}
                    onChange={(e) => setTextInVisual(e.target.value)}
                    placeholder="Text to appear in graphic..."
                    className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold tracking-wider text-zinc-500 uppercase mb-1">
                    REFERENCES
                  </span>
                  <input
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    placeholder="Links or notes..."
                    className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold tracking-wider text-zinc-500 uppercase mb-1">
                    SELECT CLIENT
                  </span>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                  >
                    {mockClients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[9px] font-bold tracking-wider text-zinc-500 uppercase mb-1">
                    PROJECT NAME
                  </span>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="h-9 w-full rounded-lg border border-white/8 bg-[#1a1a1c] px-3 text-xs text-zinc-200 outline-none focus:border-[#facc15]/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#facc15] px-4 text-xs font-bold text-black hover:bg-[#fde047] transition"
                >
                  <Plus size={14} />
                  <span>Add Project</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Active Tasks Section matching Screenshots 3 & 4 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400">Active Tasks</h2>
          <div className="flex items-center gap-1 text-zinc-500">
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronLeft size={14} />
            </button>
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {activeTasks.map((t, idx) => {
            const badges = ["High Priority", "In Progress", "Review", "Pending"];
            const badgeLabel = badges[idx % badges.length];
            const isHigh = badgeLabel === "High Priority";

            return (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                className="group cursor-pointer rounded-2xl border border-white/7 bg-[#161618] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1a1a1d]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-[#facc15] transition">
                    <Folder size={16} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      isHigh
                        ? "bg-[#facc15] text-black font-black"
                        : "bg-[#242428] text-zinc-300 border border-white/10"
                    }`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                <strong className="block text-sm font-bold text-white truncate">{t.title}</strong>
                <p className="mt-1 text-[11px] text-zinc-400 truncate">
                  {t.client?.name ?? "Brand Identity Design"}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-zinc-500">
                  <span>{12 + idx * 2} Oct</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      idx % 2 === 0 ? "bg-[#facc15]" : "bg-zinc-600"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Submitted for Review Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400">Submitted for Review</h2>
          <div className="flex items-center gap-1 text-zinc-500">
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronLeft size={14} />
            </button>
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {submittedTasks.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className="group cursor-pointer rounded-2xl border border-white/7 bg-[#161618] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1a1a1d]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-[#facc15] transition">
                  <Folder size={16} />
                </div>
                <span className="rounded-full bg-[#242428] border border-white/10 px-2.5 py-0.5 text-[9px] font-bold text-zinc-300">
                  Pending Review
                </span>
              </div>

              <strong className="block text-sm font-bold text-white truncate">{t.title}</strong>
              <p className="mt-1 text-[11px] text-zinc-400 truncate">
                {t.client?.name ?? "E-commerce Platform"}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-zinc-500">
                <span>{20 + idx * 2} Oct</span>
                <span className="text-zinc-500">
                  {idx % 2 === 0 ? <FileImage size={14} /> : <FileText size={14} />}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Art Director Approvals Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400">Art Director Approvals</h2>
          <div className="flex items-center gap-1 text-zinc-500">
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronLeft size={14} />
            </button>
            <button className="grid h-6 w-6 place-items-center rounded bg-white/5 hover:bg-white/10 hover:text-white transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {approvedTasks.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className="group cursor-pointer rounded-2xl border border-white/7 bg-[#161618] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1a1a1d]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-[#facc15] transition">
                  <Folder size={16} />
                </div>
                <span className="rounded-full bg-[#facc15] px-2.5 py-0.5 text-[9px] font-black text-black">
                  Approved
                </span>
              </div>

              <strong className="block text-sm font-bold text-white truncate">{t.title}</strong>
              <p className="mt-1 text-[11px] text-zinc-400 truncate">
                {t.client?.name ?? "TechCorp Project"}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-zinc-500">
                <span>{idx === 0 ? "Yesterday" : "2 days ago"}</span>
                <span className="text-[#facc15]">
                  <CheckCircle2 size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Task Drawer */}
      <TaskDrawer task={selected} onClose={() => setSelected(null)} onUpdated={updateTask} />
    </div>
  );
}
