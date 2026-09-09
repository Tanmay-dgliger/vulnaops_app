"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Edit3, Trash2, UserRound } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { UserAccount } from "@/types/user-account";
import Modal from "@/components/common/Modal";
import { initials, ownerColor } from "@/lib/business/format";

const ROLE_OPTIONS = ["Administrator", "Security Analyst", "Application Owner", "Viewer"];

interface FormState {
  username: string;
  email: string;
  role: string;
}

const EMPTY_FORM: FormState = { username: "", email: "", role: ROLE_OPTIONS[0] };

const ROLE_CFG: Record<string, { bg: string; text: string }> = {
  Administrator: { bg: "#EFF6FF", text: "#2563EB" },
  "Security Analyst": { bg: "#F5F3FF", text: "#7C3AED" },
  "Application Owner": { bg: "#FFF7ED", text: "#C2410C" },
  Viewer: { bg: "#F8FAFC", text: "#64748B" },
};

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_CFG[role] ?? { bg: "#F8FAFC", text: "#64748B" };
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: c.bg, color: c.text }}>
      {role}
    </span>
  );
}

export default function UserManagement() {
  const { userAccounts, addUserAccount, updateUserAccount, deleteUserAccount } = useData();
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return userAccounts;
    return userAccounts.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [userAccounts, search]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditingUsername(null);
    setModalMode("add");
  };

  const openEdit = (user: UserAccount) => {
    setForm({ username: user.username, email: user.email, role: user.role });
    setFormError("");
    setEditingUsername(user.username);
    setModalMode("edit");
  };

  const closeModal = () => setModalMode(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setFormError("Username and email are required.");
      return;
    }
    const ok =
      modalMode === "add"
        ? addUserAccount({ username: form.username.trim(), email: form.email.trim(), role: form.role })
        : updateUserAccount(editingUsername ?? "", { username: form.username.trim(), email: form.email.trim(), role: form.role });
    if (ok) {
      closeModal();
    } else {
      setFormError(`Username "${form.username.trim()}" already exists.`);
    }
  };

  const handleDelete = (user: UserAccount) => {
    if (window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      deleteUserAccount(user.username);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <Link href="/administration" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={13} /> Back to Administration
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage the demo accounts that can sign in to HawkEye</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} users</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
              {["Username", "Email", "Role", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <tr key={user.username} className="transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0" style={{ width: 22, height: 22, background: ownerColor(user.username) }}>
                      {initials(user.username)}
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-900">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-600">{user.email}</span>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(user)}
                      className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-100"
                      style={{ width: 28, height: 28, color: "#64748B" }}
                      aria-label={`Edit ${user.username}`}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="flex items-center justify-center rounded-md transition-colors hover:bg-red-50"
                      style={{ width: 28, height: 28, color: "#DC2626" }}
                      aria-label={`Delete ${user.username}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <UserRound size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No users match your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <Modal title={modalMode === "add" ? "Add User" : "Edit User"} subtitle="Demo account — session state only" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Username</label>
              <input
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" }}
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Email</label>
              <input
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" }}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Role</label>
              <select
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" }}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                {formError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
              >
                {modalMode === "add" ? "Add User" : "Save Changes"}
              </button>
              <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="h-4" />
    </div>
  );
}
