"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { roleNames } from "./roles";

interface User {
  id: string;
  email: string;
  roles?: string[];
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isManager: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ 
  user: null, token: null, isAdmin: false, isManager: false, login: () => {}, logout: () => {} 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const t = localStorage.getItem("af_token");
    return t || null;
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem("af_user");
    return u ? JSON.parse(u) : null;
  });

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

  const roles = roleNames(user?.roles);
  const isAdmin = roles.some(r => r.startsWith("ADMIN"));
  const isManager = roles.some(r => r.startsWith("MANAGER"));

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isManager, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
