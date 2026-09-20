"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  suspendAdminUser,
  adjustUserPoints,
  getAdminProfile,
} from "@/lib/adminApi";
import type { AdminUser } from "@/lib/adminTypes";
import PinVerificationModal from "@/components/PinVerificationModal";

type Filter = "all" | "active" | "suspended";
type Toast = { msg: string; type: "success" | "error" };

// ── Edit user modal ──────────────────────────────────────────────────────────
function EditModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (u: AdminUser) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminHasPin, setAdminHasPin] = useState(false);

  useEffect(() => {
    getAdminProfile().then(p => setAdminHasPin(!!p.hasPin)).catch(() => {});
  }, []);

  async function handleSave() {
    if (!form.fullName.trim()) return;
    if (adminHasPin) {
      setShowPinModal(true);
      return;
    }
    await performSave();
  }

  async function performSave() {
    setSaving(true);
    setError("");
    try {
      await updateAdminUser(user.id, form);
      onSave({ ...user, ...form });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.users.editFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-primary p-5">
          <h3 className="font-bold text-white text-lg">{t("admin.users.editTitle")}</h3>
          <p className="text-white/80 text-xs mt-0.5">{user.email}</p>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: t("admin.users.editFullName"), key: "fullName", type: "text", placeholder: t("admin.users.editFullName") },
            { label: t("admin.users.editPhone"), key: "phone", type: "tel", placeholder: "08..." },
            { label: t("admin.users.editAddress"), key: "address", type: "text", placeholder: t("admin.users.editAddress") },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          ))}
          {error && <p className="text-xs text-error font-medium">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
            >
              {t("admin.users.editCancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!form.fullName.trim() || saving}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />}
              {saving ? t("admin.users.editSaving") : t("admin.users.editSave")}
            </button>
          </div>
        </div>
      </div>
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          performSave();
        }}
        isAdmin={true}
      />
    </div>
  );
}

