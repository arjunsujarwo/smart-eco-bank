"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import * as api from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    address: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function flagSuspended() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("account_suspended", "1");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUser(null);
      router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    const token = api.getStoredToken();
    if (token && !user) {
      api.getUser().then((u) => {
        if (u.isCanceled) {
          api.logout().then(() => {
            setUser(null);
            flagSuspended();
            router.push("/login");
          });
        } else {
          setUser(u);
        }
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      if (res.user.isCanceled) {
        await api.logout();
        flagSuspended();
        return null;
      }
      setUser(res.user);
      return res.user;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      address: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.register(payload);
        setUser(res.user);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Registrasi gagal");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.getUser();
      if (u.isCanceled) {
        await api.logout();
        setUser(null);
        flagSuspended();
        router.push("/login");
        return;
      }
      setUser(u);
    } catch {
      // ignore
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
