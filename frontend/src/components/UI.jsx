import { useEffect, useState } from "react";
import { api, message } from "../api/api";
import { AlertCircle, ArrowRight, HeartHandshake } from "lucide-react";
export function useResource(url) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  async function reload() {
    setError("");
    try {
      setData((await api.get(url)).data);
    } catch (e) {
      setError(message(e));
    }
  }
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api
      .get(url)
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [url]);
  return { data, error, reload };
}
export function Notice({ children }) {
  return children ? (
    <div className="notice" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="empty" role="status">
      Cargando información…
    </div>
  );
}
export function Empty({ children = "Todavía no hay registros." }) {
  return (
    <div className="empty">
      <HeartHandshake size={34} />
      <p>{children}</p>
    </div>
  );
}
export function PageTitle({ eyebrow, title, children, action }) {
  return (
    <header className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </header>
  );
}
export function Badge({ value }) {
  return <span className={`badge ${value}`}>{value}</span>;
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Info({ title, children }) {
  return (
    <aside className="info">
      <span className="eyebrow">PARA TENER EN CUENTA</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </aside>
  );
}
export const Arrow = () => <ArrowRight size={17} />;
export const types = [
  "Ropa",
  "Alimentos",
  "Útiles escolares",
  "Juguetes",
  "Higiene",
  "Otros",
];
export function exportCSV(rows) {
  const headers = [
    "Código",
    "Organización",
    "Tipo",
    "Descripción",
    "Cantidad",
    "Estado",
    "Fecha",
  ];
  const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const safe = (v) => (/^[=+@\-\t\r]/.test(String(v)) ? "'" + v : v);
  const data = rows.map((d) => [
    `DA-${d.id}`,
    d.orphanage_nombre,
    d.tipo,
    d.descripcion,
    d.cantidad,
    d.estado,
    d.created_at,
  ]);
  const blob = new Blob(
    [
      "\uFEFF" +
        [headers, ...data]
          .map((r) => r.map((v) => esc(safe(v))).join(";"))
          .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "donaciones.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