// ── Adjust points modal ───────────────────────────────────────────────────────
function PointsModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (newPoints: number) => void;
}) {
  const { t } = useTranslation();
  const [points, setPoints] = useState(0);
  const [action, setAction] = useState<"add" | "subtract">("add");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (points <= 0) return;
    setSaving(true);
    setError("");
    try {
      await adjustUserPoints(user.id, points, action, description);
      const newTotal = action === "add" ? user.points + points : user.points - points;
      onSave(newTotal);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.users.adjustFailed"));
    } finally {
      setSaving(false);
    }
  }

  const preview = action === "add" ? user.points + points : user.points - points;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-secondary p-5">
          <h3 className="font-bold text-on-secondary text-lg">{t("admin.users.adjustPointsTitle")}</h3>
          <p className="text-on-secondary/80 text-xs mt-0.5">{user.fullName} · {user.points.toLocaleString("id-ID")} pts</p>
        </div>
        <div className="p-6 space-y-4">

          {/* Action toggle */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">{t("admin.users.adjustActionLabel")}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAction("add")}
                className={`py-2.5 rounded-xl font-button text-sm flex items-center justify-center gap-1.5 border transition-colors ${
                  action === "add"
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline text-on-surface hover:bg-surface-variant"
                }`}
              >
                <Icon name="add_circle" style={{ fontSize: 16 }} />
                {t("admin.users.adjustActionAdd")}
              </button>
              <button
                type="button"
                onClick={() => setAction("subtract")}
                className={`py-2.5 rounded-xl font-button text-sm flex items-center justify-center gap-1.5 border transition-colors ${
                  action === "subtract"
                    ? "bg-error text-on-error border-error"
                    : "border-outline text-on-surface hover:bg-surface-variant"
                }`}
              >
                <Icon name="remove_circle" style={{ fontSize: 16 }} />
                {t("admin.users.adjustActionSubtract")}
              </button>
            </div>
          </div>

          {/* Points amount */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">{t("admin.users.adjustPointsLabel")}</label>
            <input
              type="number"
              min={1}
              value={points === 0 ? "" : points}
              onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">{t("admin.users.adjustDescLabel")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.users.adjustDescPlaceholder")}
              className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>

          {points > 0 && (
            <div className={`flex items-center justify-between p-3 rounded-xl ${preview < 0 ? "bg-error-container/30" : "bg-primary-container/20"}`}>
              <span className="text-xs font-bold text-outline uppercase">{t("admin.users.adjustPreview")}</span>
              <span className={`font-bold text-lg ${preview < 0 ? "text-error" : "text-primary"}`}>
                {preview.toLocaleString("id-ID")} pts
              </span>
            </div>
          )}

          {error && <p className="text-xs text-error font-medium">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
            >
              {t("admin.users.editCancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={points <= 0 || saving}
              className="flex-1 py-3 bg-secondary text-on-secondary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />}
              {saving ? t("admin.users.editSaving") : t("admin.users.adjustApply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create user modal ────────────────────────────────────────────────────────
const BLANK_CREATE = { fullName: "", email: "", phone: "", address: "", password: "", role: "user" as "admin" | "user" };

function CreateModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (u: AdminUser) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(BLANK_CREATE);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof BLANK_CREATE, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const valid =
    form.fullName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.address.trim() &&
    form.password.length >= 6;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      const created = await createAdminUser(form);
      onSave(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.users.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="bg-primary p-5 shrink-0">
          <h3 className="font-bold text-white text-lg">{t("admin.users.createTitle")}</h3>
          <p className="text-white/80 text-xs mt-0.5">{t("admin.users.createSubtitle")}</p>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          {[
            { label: t("admin.users.createFullName"), key: "fullName", type: "text", placeholder: t("admin.users.createFullName") },
            { label: t("admin.users.createEmail"), key: "email", type: "email", placeholder: "email@example.com" },
            { label: t("admin.users.createPhone"), key: "phone", type: "tel", placeholder: "08..." },
            { label: t("admin.users.createAddress"), key: "address", type: "text", placeholder: t("admin.users.createAddress") },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof BLANK_CREATE]}
                onChange={(e) => set(key as keyof typeof BLANK_CREATE, e.target.value)}
                placeholder={placeholder}
                className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">{t("admin.users.createPasswordLabel")}</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={t("admin.users.createPasswordHint")}
                className="w-full p-3 pr-10 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <Icon name={showPw ? "visibility_off" : "visibility"} style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">{t("admin.users.createRoleLabel")}</label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.role === r
                      ? "border-primary bg-primary-container text-on-primary-container"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {r === "user" ? t("admin.users.roleUser") : t("admin.users.roleAdmin")}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
            >
              {t("admin.users.editCancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />}
              {saving ? t("admin.users.editSaving") : t("admin.users.createSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<Toast | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [pointsUser, setPointsUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string, type: Toast["type"] = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSuspend(user: AdminUser) {
    setSuspending(user.id);
    try {
      await suspendAdminUser(user.id);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u),
      );
      showToast(user.isActive ? `${user.fullName} ditangguhkan` : `${user.fullName} diaktifkan kembali`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memperbarui status", "error");
    } finally {
      setSuspending(null);
    }
  }

  const filtered = users.filter((u) => {
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? u.isActive :
      !u.isActive;
    const matchSearch = !search.trim() ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `${t("admin.users.filterAll")} (${users.length})` },
    { key: "active", label: `${t("admin.users.filterActive")} (${activeCount})` },
    { key: "suspended", label: `${t("admin.users.filterSuspended")} (${suspendedCount})` },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">{t("admin.users.title")}</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant hidden md:block">
            {t("admin.users.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-button text-sm shadow hover:brightness-95 active:scale-95 transition-all"
        >
          <Icon name="person_add" style={{ fontSize: 18 }} />
          <span className="hidden sm:inline">{t("admin.users.addUser")}</span>
        </button>
      </header>

      <div className="flex-1 px-4 md:px-10 py-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total", value: users.length, icon: "group", color: "text-primary" },
            { label: "Aktif", value: activeCount, icon: "check_circle", color: "text-[#0f5132]" },
            { label: "Ditangguhkan", value: suspendedCount, icon: "block", color: "text-error" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-3">
              <Icon name={s.icon} fill className={`${s.color} shrink-0`} style={{ fontSize: 20 }} />
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wide leading-none">{s.label}</p>
                <p className="text-xl font-bold text-on-surface">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 18 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.users.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile cards */}
        {!loading && (
          <div className="md:hidden space-y-3 mb-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Icon name="group" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                <p>{t("admin.users.noUsers")}</p>
              </div>
            ) : filtered.map((user) => (
              <div key={user.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="text-on-primary-container font-bold text-sm">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{user.fullName}</p>
                      <p className="text-xs text-outline truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5 ${
                      user.role === "admin"
                        ? "bg-primary-container/40 text-primary"
                        : "bg-surface-variant text-on-surface-variant"
                    }`}>
                      <Icon name={user.role === "admin" ? "admin_panel_settings" : "person"} fill style={{ fontSize: 10 }} />
                      {user.role === "admin" ? t("admin.users.roleAdmin") : t("admin.users.roleUser")}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.isActive
                        ? "bg-[#d1e7dd] text-[#0f5132]"
                        : "bg-error-container/30 text-error"
                    }`}>
                      {user.isActive ? t("admin.users.statusActive") : t("admin.users.statusSuspended")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-outline font-bold uppercase tracking-wide text-[10px]">{t("admin.users.tablePhone")}</p>
                    <p className="text-on-surface">{user.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-outline font-bold uppercase tracking-wide text-[10px]">{t("admin.users.tablePoints")}</p>
                    <p className="text-primary font-bold">{user.points.toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEditUser(user)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant transition-colors"
                  >
                    <Icon name="edit" style={{ fontSize: 14 }} /> Edit
                  </button>
                  {user.role !== "admin" && (
                    <button
                      onClick={() => setPointsUser(user)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold hover:brightness-95 transition-colors"
                    >
                      <Icon name="toll" style={{ fontSize: 14 }} /> Poin
                    </button>
                  )}
                  <button
                    onClick={() => handleSuspend(user)}
                    disabled={suspending === user.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 ${
                      user.isActive
                        ? "text-error hover:bg-error-container"
                        : "text-[#0f5132] hover:bg-[#d1e7dd]"
                    }`}
                  >
                    <Icon name={user.isActive ? "block" : "check_circle"} style={{ fontSize: 14 }} />
                    {suspending === user.id ? "..." : user.isActive ? t("admin.users.suspend") : t("admin.users.activate")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {[
                    { key: "User", label: t("admin.users.tableName") },
                    { key: "Kontak", label: t("admin.users.tablePhone") },
                    { key: "Role", label: t("admin.users.tableRole") },
                    { key: "Poin", label: t("admin.users.tablePoints") },
                    { key: "Status", label: t("admin.users.tableStatus") },
                    { key: "Aksi", label: t("admin.users.tableActions") },
                  ].map(({ key, label }) => (
                    <th key={key} className={`px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wide ${key === "Aksi" ? "text-right" : ""}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                      {t("admin.users.loading")}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                      <Icon name="group" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                      <p>{t("admin.users.noUsers")}</p>
                    </td>
                  </tr>
                ) : filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="text-on-primary-container font-bold text-sm">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{user.fullName}</p>
                          <p className="text-xs text-outline">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-on-surface">{user.phone || "—"}</p>
                      <p className="text-xs text-outline truncate max-w-[180px]">{user.address || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-primary-container/40 text-primary"
                          : "bg-surface-variant text-on-surface-variant"
                      }`}>
                        <Icon name={user.role === "admin" ? "admin_panel_settings" : "person"} fill style={{ fontSize: 12 }} />
                        {user.role === "admin" ? t("admin.users.roleAdmin") : t("admin.users.roleUser")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-primary">{user.points.toLocaleString("id-ID")}</span>
                      <span className="text-xs text-outline ml-1">pts</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.isActive
                          ? "bg-[#d1e7dd] text-[#0f5132]"
                          : "bg-error-container/30 text-error"
                      }`}>
                        <Icon name={user.isActive ? "check_circle" : "block"} fill style={{ fontSize: 12 }} />
                        {user.isActive ? t("admin.users.statusActive") : t("admin.users.statusSuspended")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-2 rounded-lg hover:bg-surface-variant transition-colors"
                          title="Edit data user"
                        >
                          <Icon name="edit" style={{ fontSize: 16 }} className="text-on-surface-variant" />
                        </button>
                        {user.role !== "admin" && (
                          <button
                            onClick={() => setPointsUser(user)}
                            className="p-2 rounded-lg hover:bg-secondary-container transition-colors"
                            title="Sesuaikan poin"
                          >
                            <Icon name="toll" style={{ fontSize: 16 }} className="text-secondary" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSuspend(user)}
                          disabled={suspending === user.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 ${
                            user.isActive
                              ? "text-error hover:bg-error-container"
                              : "text-[#0f5132] hover:bg-[#d1e7dd]"
                          }`}
                        >
                          <Icon name={user.isActive ? "block" : "check_circle"} style={{ fontSize: 14 }} />
                          {suspending === user.id ? "..." : user.isActive ? t("admin.users.suspend") : t("admin.users.activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-6 py-4 bg-surface-container-low">
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                Menampilkan {filtered.length} dari {users.length} user
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSave={(created) => {
            setUsers((prev) => [created, ...prev]);
            setShowCreate(false);
            showToast(`User ${created.fullName} berhasil dibuat`);
          }}
        />
      )}

      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
            setEditUser(null);
            showToast("Data user berhasil diperbarui");
          }}
        />
      )}

      {pointsUser && (
        <PointsModal
          user={pointsUser}
          onClose={() => setPointsUser(null)}
          onSave={(newPoints) => {
            setUsers((prev) =>
              prev.map((u) => u.id === pointsUser.id ? { ...u, points: newPoints } : u),
            );
            setPointsUser(null);
            showToast("Poin berhasil disesuaikan");
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <div className={`${toast.type === "error" ? "bg-error-container border border-error/20" : "bg-on-background"} rounded-xl px-5 py-4 shadow-xl flex items-center gap-3`}>
            <Icon
              name={toast.type === "error" ? "error" : "check_circle"}
              fill
              className={toast.type === "error" ? "text-error" : "text-primary-fixed"}
            />
            <p className={`text-sm font-medium ${toast.type === "error" ? "text-error" : "text-surface"}`}>
              {toast.msg}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
