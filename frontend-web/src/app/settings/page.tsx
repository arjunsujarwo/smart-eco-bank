"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import { updateUserProfile, updateUserPassword, updateUserPin, verifyUserPin, deleteUserPhoto } from "@/lib/api";
import PinVerificationModal from "@/components/PinVerificationModal";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const SETTINGS_KEYS = [
  { id: "security",      icon: "security",      href: null },
  { id: "notifications", icon: "notifications", href: null },
  { id: "language",      icon: "language",      href: null },
  { id: "about",         icon: "info",          href: "/tentang" },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { toast, showToast } = useToast();
  const { t, i18n } = useTranslation();

  const [confirmLogout, setConfirmLogout] = useState(false);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Notification state
  const [notifSound, setNotifSound] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifUpdate, setNotifUpdate] = useState(true);

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && showProfileModal) {
      setName(user.fullName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setPhotoPreview(user.avatarUrl || null);
    }
  }, [user, showProfileModal]);

  useEffect(() => {
    refreshUser();
    
    // Load local settings
    if (typeof window !== "undefined") {
      setNotifSound(localStorage.getItem("eco_notif_sound") !== "false");
      setNotifChat(localStorage.getItem("eco_notif_chat") !== "false");
      setNotifUpdate(localStorage.getItem("eco_notif_update") !== "false");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleSound = () => {
    const newVal = !notifSound;
    setNotifSound(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("eco_notif_sound", newVal ? "true" : "false");
    }
    showToast(`Suara notifikasi ${newVal ? 'diaktifkan' : 'dimatikan'}`);
  };

  const handleToggleChat = () => {
    const newVal = !notifChat;
    setNotifChat(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("eco_notif_chat", newVal ? "true" : "false");
    }
    showToast(`Notifikasi pesan ${newVal ? 'diaktifkan' : 'dimatikan'}`);
  };

  const handleToggleUpdate = () => {
    const newVal = !notifUpdate;
    setNotifUpdate(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("eco_notif_update", newVal ? "true" : "false");
    }
    showToast(`Notifikasi sistem & transaksi ${newVal ? 'diaktifkan' : 'dimatikan'}`);
  };

  const totalGrams = user?.totalGramSaved ?? 0;
  const totalKg = totalGrams / 1000;

  function getBadge(kg: number): string {
    if (kg >= 500) return "Earth Legend ✨";
    if (kg >= 251) return "Eco Champion 👑";
    if (kg >= 151) return "Planet Defender ⭐";
    if (kg >= 101) return "Sustainability Hero 🏆";
    if (kg >= 76)  return "Green Guardian 🛡️";
    if (kg >= 51)  return "Earth Protector 🌍";
    if (kg >= 36)  return "Eco Advocate 🌿";
    if (kg >= 21)  return "Waste Reducer ♻️";
    if (kg >= 11)  return "Green Supporter 🍃";
    if (kg >= 1)   return "Eco Contributor 🌱";
    return "Mulai Berkontribusi 🌾";
  }

  const level = getBadge(totalKg);

  async function handleLogout() {
    try {
      await logout();
      router.push("/");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Logout gagal", "error");
    }
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
    setSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: name,
        phone,
        address,
        photo: photoFile
      });
      showToast("Profil berhasil disimpan", "success");
      setShowProfileModal(false);
      refreshUser();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeletePhoto() {
    const result = await Swal.fire({
      title: "Hapus Foto Profil?",
      text: "Anda tidak dapat mengembalikan tindakan ini!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;
    
    try {
      await deleteUserPhoto();
      showToast("Foto profil berhasil dihapus", "success");
      setPhotoPreview(null);
      setPhotoFile(null);
      refreshUser();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (user?.hasPin) {
      setShowPinForPassword(true);
      return;
    }
    await performSavePassword();
  }

  async function performSavePassword() {
    setSavingPassword(true);
    try {
      await updateUserPassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation
      });
      showToast("Password berhasil diperbarui", "success");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setShowSecurityModal(false);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSavePin(e: React.FormEvent) {
    e.preventDefault();
    setSavingPin(true);
    try {
      await updateUserPin({
        currentPin: currentPin || undefined,
        newPin,
        newPinConfirmation
      });
      showToast("PIN berhasil diperbarui", "success");
      setCurrentPin("");
      setNewPin("");
      setNewPinConfirmation("");
      refreshUser();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSavingPin(false);
    }
  }

  const handleSettingClick = (s: { id: string; href: string | null }) => {
    if (s.href) {
      router.push(s.href);
    } else if (s.id === "security") {
      setShowSecurityModal(true);
    } else if (s.id === "language") {
      setShowLanguageModal(true);
    } else if (s.id === "notifications") {
      setShowNotificationModal(true);
    }
  };

  return (
    <AppShell>
      {toast && <Toast {...toast} />}
      <div className="max-w-[1280px] mx-auto px-4 md:px-container-padding-desktop py-4 md:py-stack-lg space-y-4 md:space-y-stack-lg">
        <section>
          <h1 className="text-xl md:text-headline-lg font-headline-lg text-on-surface mb-1">
            {t("settings.title")}
          </h1>
          <p className="hidden md:block font-body-lg text-body-lg text-on-surface-variant">
            {t("settings.subtitle")}
          </p>
        </section>

        {/* Profile */}
        <div className="glass-card rounded-xl p-3 md:p-stack-md flex items-center gap-3 md:gap-stack-md">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary-container flex items-center justify-center overflow-hidden text-on-primary-container shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" fill style={{ fontSize: 28 }} />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-body-md font-bold text-on-surface text-base md:text-lg truncate">
              {user?.fullName ?? ""}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {user?.email ?? ""} · {t("settings.activeSaver")}
            </p>
          </div>
          <button 
            onClick={() => setShowProfileModal(true)}
            className="py-1.5 px-3 md:py-2 md:px-4 bg-primary-container text-on-primary-container font-button text-sm rounded-lg hover:brightness-95 transition-all shrink-0"
          >
            {t("settings.editProfile")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-gutter">
          {/* Settings grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3 md:gap-stack-md content-start">
            {SETTINGS_KEYS.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSettingClick(s)}
                className="glass-card p-3 md:p-stack-md rounded-xl hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-2 md:mb-stack-sm group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon name={s.icon} className="text-[20px] md:text-[24px]" />
                </div>
                <h3 className="font-bold text-sm md:text-body-md mb-1">
                  {t(`settings.${s.id}.title`)}
                </h3>
                <p className="text-xs md:text-label-sm text-on-surface-variant mb-2 md:mb-stack-md line-clamp-2">
                  {t(`settings.${s.id}.desc`)}
                </p>
                <span className="text-primary font-button text-xs md:text-sm flex items-center gap-1">
                  {t(`settings.${s.id}.cta`)} <Icon name="chevron_right" className="text-xs md:text-sm" />
                </span>
              </div>
            ))}

            <div className="col-span-2">
              <button
                onClick={() => setConfirmLogout(true)}
                className="flex items-center gap-3 p-3 md:p-stack-md w-full rounded-xl text-error border border-error/20 hover:bg-error-container/20 transition-all"
              >
                <Icon name="logout" />
                <span className="font-body-md font-bold text-sm md:text-base">{t("settings.logout")}</span>
              </button>
            </div>
          </div>

          {/* Green impact */}
          <div className="bg-primary text-white p-4 md:p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-20 rotate-12">
              <Icon name="eco" fill style={{ fontSize: 160 }} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-stack-lg">
                <Icon name="eco" fill />
                <h2 className="font-headline-md text-headline-md">
                  {t("settings.greenImpact.title")}
                </h2>
              </div>
              <div className="mb-stack-lg">
                <p className="text-primary-fixed text-label-sm font-label-sm uppercase tracking-wider">
                  {t("settings.greenImpact.wasteLabel")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-extrabold">{totalGrams}</span>
                  <span className="text-xl font-bold">g</span>
                </div>
              </div>
              <div className="glass-panel rounded-xl p-4 flex items-center gap-stack-md border border-white/30">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary">
                  <Icon name="workspace_premium" fill />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase opacity-80">
                    {t("settings.greenImpact.badgeLabel")}
                  </p>
                  <p className="font-body-md font-extrabold leading-tight">
                    {level}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm italic opacity-90">
                  &ldquo;{t("settings.greenImpact.quote")}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmLogout(false)}>
          <div className="bg-surface rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center text-error mx-auto">
              <Icon name="logout" style={{ fontSize: 32 }} />
            </div>
            <h3 className="text-headline-md font-headline-md mt-4">{t("settings.logoutModal.title")}</h3>
            <p className="text-body-md text-on-surface-variant mt-2">{t("settings.logoutModal.desc")}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 border border-outline rounded-xl font-button hover:bg-surface-variant transition-colors">{t("settings.logoutModal.cancel")}</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-error text-on-error rounded-xl font-button hover:brightness-95 transition-all">{t("settings.logoutModal.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">{t("settings.profile.modalTitle")}</h3>
            <div className="flex flex-col items-center gap-2 mb-6">
              <div 
                  className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden cursor-pointer relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" className="text-outline" style={{ fontSize: 40 }} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Icon name="photo_camera" className="text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="text-error font-button text-xs hover:underline mt-1"
                  >
                    {t("settings.profile.deletePhoto")}
                  </button>
                )}
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <FormField label={t("settings.profile.nameLabel")} value={name} onChange={setName} type="text" />
              <FormField label={t("settings.profile.emailLabel")} value={user?.email || ""} onChange={() => {}} type="email" disabled />
              <FormField label={t("settings.profile.phoneLabel")} value={phone} onChange={setPhone} type="text" />
              <div className="space-y-2">
                <label className="text-label-sm font-label-sm text-on-surface-variant">{t("settings.profile.addressLabel")}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 text-on-surface-variant font-button hover:bg-surface-variant rounded-lg">{t("settings.profile.cancel")}</button>
                <button type="submit" disabled={savingProfile} className="px-4 py-2 bg-primary text-on-primary font-button rounded-lg hover:brightness-95 disabled:opacity-60 flex items-center gap-2">
                  {savingProfile && <Icon name="sync" className="animate-spin" />}
                  {t("settings.profile.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-md font-headline-md text-on-surface">{t("settings.security_modal.title")}</h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Ubah Password Form */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                <h4 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="lock" className="text-primary text-[20px]" /> {t("settings.security_modal.passwordSection")}
                </h4>
                <form onSubmit={handleSavePassword} className="space-y-3">
                  <FormField type="password" label={t("settings.security_modal.currentPassword")} value={currentPassword} onChange={setCurrentPassword} />
                  <FormField type="password" label={t("settings.security_modal.newPassword")} value={newPassword} onChange={setNewPassword} />
                  <FormField type="password" label={t("settings.security_modal.confirmPassword")} value={newPasswordConfirmation} onChange={setNewPasswordConfirmation} />
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={savingPassword} className="px-4 py-2 bg-primary text-on-primary text-sm font-button rounded-lg hover:brightness-95 disabled:opacity-60 flex items-center gap-2">
                      {savingPassword && <Icon name="sync" className="animate-spin" />}
                      {t("settings.security_modal.savePassword")}
                    </button>
                  </div>
                </form>
              </div>

              {/* Ubah PIN Form */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                <h4 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="dialpad" className="text-primary text-[20px]" />
                  {t("settings.security_modal.pinSection")}
                </h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  {t("settings.security_modal.pinStatus")}
                  <strong className={user?.hasPin ? "text-primary ml-1" : "text-error ml-1"}>
                    {user?.hasPin ? t("settings.security_modal.pinActive") : t("settings.security_modal.pinNotSet")}
                  </strong>
                </p>
                <form onSubmit={handleSavePin} className="space-y-3">
                  {user?.hasPin && (
                    <FormField type="password" label={t("settings.security_modal.currentPin")} value={currentPin} onChange={setCurrentPin} maxLength={6} />
                  )}
                  <FormField type="password" label={t("settings.security_modal.newPin")} value={newPin} onChange={setNewPin} maxLength={6} />
                  <FormField type="password" label={t("settings.security_modal.confirmPin")} value={newPinConfirmation} onChange={setNewPinConfirmation} maxLength={6} />
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={savingPin} className="px-4 py-2 bg-secondary text-on-secondary text-sm font-button rounded-lg hover:brightness-95 disabled:opacity-60 flex items-center gap-2">
                      {savingPin && <Icon name="sync" className="animate-spin" />}
                      {t("settings.security_modal.savePin")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
        isAdmin={false}
      />

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowLanguageModal(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-xs p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-md font-headline-md text-on-surface">{t("settings.language.modalTitle")}</h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
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
                    <span className="font-bold">{t(`settings.language.${lang}`)}</span>
                    {active && <Icon name="check_circle" fill className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t("settings.notifModal.title")}</h2>
              <button onClick={() => setShowNotificationModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface-container-low">
                <div>
                  <h3 className="font-bold text-sm">{t("settings.notifModal.soundTitle")}</h3>
                  <p className="text-xs text-on-surface-variant">{t("settings.notifModal.soundDesc")}</p>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifSound ? 'bg-primary' : 'bg-surface-variant'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifSound ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface-container-low">
                <div>
                  <h3 className="font-bold text-sm">{t("settings.notifModal.chatTitle")}</h3>
                  <p className="text-xs text-on-surface-variant">{t("settings.notifModal.chatDesc")}</p>
                </div>
                <button
                  onClick={handleToggleChat}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifChat ? 'bg-primary' : 'bg-surface-variant'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifChat ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface-container-low">
                <div>
                  <h3 className="font-bold text-sm">{t("settings.notifModal.systemTitle")}</h3>
                  <p className="text-xs text-on-surface-variant">{t("settings.notifModal.systemDesc")}</p>
                </div>
                <button
                  onClick={handleToggleUpdate}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifUpdate ? 'bg-primary' : 'bg-surface-variant'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifUpdate ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full mt-6 py-3 bg-surface border border-outline-variant rounded-xl font-button text-sm font-bold hover:bg-surface-variant transition-colors"
            >
              {t("settings.notifModal.close")}
            </button>
          </div>
        </div>
      )}
    </AppShell>
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
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-on-surface-variant">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
      />
    </div>
  );
}
