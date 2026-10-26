import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, ArrowUpRight, Package } from "lucide-react";
import { api, message } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  useResource,
  Notice,
  Loading,
  Empty,
  PageTitle,
  Badge,
  Field,
  Info,
  types,
} from "../components/UI";
export default function Needs() {
  const n = useResource("/needs"),
    o = useResource("/orphanages");
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const category = params.get("categoria") || "";
  const [query, setQuery] = useState(""),
    [priority, setPriority] = useState(""),
    [status, setStatus] = useState("pendiente"),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    orphanage_id: "",
    tipo: "Ropa",
    descripcion: "",
    cantidad: 1,
    prioridad: "media",
    edad: "",
    talla: "",
  });
  const items = (n.data || []).filter(
    (x) =>
      (!category || x.categoria === category) &&
      (!priority || x.prioridad === priority) &&
      (!status || x.estado === status) &&
      `${x.tipo} ${x.descripcion} ${x.orphanage_nombre}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/needs", form);
      setShow(false);
      setForm({ ...form, descripcion: "", cantidad: 1 });
      await n.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function change(id, estado) {
    setError("");
    try {
      await api.patch(`/needs/${id}/status`, { estado });
      n.reload();
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <div className="container page">
      <PageTitle
        eyebrow="CADA APORTE CUENTA"
        title="Necesidades que esperan tu ayuda"
        action={
          user?.rol === "admin" && (
            <button className="btn btn-dark" onClick={() => setShow(!show)}>
              <Plus size={17} />
              {show ? "Cerrar formulario" : "Publicar necesidad"}
            </button>
          )
        }
      >
        Encuentra una causa y decide cómo quieres sumar.
      </PageTitle>
      <Notice>{n.error || o.error || error}</Notice>
      {show && (
        <form className="card form-grid" onSubmit={create}>
          <Field label="Organización">
            <select
              required
              value={form.orphanage_id}
              onChange={(e) =>
                setForm({ ...form, orphanage_id: e.target.value })
              }
            >
              <option value="">Selecciona una organización</option>
              {o.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              {types.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Artículo y unidad de medida">
            <input
              required
              maxLength={1000}
              value={form.descripcion}
              placeholder="Ej. bolsas de arroz de 1 kg"
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
            />
          </Field>
          <Field label="Cantidad solicitada">
            <input
              required
              type="number"
              min="1"
              max="100000"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            />
          </Field>
          <Field label="Prioridad">
            <select
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
            >
              {["alta", "media", "baja"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Talla / edad (opcional)">
            <input
              value={form.talla}
              onChange={(e) => setForm({ ...form, talla: e.target.value })}
            />
          </Field>
          <button disabled={busy} className="btn btn-primary">
            {busy ? "Publicando…" : "Publicar necesidad"}
          </button>
        </form>
      )}
      <div className="tabs" aria-label="Categorías">
        {["", "Infancia", "Animales", "Comunidad"].map((x) => (
          <button
            key={x}
            aria-pressed={category === x}
            className={category === x ? "selected" : ""}
            onClick={() => setParams(x ? { categoria: x } : {})}
          >
            {x || "Todas las causas"}
          </button>
        ))}
      </div>
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar necesidades"
            placeholder="Buscar por artículo u organización…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar prioridad"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {["alta", "media", "baja"].map((x) => (
            <option key={x} value={x}>
              Prioridad {x}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pendiente">Abiertas</option>
          <option value="cubierta">Cubiertas</option>
          <option value="">Todos los estados</option>
        </select>
      </div>
      <p className="result-count">{items.length} necesidades encontradas</p>
      {!n.data && !n.error ? (
        <Loading />
      ) : items.length ? (
        <div className="needs-grid">
          {items.map((x) => (
            <article className="need-card" key={x.id}>
              <div
                className={
                  "need-banner " +
                  ({
                    Infancia: "peach",
                    Animales: "mint",
                    Comunidad: "lavender",
                  }[x.categoria] || "peach")
                }
              >
                <Package size={38} strokeWidth={1.25} />
                <Badge value={x.prioridad} />
              </div>
              <div className="need-body">
                <span className="eyebrow">
                  {x.categoria} · {x.tipo}
                </span>
                <h3>{x.descripcion}</h3>
                <p>{x.orphanage_nombre}</p>
                <div className="progress-label">
                  <b>
                    {x.recibidas} de {x.cantidad}
                  </b>
                  <span>unidades recibidas</span>
                </div>
                <progress
                  aria-label="Avance de entrega"
                  max={x.cantidad}
                  value={Math.min(x.recibidas, x.cantidad)}
                />
                <p className="muted small">
                  {x.talla && `Talla / edad: ${x.talla} · `}Estado: {x.estado}
                </p>
                {x.estado === "pendiente" && (
                  <Link
                    className="btn btn-outline full"
                    to={"/donar?necesidad=" + x.id}
                  >
                    Quiero aportar
                    <ArrowUpRight size={17} />
                  </Link>
                )}
                {user?.rol === "admin" && (
                  <button
                    className="text-link small"
                    onClick={() =>
                      change(
                        x.id,
                        x.estado === "cubierta" ? "pendiente" : "cubierta",
                      )
                    }
                  >
                    {x.estado === "cubierta"
                      ? "Reabrir necesidad"
                      : "Marcar como cubierta"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        !n.error && <Empty>No hay necesidades con estos filtros.</Empty>
      )}
      <Info title="El avance representa entregas confirmadas">
        El registro de un aporte todavía no cubre una necesidad. La barra suma
        únicamente las cantidades que coordinación marcó como entregadas.
        Verifica que cada artículo use la misma unidad de medida.
      </Info>
    </div>
  );
}
