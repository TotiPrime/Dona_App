import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Package,
  ShieldCheck,
  HandHeart,
  PawPrint,
  BookOpen,
  HeartHandshake,
  Check,
} from "lucide-react";
import { useResource, Notice, Arrow } from "../components/UI";
export default function Home() {
  const needs = useResource("/needs"),
    orgs = useResource("/orphanages");
  const active = needs.data?.filter((n) => n.estado === "pendiente") || [];
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <span className="pill">
            <span className="dot" /> Solidaridad desde nuestra comunidad
          </span>
          <h1>
            Lo que compartes
            <br />
            puede cambiar
            <br />
            <em>una historia.</em>
          </h1>
          <p>
            Conectamos tus ganas de ayudar con las necesidades de organizaciones
            de infancia, protección animal y apoyo comunitario.
          </p>
          <div className="hero-actions">
            <Link to="/necesidades" className="btn btn-primary">
              Encuentra una causa
              <ArrowUpRight size={18} />
            </Link>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-link"
            >
              ¿Cómo funciona? <Arrow />
            </button>
          </div>
          <div className="hero-proof">
            <span className="mini-icon">
              <ShieldCheck size={22} />
            </span>
            <p>
              <b>Cada aporte tiene un recorrido.</b>
              <br />
              Registra, consulta y sigue su entrega.
            </p>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Ilustración de una caja solidaria"
        >
          <div className="art-grid" />
          <span className="art-label">PEQUEÑOS GESTOS. GRANDES CAMBIOS.</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="parcel">
            <HeartHandshake size={90} strokeWidth={1.2} />
            <b>
              HECHO CON
              <br />
              SOLIDARIDAD
            </b>
            <span className="parcel-tape" />
          </div>
          <div className="floating float-top">
            <span className="mini-icon">
              <PawPrint />
            </span>
            <div>
              <b>Más de una forma de ayudar</b>
              <small>Infancia · Animales · Comunidad</small>
            </div>
          </div>
          <div className="floating float-bottom">
            <span className="success-check">
              <Check size={18} />
            </span>
            <div>
              <b>Tu aporte, con seguimiento</b>
              <small>Desde el registro hasta la entrega</small>
            </div>
          </div>
          <span className="art-star">✳</span>
          <span className="art-number">01 / JUNTOS SUMAMOS</span>
        </div>
      </section>
      <section className="container metrics">
        <div>
          <strong>{orgs.data?.length ?? "—"}</strong>
          <span>organizaciones registradas</span>
        </div>
        <div>
          <strong>{needs.data ? active.length : "—"}</strong>
          <span>necesidades abiertas</span>
        </div>
        <div>
          <strong>3</strong>
          <span>etapas de seguimiento</span>
        </div>
        <p>
          Una comunidad.
          <br />
          <b>Muchas formas de sumar.</b>
        </p>
      </section>
      <section className="container section">
        <div className="section-head">
          <div>
            <span className="eyebrow">ENCUENTRA TU FORMA DE AYUDAR</span>
            <h2>Causas que nos unen</h2>
          </div>
          <Link to="/necesidades" className="text-link">
            Ver necesidades <Arrow />
          </Link>
        </div>
        <div className="cause-grid">
          {[
            [
              BookOpen,
              "Infancia",
              "Acompaña su crecimiento",
              "Ropa, útiles y oportunidades para seguir aprendiendo.",
              "peach",
            ],
            [
              PawPrint,
              "Animales",
              "Deja una huella bonita",
              "Alimentos e insumos para quienes cuidan de ellos.",
              "mint",
            ],
            [
              HandHeart,
              "Comunidad",
              "Multiplica la solidaridad",
              "Aportes que conectan a nuestra comunidad universitaria.",
              "lavender",
            ],
          ].map(([Icon, cat, title, desc, color]) => (
            <Link
              className={"cause-card " + color}
              to={"/necesidades?categoria=" + encodeURIComponent(cat)}
              key={cat}
            >
              <div className="cause-top">
                <span className="cause-icon">
                  <Icon size={28} />
                </span>
                <ArrowUpRight size={24} />
              </div>
              <span className="eyebrow">{cat}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
        <Notice>{needs.error || orgs.error}</Notice>
      </section>
      <section id="como-funciona" className="how-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">AYUDAR PUEDE SER SENCILLO</span>
              <h2>De tu intención a una entrega.</h2>
            </div>
            <p>
              Un proceso claro para acompañarte
              <br />
              en cada paso de tu donación.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Elige una necesidad",
                "Revisa qué se necesita, para quién y con qué prioridad.",
              ],
              [
                "02",
                "Registra tu aporte",
                "Indica el artículo, la cantidad y su estado.",
              ],
              [
                "03",
                "Sigue su recorrido",
                "Consulta la revisión y la confirmación de entrega en tu panel.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="step-number">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container closing">
        <div>
          <span className="eyebrow">TU AYUDA EMPIEZA AQUÍ</span>
          <h2>
            No hace falta mucho.
            <br />
            Hace falta empezar.
          </h2>
        </div>
        <Link to="/donar" className="btn btn-primary">
          Registrar mi aporte <ArrowUpRight size={19} />
        </Link>
      </section>
    </>
  );
}
