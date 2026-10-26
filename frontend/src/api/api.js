import axios from "axios";
import { browserAdapter } from "./browserApi";
export const browserMode = !import.meta.env.VITE_API_URL;
const prefix = browserMode
  ? "donaapp:" + new URL(".", window.location.href).pathname + ":"
  : "dona_";
export const storageKeys = { token: prefix + "token", user: prefix + "user" };
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  ...(browserMode ? { adapter: browserAdapter } : {}),
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKeys.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      localStorage.getItem(storageKeys.token)
    ) {
      localStorage.removeItem(storageKeys.token);
      localStorage.removeItem(storageKeys.user);
      window.dispatchEvent(new Event("dona-session-expired"));
    }
    return Promise.reject(error);
  },
);
export const message = (err) =>
  err.response?.data?.message ||
  (browserMode
    ? "No se pudo acceder a los datos de este navegador."
    : "No se pudo conectar con el servidor.");
