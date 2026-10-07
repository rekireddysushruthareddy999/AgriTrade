/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("agritrade_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("agritrade_token"));
  const [loading, setLoading] = useState(() => {
    const hasToken = Boolean(localStorage.getItem("agritrade_token"));
    const hasUser = Boolean(localStorage.getItem("agritrade_user"));
    return hasToken && !hasUser;
  });

  const clearSession = useCallback(() => {
    localStorage.removeItem("agritrade_token");
    localStorage.removeItem("agritrade_user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      if (active) setLoading(false);
      return () => { active = false; };
    }
    axiosInstance.post("/auth/refresh")
      .then((response) => {
        if (!active) return;
        const refreshedToken = response?.data?.data?.token;
        const refreshedUser = response?.data?.data?.user;
        if (refreshedToken) {
          localStorage.setItem("agritrade_token", refreshedToken);
          setToken(refreshedToken);
        }
        if (refreshedUser) {
          localStorage.setItem("agritrade_user", JSON.stringify(refreshedUser));
          setUser(refreshedUser);
        }
      })
      .catch((err) => {
        if (active && (err?.response?.status === 401 || err?.response?.status === 403)) {
          clearSession();
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, clearSession]);

  const login = async (payload) => {
    const response = await axiosInstance.post("/auth/login", payload);
    const authToken = response?.data?.data?.token;
    const userData = response?.data?.data?.user;
    if (!authToken) throw new Error("The server did not return an authentication token.");
    localStorage.setItem("agritrade_token", authToken);
    if (userData) localStorage.setItem("agritrade_user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData || null);
    return response.data;
  };

  const register = async (payload) => (await axiosInstance.post("/auth/register", payload)).data;

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem("agritrade_user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, updateUser, logout }),
    [user, token, loading, updateUser, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
