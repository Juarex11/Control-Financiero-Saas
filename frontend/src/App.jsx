import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Layouts
import AppLayout from "./layouts/AppLayout";

// Páginas públicas
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Páginas de usuario
import DashboardUserPage from "./pages/DashboardUserPage";
import CuentasPage from "./pages/CuentasPage";
import ReportesPage from "./pages/ReportesPage";
import PagosPage from "./pages/pagos/PagosPage";
import RecordatoriosPage from "./pages/recordatorios/RecordatoriosPage";
import TicketsUserPage from "./pages/tickets/TicketsUserPage";
import TicketChatPage from "./pages/tickets/TicketChatPage";
import TestimoniosUserPage from "./pages/testimonios/TestimoniosUserPage";
import TestimoniosPublicPage from "./pages/testimonios/TestimoniosPublicPage";
import AnunciosPage from "./pages/AnunciosPage";
import MiEquipoPage from "./pages/MiEquipoPage";
import MiPerfilPage from "./pages/MiPerfilPage";
import AgendaPage from "./pages/AgendaPage";

// Páginas de administrador
import DashboardAdminPage from "./pages/DashboardAdminPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import OrganigramaPage from "./pages/admin/OrganigramaPage";
import TicketsAdminPage from "./pages/tickets/TicketsAdminPage";
import TestimoniosAdminPage from "./pages/testimonios/TestimoniosAdminPage";
import AdminAnunciosPage from "./pages/admin/AdminAnunciosPage";

// Onboarding
import Onboarding from "./pages/Onboarding";

// En construcción
import EnConstruccionPage from "./pages/EnConstruccionPage";

const API_URL = import.meta.env.VITE_API_URL;

// ── Rutas públicas con navegación ─────────────────────────────────────────────
function PublicRoutes({ onLogin }) {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage onLogin={onLogin} onGoRegister={() => navigate("/register")} />}
      />
      <Route
        path="/register"
        element={<RegisterPage onLogin={onLogin} onGoLogin={() => navigate("/login")} />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh) => {
        if (fresh) {
          localStorage.setItem("user", JSON.stringify(fresh));
          setUser(fresh);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      })
      .catch(() => setUser(JSON.parse(userData)))
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogin = async (token, userData) => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fresh = await res.json();
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
        return;
      }
    } catch {}
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleOnboardingComplete = async (data) => {
    try {
      await fetch(`${API_URL}/onboarding/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  pais: data?.pais ?? null,
  actividad: data?.actividad ?? null,
  monto: data?.monto ?? null,
  metas: data?.metas ?? [],
  deudas: data?.deudas ?? null,
  num_deudas: data?.num_deudas ?? null,
  finalidad: data?.finalidad ?? null,
}),
      });
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const fresh = await res.json();
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      }
    } catch (err) {
      console.error("Error al completar onboarding:", err);
    }
  };

  // ── Loader ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Router ──────────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      {/* Sin sesión */}
      {!user ? (
        <PublicRoutes onLogin={handleLogin} />
      ) : !user.onboarding_done ? (
        /* Onboarding pendiente */
        <Routes>
          <Route
            path="*"
            element={
            <div className="min-h-screen bg-[#f7f7fb] flex items-center justify-center p-4">
  <Onboarding onComplete={handleOnboardingComplete} />
</div>
            }
          />
        </Routes>
      ) : (
        /* Sesión activa + onboarding completo */
        <Routes>
          <Route
            element={<AppLayout user={user} onLogout={handleLogout} onUserUpdate={setUser} />}
          >
            {/* ── Dashboard ── */}
            <Route
              path="/dashboard"
              element={
                user.role === "admin" ? <DashboardAdminPage /> : <DashboardUserPage />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* ── Módulos comunes (usuario y admin) ── */}
            <Route path="/cuentas" element={<CuentasPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/pagos" element={<PagosPage />} />
            <Route path="/recordatorios" element={<RecordatoriosPage />} />
            <Route path="/tickets" element={<TicketsUserPage />} />
            <Route path="/tickets/:id/chat" element={<TicketChatPage />} />
            <Route path="/testimonios" element={<TestimoniosPublicPage />} />
            <Route path="/testimonios/mi-testimonio" element={<TestimoniosUserPage />} />
            <Route path="/anuncios" element={<AnunciosPage />} />
            <Route path="/mi-equipo" element={<MiEquipoPage />} />
            <Route path="/perfil" element={<MiPerfilPage onUserUpdate={setUser} />} />

            {/* ── Agenda ── */}
            <Route path="/agenda" element={<AgendaPage />} />

            {/* ── Módulos solo administrador ── */}
            <Route
              path="/usuarios"
              element={user.role === "admin" ? <UsuariosPage /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/organigrama"
              element={
                user.role === "admin" ? <OrganigramaPage /> : <Navigate to="/dashboard" />
              }
            />
            <Route
              path="/admin/tickets"
              element={
                user.role === "admin" ? <TicketsAdminPage /> : <Navigate to="/dashboard" />
              }
            />
            <Route
              path="/admin/testimonios"
              element={
                user.role === "admin" ? <TestimoniosAdminPage /> : <Navigate to="/dashboard" />
              }
            />
            <Route
              path="/admin/anuncios"
              element={
                user.role === "admin" ? <AdminAnunciosPage /> : <Navigate to="/dashboard" />
              }
            />

            {/* ── En construcción (accesibles para todos) ── */}
            <Route path="/metas" element={<EnConstruccionPage />} />
            <Route path="/deudas" element={<EnConstruccionPage />} />
            <Route path="/configurar-pagos" element={<EnConstruccionPage />} />
            <Route path="/membresia" element={<EnConstruccionPage />} />
            <Route path="/comisiones" element={<EnConstruccionPage />} />
            <Route path="/ganancias" element={<EnConstruccionPage />} />
            <Route path="/plan-emprendedor" element={<EnConstruccionPage />} />
            <Route path="/ayuda" element={<EnConstruccionPage />} />
            <Route path="/terminos" element={<EnConstruccionPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;