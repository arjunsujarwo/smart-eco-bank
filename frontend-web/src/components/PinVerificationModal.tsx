"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { verifyUserPin } from "@/lib/api";
import { verifyAdminPin } from "@/lib/adminApi";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export default function PinVerificationModal({ isOpen, onClose, onSuccess, isAdmin = false }: PinVerificationModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        await verifyAdminPin(pin);
      } else {
        await verifyUserPin(pin);
      }
      setPin("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "PIN salah. Silakan coba lagi.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="close" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Icon name="dialpad" style={{ fontSize: 32 }} />
          </div>
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Verifikasi Keamanan</h3>
          <p className="text-body-md text-on-surface-variant mt-2">
            Masukkan 6 digit PIN keamanan Anda untuk melanjutkan aksi ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-surface-container-low border border-outline-variant rounded-xl p-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="••••••"
              maxLength={6}
              autoFocus
              required
            />
            {error && (
              <p className="text-error text-sm text-center mt-3 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length !== 6 || loading}
            className="w-full py-3.5 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 disabled:opacity-50 disabled:hover:brightness-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Icon name="sync" className="animate-spin" /> Memverifikasi...</>
            ) : (
              "Lanjutkan"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
