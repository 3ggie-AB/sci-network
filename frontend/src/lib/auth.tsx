import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getStoredUser, getToken, setStoredUser, setToken } from "./api";

export type User = {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  role?: string;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: { username: string; email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTok(getToken());
    setUser(getStoredUser<User>());
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api<any>("/api/auth/me");
      const u = res?.data ?? res?.user ?? res;
      if (u) {
        setUser(u);
        setStoredUser(u);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api<any>("/api/auth/login", { method: "POST", json: { username, password } });
    const token: string =
      res?.token ?? res?.access_token ?? res?.data?.token ?? res?.data?.access_token;
    const u: User = res?.user ?? res?.data?.user ?? { id: "", username };
    if (!token) throw new Error("Login response missing token");
    setToken(token);
    setStoredUser(u);
    setTok(token);
    setUser(u);
    await refresh();
  }, [refresh]);

  const register = useCallback(
    async (input: { username: string; email: string; password: string; full_name: string }) => {
      await api<any>("/api/auth/register", { method: "POST", json: input });
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setTok(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
