import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeartHandshake, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { message, browserMode } from "../api/api";
import { Field, Notice } from "../components/UI";
export default function Login() {
  const [mode, setMode] = useState("login"),
    [form, setForm] = useState({ nombre: "", email: "", password: "" }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ ...form, rol: "donante" });
      navigate(
        location.state?.from?.startsWith("/")
          ? location.state.from
          : "/dashboard",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-page">
      <div className="auth-story">
        <HeartHandshake size={52} />
        <span className="eyebrow">CONECTA CON UNA CAUSA</span>
        <h1>
          La solidaridad
          <br />
          empieza contigo.
        </h1>
        <p>
          Un espacio para organizar tu ayuda y conocer el recorrido de cada
          aporte.
        </p>
        <div className="auth-note">
          <b>Tu cuenta, tu seguimiento.</b>
          <p>Consulta tus registros, revisiones y entregas en un solo lugar.</p>
        </div>
      </div>
      <form className="card auth-form" onSubmit={submit}>
        <span className="eyebrow">BIENVENIDO A DONAAPP</span>
        <h2>
          {mode === "login" ? "Qué bueno verte aquí." : "Sumemos juntos."}
        </h2>
        <p>
          {mode === "login"
            ? "Ingresa para continuar con tu aporte."
            : "Crea tu cuenta de donante."}
        </p>
        <Notice>{error}</Notice>
        {mode === "register" && (
          <Field label="Nombre completo">
            <input
              autoComplete="name"
              minLength="2"
              maxLength="100"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
        )}
        <Field label="Correo electrónico">
          <input
            autoComplete="email"
            required
            type="email"
            value={form.email}
            placeholder="tu@correo.com"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Contraseña">
          <input
            required
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            type="password"
            minLength={mode === "register" ? 8 : 1}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <button disabled={busy} className="btn btn-primary full">
          {busy
            ? "Un momento…"
            : mode === "login"
              ? "Ingresar"
              : "Crear cuenta"}
          <ArrowUpRight size={17} />
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "¿Primera vez? Crea tu cuenta"
            : "Ya tengo una cuenta"}
        </button>
        {browserMode && (
          <div className="demo-accounts">
            <b>Cuentas de demostración</b>
            <p>
              Contraseña para las tres: <code>Demo2026!</code>
            </p>
            <div className="actions">
              {[
                ["Coordinación", "admin@donaapp.com"],
                ["Donante", "donante@donaapp.com"],
                ["Organización", "orfanato@donaapp.com"],
              ].map(([label, email]) => (
                <button
                  type="button"
                  className="btn btn-outline"
                  key={email}
                  onClick={() => {
                    setMode("login");
                    setForm({ ...form, email, password: "Demo2026!" });
                    setError("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="small muted">
          Las cuentas de coordinación y organizaciones son asignadas por
          administración.
        </p>
      </form>
    </div>
  );
}
