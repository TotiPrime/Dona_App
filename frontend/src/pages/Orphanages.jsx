import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, message } from "../api/api";
import {
  useResource,
  Notice,
  PageTitle,
  Field,
  Empty,
  Loading,
} from "../components/UI";
const blank = {
  nombre: "",
  direccion: "",
  telefono: "",
  responsable: "",
  descripcion: "",
  capacidad: 0,
  categoria: "Infancia",
};
export default function Orphanages() {
  const { user } = useAuth();
  const r = useResource("/orphanages");
  const [query, setQuery] = useState(""),
    [form, setForm] = useState(blank),
    [edit, setEdit] = useState(null),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await (edit
        ? api.put("/orphanages/" + edit, form)
        : api.post("/orphanages", form));
      setShow(false);
      setEdit(null);
      setForm(blank);
      r.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (
      !window.confirm(
        "¿Eliminar esta organización? Solo se permite si no tiene registros asociados.",
      )
    )
      return;
    setError("");
    try {
      await api.delete("/orphanages/" + id);
      r.reload();
    } catch (e) {
      setError(message(e));
    }
  }
  const rows = r.data?.filter((x) =>
    `${x.nombre} ${x.categoria}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="container page">
      <PageTitle
        eyebrow="UNA RED CON PROPÓSITO"
        title="Organizaciones"
        action={
          user?.rol === "admin" && (
            <button
              className="btn btn-dark"
              onClick={() => {
                setShow(!show);
                setEdit(null);
                setForm(blank);
              }}
            >
              <Plus size={17} />
              Agregar organización
            </button>
          )
        }
      >
        Conoce a quién llegará tu ayuda y consulta sus necesidades.
      </PageTitle>
      <Notice>{error || r.error}</Notice>
      {show && (
        <form className="card form-grid" onSubmit={save}>
          <h3 className="wide">
            {edit ? "Editar organización" : "Nueva organización"}
          </h3>
          {[
            ["nombre", "Nombre"],
            ["direccion", "Dirección"],
            ["telefono", "Teléfono"],
            ["responsable", "Responsable"],
          ].map(([k, l]) => (
            <Field label={l} key={k}>
              <input
                required={k === "nombre"}
                maxLength="120"
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Categoría">
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {["Infancia", "Animales", "Comunidad"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Capacidad referencial">
            <input
              type="number"
              min="0"
              value={form.capacidad}
              onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <textarea
              maxLength="1000"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
            />
          </Field>
          <div className="actions">
            <button disabled={busy} className="btn btn-primary">
              {busy ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShow(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <label className="search standalone">
        <Search size={18} />
        <input
          aria-label="Buscar organizaciones"
          placeholder="Buscar por nombre o categoría"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {!r.data && !r.error ? (
        <Loading />
      ) : rows?.length ? (
        <div className="org-grid">
          {rows.map((x) => (
            <article className="card org-card" key={x.id}>
              <div className="org-heading">
                <span className="org-icon">
                  <Building2 size={29} />
                </span>
                <span className="badge">{x.categoria}</span>
              </div>
              <h3>{x.nombre}</h3>
              <p>{x.descripcion || "Sin descripción registrada."}</p>
              <p className="location">
                <MapPin size={16} />
                {x.direccion || "Dirección pendiente de confirmar"}
              </p>
              {x.responsable && (
                <p className="small">Responsable: {x.responsable}</p>
              )}
              {x.telefono && <p className="small">Teléfono: {x.telefono}</p>}
              <Link
                to={"/necesidades?categoria=" + encodeURIComponent(x.categoria)}
                className="text-link"
              >
                Explorar su categoría ↗
              </Link>
              {user?.rol === "admin" && (
                <div className="actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setForm(x);
                      setEdit(x.id);
                      setShow(true);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    className="icon-btn danger"
                    aria-label={"Eliminar " + x.nombre}
                    onClick={() => remove(x.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        !r.error && <Empty>No hay organizaciones con ese nombre.</Empty>
      )}
    </div>
  );
}
