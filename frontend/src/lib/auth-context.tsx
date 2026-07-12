"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  const isAdmin = user?.roles?.some(r => r.startsWith("ADMIN")) ?? false;
  const isManager = user?.roles?.some(r => r.startsWith("MANAGER")) ?? false;

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isManager, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
