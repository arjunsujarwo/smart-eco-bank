"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import {
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  updateAdminPin,
  deleteAdminPhoto,
  adminLogout
} from "@/lib/adminApi";
import type { AdminProfile, ActivityLog } from "@/lib/adminTypes";
import PinVerificationModal from "@/components/PinVerificationModal";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

export default function AdminProfilePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirmation, setNewPinConfirmation] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const [showPinForPassword, setShowPinForPassword] = useState(false);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await adminLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    router.push("/admin/login");
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const p = await getAdminProfile();
      setName(p.name);
      setEmail(p.email);
      setPhone(p.phone || "");
      setAddress(p.address || "");
      setRole(p.role);
      setPhotoUrl(p.photoUrl || null);
      setHasPin(p.hasPin || false);
      if (p.activityLogs) {
        setActivityLogs(p.activityLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showToastMessage(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminProfile({
        fullName: name,
        phone,
        address,
        photo: photoFile
      });
      showToastMessage(t("admin.profile.profileSaved"));
      fetchProfile(); // refresh image url
    } catch (error: any) {
      showToastMessage(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto() {
    const result = await Swal.fire({
      title: t("admin.profile.deletePhotoTitle"),
      text: t("admin.profile.deletePhotoText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("admin.profile.deletePhotoConfirm"),
      cancelButtonText: t("admin.profile.deletePhotoCancel"),
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAdminPhoto();
      showToastMessage(t("admin.profile.photoDeleted"));
      setPhotoUrl(null);
      setPhotoPreview(null);
      setPhotoFile(null);
      fetchProfile();
    } catch (error: any) {
      showToastMessage(error.message, "error");
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (hasPin) {
      setShowPinForPassword(true);
      return;
    }
    await performSavePassword();
  }

  async function performSavePassword() {
    setSavingPassword(true);
    try {
      await updateAdminPassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation
      });
      showToastMessage(t("admin.profile.passwordUpdated"));
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
    } catch (error: any) {
      showToastMessage(error.message, "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSavePin(e: React.FormEvent) {
    e.preventDefault();
    setSavingPin(true);
    try {
      await updateAdminPin({
        currentPin: currentPin || undefined,
        newPin,
        newPinConfirmation
      });
      showToastMessage(t("admin.profile.pinUpdated"));
      setShowPinModal(false);
      setCurrentPin("");
      setNewPin("");
      setNewPinConfirmation("");
      fetchProfile();
    } catch (error: any) {
      showToastMessage(error.message, "error");
    } finally {
      setSavingPin(false);
    }
  }

  const colorMap = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    tertiary: "bg-tertiary",
  } as const;

  const displayAvatar = photoPreview || photoUrl;

  return (
    <>
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <h1 className="text-headline-md font-headline-md font-bold text-primary">Smart Eco Bank</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm"
        >
          <Icon name="logout" style={{ fontSize: 18 }} />
          <span className="hidden md:inline">{t("admin.profile.logout")}</span>
        </button>
      </header>

      <div className="flex-1 px-4 md:px-10 py-6 md:py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">
              {t("admin.profile.title")}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              {t("admin.profile.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Profile + Security */}
            <div className="lg:col-span-8 space-y-6">
              {/* Profile card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                  <div className="relative group shrink-0">
                    <div
                      className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-surface-container-high border-2 border-primary-container flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="person" fill className="text-outline" style={{ fontSize: 64 }} />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                        <Icon name="photo_camera" className="text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <div className="flex-1">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-7 w-40 bg-surface-container rounded animate-pulse" />
                        <div className="h-4 w-28 bg-surface-container rounded animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-headline-md font-headline-md text-on-surface">{name}</h3>
                        <p className="text-primary text-label-sm font-label-sm uppercase tracking-widest mt-1">
                          {role}
                        </p>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary text-on-primary px-4 py-2 rounded-lg font-button text-sm hover:brightness-95 transition-all"
                      >
                        {t("admin.profile.uploadPhoto")}
                      </button>
                      {displayAvatar && (
                        <button
                          onClick={handleDeletePhoto}
                          className="bg-error-container text-error px-4 py-2 rounded-lg font-button text-sm hover:brightness-95 transition-all"
                        >
                          {t("admin.profile.deletePhoto")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-6 border-t border-outline-variant">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={t("admin.profile.fullName")} value={name} onChange={setName} type="text" />
                    <FormField label={t("admin.profile.email")} value={email} onChange={setEmail} type="email" disabled />
                    <FormField label={t("admin.profile.phone")} value={phone} onChange={setPhone} type="text" />
                    <FormField label={t("admin.profile.position")} value={role} onChange={setRole} type="text" disabled />
                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <label className="text-label-sm font-label-sm text-on-surface-variant">{t("admin.profile.address")}</label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-button hover:brightness-95 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {saving ? (
                        <><Icon name="sync" className="animate-spin" /> {t("admin.profile.saving")}</>
                      ) : (
                        <><Icon name="save" /> {t("admin.profile.saveChanges")}</>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security */}
              <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Icon name="security" className="text-primary" />
                  <h3 className="text-headline-md font-headline-md text-on-surface">{t("admin.profile.security")}</h3>
                </div>
                <div className="space-y-4">
                  {/* Password */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 gap-4 flex-wrap">
                    <div>
                      <h4 className="font-bold text-on-surface">{t("admin.profile.password")}</h4>
                      <p className="text-on-surface-variant text-sm">{t("admin.profile.passwordDesc")}</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="border border-primary text-primary px-4 py-2 rounded-lg font-button text-sm hover:bg-primary/5 transition-all shrink-0"
                    >
                      {t("admin.profile.changePassword")}
                    </button>
                  </div>
                  {/* 2FA / PIN */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="dialpad" className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{t("admin.profile.pin")}</h4>
                        <p className="text-on-surface-variant text-sm">
                          {t("admin.profile.pinDesc")}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${hasPin ? 'bg-primary' : 'bg-error'}`} />
                          <span className={`${hasPin ? 'text-primary' : 'text-error'} font-bold text-xs uppercase`}>
                            {hasPin ? t("admin.profile.pinActive") : t("admin.profile.pinNotSet")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPinModal(true)}
                      className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-button text-sm hover:brightness-95 transition-all shrink-0"
                    >
                      {t("admin.profile.pinSettings")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Icon name="language" className="text-primary" />
                  <h3 className="text-headline-md font-headline-md text-on-surface">{t("admin.profile.language")}</h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-on-surface">{i18n.language === "id" ? "Indonesia" : "English"}</h4>
                    <p className="text-on-surface-variant text-sm">{t("admin.profile.languageDesc")}</p>
                  </div>
                  <button
                    onClick={() => setShowLanguageModal(true)}
                    className="border border-primary text-primary px-4 py-2 rounded-lg font-button text-sm hover:bg-primary/5 transition-all shrink-0"
                  >
                    {t("admin.profile.languageChange")}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Eco score + Activity + Sessions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Eco impact score */}
              <div className="eco-gradient text-white rounded-xl p-6 overflow-hidden relative">
                <div className="absolute -right-8 -top-8 opacity-20 rotate-12 pointer-events-none">
                  <Icon name="eco" style={{ fontSize: 140 }} />
                </div>
                <h4 className="text-label-sm font-label-sm uppercase tracking-wider mb-4 opacity-90">
                  {t("admin.profile.ecoScore")}
                </h4>
                <div className="text-4xl font-bold mb-2">98.4%</div>
                <p className="text-sm opacity-80">
                  {t("admin.profile.ecoScoreDesc")}
                </p>
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-xs mb-2">
                    <span>{t("admin.profile.weeklyProgress")}</span>
                    <span>{t("admin.profile.weeklyTarget")}</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-white h-full" style={{ width: "98.4%" }} />
                  </div>
                </div>
              </div>

              {/* Activity log */}
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
                <h3 className="font-bold text-on-surface mb-4">{t("admin.profile.activityLog")}</h3>
                <div className="space-y-4">
                  {activityLogs.length > 0 ? activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className={`w-2 rounded-full shrink-0 ${colorMap[log.color as keyof typeof colorMap] || 'bg-surface-variant'}`} />
                      <div>
                        <p className="text-sm font-bold text-on-surface">{log.action}</p>
                        <p className="text-xs text-on-surface-variant">{log.timestamp}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-body-sm text-on-surface-variant">{t("admin.profile.noActivity")}</p>
                  )}
                </div>
                <button className="w-full mt-6 text-primary font-bold text-sm hover:underline text-left">
                  {t("admin.profile.viewAllActivity")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">{t("admin.profile.changePasswordTitle")}</h3>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <FormField type="password" label={t("admin.profile.currentPassword")} value={currentPassword} onChange={setCurrentPassword} />
              <FormField type="password" label={t("admin.profile.newPassword")} value={newPassword} onChange={setNewPassword} />
              <FormField type="password" label={t("admin.profile.confirmPasswordNew")} value={newPasswordConfirmation} onChange={setNewPasswordConfirmation} />
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-on-surface-variant font-button hover:bg-surface-variant rounded-lg">{t("admin.profile.cancel")}</button>
                <button type="submit" disabled={savingPassword} className="px-4 py-2 bg-primary text-on-primary font-button rounded-lg hover:brightness-95 disabled:opacity-60 flex items-center gap-2">
                  {savingPassword && <Icon name="sync" className="animate-spin" />}
                  {t("admin.profile.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">{t("admin.profile.pinModalTitle")}</h3>
            <form onSubmit={handleSavePin} className="space-y-4">
              {hasPin && (
                <FormField type="password" label={t("admin.profile.currentPin")} value={currentPin} onChange={setCurrentPin} maxLength={6} />
              )}
              <FormField type="password" label={t("admin.profile.newPin")} value={newPin} onChange={setNewPin} maxLength={6} />
              <FormField type="password" label={t("admin.profile.confirmPin")} value={newPinConfirmation} onChange={setNewPinConfirmation} maxLength={6} />
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setShowPinModal(false)} className="px-4 py-2 text-on-surface-variant font-button hover:bg-surface-variant rounded-lg">{t("admin.profile.cancel")}</button>
                <button type="submit" disabled={savingPin} className="px-4 py-2 bg-primary text-on-primary font-button rounded-lg hover:brightness-95 disabled:opacity-60 flex items-center gap-2">
                  {savingPin && <Icon name="sync" className="animate-spin" />}
                  {t("admin.profile.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">{t("admin.profile.languageModalTitle")}</h3>
            <div className="space-y-3">
              {(["id", "en"] as const).map((lang) => {
                const active = i18n.language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => { i18n.changeLanguage(lang); setShowLanguageModal(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      active
                        ? "border-primary bg-primary-container/30 text-primary"
                        : "border-outline-variant hover:bg-surface-variant text-on-surface"
                    }`}
                  >
                    <span className="font-bold">{lang === "id" ? "Indonesia" : "English"}</span>
                    {active && <Icon name="check_circle" fill className="text-primary" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full mt-4 py-2 text-on-surface-variant font-button hover:bg-surface-variant rounded-lg"
            >
              {t("admin.profile.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <div className={`text-surface rounded-xl px-6 py-4 shadow-xl flex items-center gap-4 ${toast.type === 'error' ? 'bg-error' : 'bg-on-background'}`}>
            <Icon name={toast.type === 'error' ? 'error' : 'check_circle'} fill className={toast.type === 'error' ? 'text-surface' : 'text-primary-fixed'} />
            <p className="text-body-md">{toast.message}</p>
          </div>
        </div>
      )}

      <PinVerificationModal
        isOpen={showPinForPassword}
        onClose={() => setShowPinForPassword(false)}
        onSuccess={() => {
          setShowPinForPassword(false);
          performSavePassword();
        }}
        isAdmin={true}
      />
    </>
  );
}

function FormField({
  label,
  value,
  onChange,
  type,
  disabled = false,
  maxLength
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-label-sm font-label-sm text-on-surface-variant">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
      />
    </div>
  );
}
