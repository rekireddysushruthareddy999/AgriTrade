/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("agritrade_token"));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("agritrade_token")));

  const clearSession = useCallback(() => {
    localStorage.removeItem("agritrade_token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      if (active) setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    axiosInstance.post("/auth/refresh")
      .then((response) => {
        if (!active) return;
        const refreshedToken = response?.data?.data?.token;
        const refreshedUser = response?.data?.data?.user;
        if (refreshedToken) {
          localStorage.setItem("agritrade_token", refreshedToken);
          setToken(refreshedToken);
        }
        setUser(refreshedUser || null);
      })
      .catch(() => { if (active) clearSession(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, clearSession]);

  const login = async (payload) => {
    const response = await axiosInstance.post("/auth/login", payload);
    const authToken = response?.data?.data?.token;
    if (!authToken) throw new Error("The server did not return an authentication token.");
    localStorage.setItem("agritrade_token", authToken);
    setToken(authToken);
    setUser(response?.data?.data?.user || null);
    return response.data;
  };

  const register = async (payload) => (await axiosInstance.post("/auth/register", payload)).data;

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
