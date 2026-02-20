"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";


interface MeResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await apiRequest<MeResponse>("/auth/me", {
        method: "GET",
      });

      if (!res.error && res.data) {
        setUser({
          id: res.data.id,
          email: res.data.email,
          name: res.data.full_name,
          role: res.data.role,
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
