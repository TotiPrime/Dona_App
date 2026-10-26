import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Package,
  Clock,
  CheckCircle2,
  Building2,
  Search,
  History,
  X,
} from "lucide-react";
import { api, message } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  useResource,
  Notice,
  Loading,
  Empty,
  PageTitle,
  Badge,
  exportCSV,
} from "../components/UI";
const roles = {
  admin: "Coordinación",
  donante: "Donante",
  orfanato: "Organización",
};
const next = {
  registrada: ["aprobada", "rechazada"],
  aprobada: ["entregada", "rechazada"],
};
function Photo({ url }) {
  const [src, setSrc] = useState(""),
    [error, setError] = useState("");
  async function open() {
    try {
      const base = (import.meta.env.VITE_API_URL || "/api").replace(
        /\/api\/?$/,
        "",
      );
      const r = await api.get(base + url, {
        responseType: "blob",
        baseURL: "",
      });
      const object = URL.createObjectURL(r.data);
      setSrc(object);
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <div>
      {src ? (
        <>
          <img
            className="donation-photo"
            src={src}
            alt="Artículo registrado por el donante"
          />
          <button
            className="text-link"
            onClick={() => {
              URL.revokeObjectURL(src);
              setSrc("");
            }}
          >
            Cerrar fotografía
          </button>
        </>
      ) : (
        <button className="text-link" onClick={open}>
          Ver fotografía adjunta
        </button>
      )}
      <Notice>{error}</Notice>
    </div>
  );
}
export default function Dashboard() {
  const { user } = useAuth();
  const s = useResource("/dashboard/stats"),
    d = useResource("/donations");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState(null),
    [events, setEvents] = useState(null),
    [historyError, setHistoryError] = useState(""),
    [pending, setPending] = useState(null),
    [note, setNote] = useState("");
  const rows = (d.data || []).filter(
    (x) =>
      (!filter || x.estado === filter) &&
      `${x.id} ${x.descripcion} ${x.tipo} ${x.orphanage_nombre}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/donations/${pending.id}/status`, {
        estado: pending.estado,
        nota: note,
      });
      setPending(null);
      setNote("");
      await Promise.all([s.reload(), d.reload()]);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function history(row) {
    setDetail(row);
    setEvents(null);
    setHistoryError("");
    try {
      setEvents((await api.get(`/donations/${row.id}/history`)).data);
    } catch (e) {
      setHistoryError(message(e));
    }
  }
  return (
    <div className="container page">
      <PageTitle
        eyebrow={"MI ESPACIO · " + roles[user?.rol]}
        title={"Hola, " + (user?.nombre?.split(" ")[0] || "bienvenido") + "."}
        action={
          user?.rol !== "orfanato" && (
            <Link className="btn btn-primary" to="/donar">
              Nuevo aporte ↗
            </Link>
          )
        }
      >
        {user?.rol === "donante"
          ? "Aquí puedes seguir el recorrido de tus donaciones."
          : "Organiza la revisión y confirma las entregas de tu ámbito."}
      </PageTitle>
      <Notice>{error || s.error || d.error}</Notice>
      {s.data ? (
        <>
          <div className="dashboard-metrics">
            {[
              [Package, s.data.donations, "Aportes registrados"],
              [Clock, s.data.pendingDonations, "Pendientes de revisión"],
              [CheckCircle2, s.data.delivered, "Entregas confirmadas"],
              [Building2, s.data.units, "Unidades entregadas*"],
            ].map(([Icon, v, l]) => (
              <div className="card metric" key={l}>
                <span className="metric-icon">
                  <Icon size={21} />
                </span>
                <p>{l}</p>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <p className="small muted">
            {user?.rol === "donante"
              ? "Los indicadores muestran solo tus aportes."
              : user?.rol === "orfanato"
                ? "Los indicadores muestran solo organizaciones asignadas."
                : "Los indicadores muestran los aportes de toda la plataforma."}{" "}
            *Suma de artículos, no personas beneficiadas ni valor monetario.
          </p>
          <div className="dashboard-summary">
            <div className="card">
              <span className="eyebrow">COMPOSICIÓN DE APORTES</span>
              <h3>Así se distribuye la ayuda</h3>
              {s.data.byType.length ? (
                s.data.byType.map((x) => (
                  <div className="type-row" key={x.tipo}>
                    <span>{x.tipo}</span>
                    <progress
                      aria-label={"Registros de " + x.tipo}
                      value={x.total}
                      max={Math.max(s.data.donations, 1)}
                    />
                    <b>{x.total}</b>
                  </div>
                ))
              ) : (
                <p className="muted">Tu primer aporte aparecerá aquí.</p>
              )}
            </div>
            <aside className="info">
              <span className="eyebrow">SEGUIMIENTO CLARO</span>
              <h3>¿Qué significa cada estado?</h3>
              <p>
                <b>Registrada:</b> recibimos los datos.
                <br />
                <b>Aprobada:</b> aporte revisado; falta recibirlo.
                <br />
                <b>Entregada:</b> recepción confirmada.
                <br />
                <b>Rechazada:</b> revisa el motivo en el historial.
              </p>
            </aside>
          </div>
        </>
      ) : (
        !s.error && <Loading />
      )}
      <section className="card records">
        <div className="section-head">
          <div>
            <span className="eyebrow">TRAZABILIDAD</span>
            <h3>
              {user?.rol === "donante"
                ? "Mis donaciones"
                : "Gestión de donaciones"}
            </h3>
          </div>
          <button
            disabled={!rows.length}
            className="btn btn-outline"
            onClick={() => exportCSV(rows)}
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
        <div className="filters">
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Buscar donaciones"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar código, artículo u organización…"
            />
          </label>
          <select
            aria-label="Filtrar estado de donaciones"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {["registrada", "aprobada", "entregada", "rechazada"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        {!d.data && !d.error ? (
          <Loading />
        ) : !rows.length ? (
          <Empty>No hay aportes con estos filtros.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Aporte</th>
                  <th>Destino</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Seguimiento</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <b>
                        DA-{x.id} · {x.tipo}
                      </b>
                      <small>{x.descripcion}</small>
                      <small>{x.created_at?.slice(0, 10)}</small>
                    </td>
                    <td>
                      {x.orphanage_nombre}
                      <small>{user?.rol !== "donante" && x.donor_nombre}</small>
                    </td>
                    <td>{x.cantidad}</td>
                    <td>
                      <Badge value={x.estado} />
                    </td>
                    <td>
                      <button className="text-link" onClick={() => history(x)}>
                        <History size={15} />
                        Historial
                      </button>
                      {user?.rol !== "donante" &&
                        next[x.estado]?.map((estado) => (
                          <button
                            key={estado}
                            className={
                              "state-button " +
                              (estado === "rechazada" ? "danger" : "")
                            }
                            onClick={() => {
                              setPending({ id: x.id, estado });
                              setNote("");
                              setError("");
                            }}
                          >
                            {estado === "aprobada"
                              ? "Aprobar"
                              : estado === "entregada"
                                ? "Confirmar entrega"
                                : "Rechazar"}
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {pending && (
        <div className="modal-backdrop">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="card modal"
            onSubmit={change}
          >
            <h2 id="confirm-title">
              DA-{pending.id} → {pending.estado}
            </h2>
            <p>
              {pending.estado === "entregada"
                ? "Confirma únicamente cuando el aporte haya sido recibido físicamente."
                : "El cambio quedará registrado en el historial."}
            </p>
            <label className="field">
              <span>
                Observación{" "}
                {pending.estado === "rechazada"
                  ? "(obligatoria)"
                  : "(opcional)"}
              </span>
              <textarea
                autoFocus
                required={pending.estado === "rechazada"}
                maxLength="500"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <Notice>{error}</Notice>
            <div className="actions">
              <button disabled={busy} className="btn btn-primary">
                {busy ? "Guardando…" : "Confirmar cambio"}
              </button>
              <button
                disabled={busy}
                type="button"
                className="btn btn-outline"
                onClick={() => setPending(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      {detail && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            className="card modal"
          >
            <div className="section-head">
              <h2 id="history-title">Recorrido DA-{detail.id}</h2>
              <button
                autoFocus
                className="icon-btn"
                aria-label="Cerrar historial"
                onClick={() => setDetail(null)}
              >
                <X />
              </button>
            </div>
            <p>{detail.descripcion}</p>
            <Notice>{historyError}</Notice>
            {events ? (
              events.length ? (
                <ol className="timeline">
                  {events.map((x, i) => (
                    <li key={i}>
                      <Badge value={x.estado} />
                      <small>{x.created_at} UTC</small>
                      <p>{x.nota}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty>Registro anterior sin eventos de historial.</Empty>
              )
            ) : (
              !historyError && <Loading />
            )}
            {detail.image_url && <Photo url={detail.image_url} />}
          </section>
        </div>
      )}
    </div>
  );
}
