import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, message } from "../api/api";
import {
  useResource,
  Notice,
  Loading,
  PageTitle,
  Field,
  Info,
  types,
} from "../components/UI";
export default function Donate() {
  const { user } = useAuth();
  const o = useResource("/orphanages"),
    n = useResource("/needs");
  const [params] = useSearchParams();
  const selected = n.data?.find(
    (x) => String(x.id) === params.get("necesidad"),
  );
  const [form, setForm] = useState({
    orphanage_id: "",
    tipo: "Ropa",
    descripcion: "",
    cantidad: 1,
    need_id: "",
  });
  const [touched, setTouched] = useState(false),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const fileRef = useRef();
  const f =
    !touched && selected
      ? {
          ...form,
          orphanage_id: selected.orphanage_id,
          tipo: selected.tipo,
          need_id: selected.id,
        }
      : form;
  function update(p) {
    setTouched(true);
    setForm({ ...f, ...p });
  }
  const available = (n.data || []).filter(
    (x) =>
      x.orphanage_id === Number(f.orphanage_id) &&
      x.tipo === f.tipo &&
      x.estado === "pendiente",
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (file && file.size > 5 * 1024 * 1024)
        throw new Error("La imagen supera 5 MB");
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => {
        if (v !== "") fd.append(k, v);
      });
      if (file) fd.append("imagen", file);
      setResult((await api.post("/donations", fd)).data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e.message === "La imagen supera 5 MB" ? e.message : message(e));
    } finally {
      setBusy(false);
    }
  }
  if (user?.rol === "orfanato")
    return (
      <div className="container page">
        <Info title="Cuenta de organización">
          Esta cuenta revisa aportes asignados. Para donar, utiliza una cuenta
          de donante.
        </Info>
        <Link to="/dashboard">Abrir mi panel</Link>
      </div>
    );
  if (result)
    return (
      <div className="container page">
        <div className="success-panel">
          <CheckCircle2 size={54} />
          <span className="eyebrow">GRACIAS POR SUMAR</span>
          <h1>Tu aporte ya tiene un recorrido.</h1>
          <p>
            Registro <b>DA-{result.id}</b> · Estado: registrada
          </p>
          <p>
            La organización revisará tu aporte. El registro no confirma una
            entrega ni realiza un pago.
          </p>
          <div className="actions">
            <Link to="/dashboard" className="btn btn-primary">
              Ver mi seguimiento ↗
            </Link>
            <button
              className="btn btn-outline"
              onClick={() => {
                setResult(null);
                update({ descripcion: "", cantidad: 1 });
              }}
            >
              Registrar otro aporte
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="container page">
      <PageTitle eyebrow="UN GESTO QUE SUMA" title="Registra tu aporte">
        Cuéntanos qué quieres compartir. Te acompañamos en el siguiente paso.
      </PageTitle>
      <Notice>{error || o.error || n.error}</Notice>
      {!o.data || !n.data ? (
        <Loading />
      ) : (
        <div className="donate-layout">
          <form className="card donate-form" onSubmit={submit}>
            <h3>
              <span className="number-dot">1</span>Elige el destino
            </h3>
            <Field label="Organización beneficiaria">
              <select
                required
                value={f.orphanage_id}
                onChange={(e) =>
                  update({ orphanage_id: e.target.value, need_id: "" })
                }
              >
                <option value="">Selecciona una organización</option>
                {o.data.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Tipo de aporte">
                <select
                  value={f.tipo}
                  onChange={(e) =>
                    update({ tipo: e.target.value, need_id: "" })
                  }
                >
                  {types.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Necesidad relacionada">
                <select
                  value={f.need_id}
                  onChange={(e) => update({ need_id: e.target.value })}
                >
                  <option value="">Aporte general</option>
                  {available.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.descripcion}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <h3>
              <span className="number-dot">2</span>Describe tu aporte
            </h3>
            <Field label="Artículo, unidad y estado">
              <textarea
                required
                maxLength="1000"
                rows="3"
                placeholder="Ej. 5 chamarras limpias, talla M, sin roturas."
                value={f.descripcion}
                onChange={(e) => update({ descripcion: e.target.value })}
              />
            </Field>
            <Field label="Cantidad (en la unidad solicitada)">
              <input
                required
                type="number"
                min="1"
                max="100000"
                step="1"
                value={f.cantidad}
                onChange={(e) => update({ cantidad: e.target.value })}
              />
            </Field>
            <Field label="Fotografía opcional · JPG, PNG o WebP · hasta 5 MB">
              <span className="upload">
                <Upload size={21} />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </span>
            </Field>
            <button disabled={busy} className="btn btn-primary full">
              {busy ? "Registrando…" : "Confirmar registro del aporte ↗"}
            </button>
            <p className="small muted">
              Se guardará en tu cuenta y estará disponible para revisión.
            </p>
          </form>
          <div>
            <Info title="¿Qué sucede después?">
              Coordinación revisa los datos, aprueba el aporte y confirma su
              recepción. Puedes consultar cada cambio en Mi panel. Coordina el
              punto y horario con el responsable de la organización.
            </Info>
            <div className="card side-note">
              <ShieldCheck size={26} />
              <h3>Ayuda con cuidado</h3>
              <p>
                Entrega artículos limpios y utilizables. No incluyas fotos de
                menores, documentos personales ni información bancaria.
              </p>
              <p className="small">
                Este avance gestiona aportes en especie. Las donaciones
                monetarias y los pagos QR quedan para una siguiente etapa.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
