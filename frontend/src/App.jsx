import {
  HashRouter as BrowserRouter,
  Route,
  Routes,
  Link,
} from "react-router-dom";
import { browserMode } from "./api/api";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orphanages from "./pages/Orphanages";
import Needs from "./pages/Needs";
import Donate from "./pages/Donate";
import Dashboard from "./pages/Dashboard";
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <button
          type="button"
          onClick={() => {
            document.getElementById("contenido")?.focus();
            document.getElementById("contenido")?.scrollIntoView();
          }}
          className="skip-link"
        >
          Saltar al contenido
        </button>
        <Navbar />
        {browserMode && (
          <div className="browser-notice" role="note">
            Demostración local: los datos se guardan en este navegador y no se
            comparten con otros dispositivos.
          </div>
        )}
        <main id="contenido" tabIndex="-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/orfanatos" element={<Orphanages />} />
            <Route path="/necesidades" element={<Needs />} />
            <Route
              path="/donar"
              element={
                <ProtectedRoute>
                  <Donate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Página no encontrada</h1>
                  <Link to="/">Volver al inicio</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container footer-inner">
            <div>
              <b>DonaApp</b>
              <p>Solidaridad que conecta.</p>
            </div>
            <p>
              Propuesta académica para Fundación Unifranz.
              <br />
              Los registros iniciales son ficticios. Sin afiliación
              institucional confirmada.
            </p>
            <Link to="/necesidades">Encuentra una causa ↗</Link>
          </div>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  );
}
