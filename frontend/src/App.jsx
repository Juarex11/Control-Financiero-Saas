import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout          from "./layouts/AppLayout";
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import DashboardAdminPage from "./pages/DashboardAdminPage";
import DashboardUserPage  from "./pages/DashboardUserPage";
import UsuariosPage       from "./pages/admin/UsuariosPage";
import OrganigramaPage    from "./pages/admin/OrganigramaPage";
import CuentasPage        from "./pages/CuentasPage";
import Onboarding         from "./pages/Onboarding";

const API_URL = import.meta.env.VITE_API_URL;

// ── Rutas públicas con navegación ─────────────────────────────────────────────
function PublicRoutes({ onLogin }) {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage    onLogin={onLogin} onGoRegister={() => navigate("/register")} />} />
      <Route path="/register" element={<RegisterPage onLogin={onLogin} onGoLogin={()    => navigate("/login")}    />} />
      <Route path="*"         element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { setLoading(false); return; }

    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(fresh => {
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

  const handleLogin = async (token, userData) => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fresh = await res.json();
        localStorage.setItem("token", token);
        localStorage.setItem("user",  JSON.stringify(fresh));
        setUser(fresh);
        return;
      }
    } catch {}
    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleOnboardingComplete = async () => {
    try {
      await fetch(`${API_URL}/onboarding/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Sin sesion */}
      {!user ? (
        <PublicRoutes onLogin={handleLogin} />

      ) : !user.onboarding_done ? (
        /* Con sesion pero onboarding pendiente */
        <Routes>
          <Route
            path="*"
            element={
              <div className="h-screen bg-[#f7f7fb] flex items-start justify-center">
                <Onboarding onComplete={handleOnboardingComplete} />
              </div>
            }
          />
        </Routes>

      ) : (
        /* Con sesion y onboarding completo */
        <Routes>
          <Route element={<AppLayout user={user} onLogout={handleLogout} onUserUpdate={setUser} />}>
            <Route
              path="/dashboard"
              element={user.role === "admin" ? <DashboardAdminPage /> : <DashboardUserPage />}
            />
            <Route path="/cuentas"     element={<CuentasPage />} />
            <Route path="/usuarios"    element={user.role === "admin" ? <UsuariosPage />    : <Navigate to="/dashboard" />} />
            <Route path="/organigrama" element={user.role === "admin" ? <OrganigramaPage /> : <Navigate to="/dashboard" />} />
            <Route path="/"            element={<Navigate to="/dashboard" />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;