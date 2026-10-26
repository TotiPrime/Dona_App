import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { api, storageKeys, browserMode } from "../api/api";

const AuthContext = createContext(null);

function readSavedUser() {
  try {
    const raw = localStorage.getItem(storageKeys.user);
    return raw && localStorage.getItem(storageKeys.token)
      ? JSON.parse(raw)
      : null;
  } catch (error) {
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem(storageKeys.token);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(storageKeys.token, data.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem(storageKeys.token, data.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    const token = localStorage.getItem(storageKeys.token);
    if (browserMode && token)
      api
        .post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => {});
    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
    setUser(null);
  }

  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener("dona-session-expired", expired);
    if (localStorage.getItem(storageKeys.token))
      api
        .get("/auth/me")
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
        })
        .catch(() => {});
    return () => window.removeEventListener("dona-session-expired", expired);
  }, []);
  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
