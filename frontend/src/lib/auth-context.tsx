"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, token: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("af_token");
    const u = localStorage.getItem("af_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem("af_token", t);
    localStorage.setItem("af_user", JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("af_token");
    localStorage.removeItem("af_user");
    setToken(null); setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
