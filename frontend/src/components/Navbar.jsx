import { NavLink, Link, useNavigate } from "react-router-dom";
import { HeartHandshake, LogOut, Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div className="topline">
        PROYECTO INTEGRADOR <span>·</span> Comunidad universitaria de Cochabamba
      </div>
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark">
              <HeartHandshake size={25} />
            </span>
            <span>
              Dona<span className="brand-color">App</span>
              <small>CONEXIONES QUE TRANSFORMAN</small>
            </span>
          </Link>
          <button
            className="menu-btn"
            aria-label="Abrir navegación"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={open ? "links open" : "links"}
            aria-label="Navegación principal"
            onClick={() => setOpen(false)}
          >
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/necesidades">Necesidades</NavLink>
            <NavLink to="/orfanatos">Organizaciones</NavLink>
            {user && <NavLink to="/dashboard">Mi panel</NavLink>}
            <NavLink className="btn btn-dark" to={user ? "/donar" : "/login"}>
              {user ? "Quiero donar" : "Ingresar"}
              <ArrowUpRight size={16} />
            </NavLink>
            {user && (
              <button
                className="icon-btn"
                aria-label="Cerrar sesión"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={19} />
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
