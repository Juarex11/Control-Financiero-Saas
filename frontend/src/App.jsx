import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout      from "./layouts/AppLayout";
import LoginPage      from "./pages/LoginPage";
import RegisterPage   from "./pages/RegisterPage";
import DashboardPage  from "./pages/DashboardPage";
import UsuariosPage   from "./pages/admin/UsuariosPage";
import OrganigramaPage from "./pages/admin/OrganigramaPage";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        // Refrescar datos del usuario al cargar la app
        fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(fresh => {
            if (fresh) {
              localStorage.setItem("user", JSON.stringify(fresh));
              setUser(fresh);
            } else {
              // Token inválido
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          })
          .catch(() => {
            // Sin conexión, usar datos guardados
            setUser(JSON.parse(userData));
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (token, userData) => {
    try {
      // Obtener datos frescos con photo_url
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
    // Fallback
    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login"    element={<LoginPage    onLogin={handleLogin} onGoRegister={() => {}} />} />
            <Route path="/register" element={<RegisterPage onLogin={handleLogin} onGoLogin={() => {}}    />} />
            <Route path="*"         element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route element={<AppLayout user={user} onLogout={handleLogout} />}>
              <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/usuarios" element={
  user?.role === "admin" ? <UsuariosPage /> : <Navigate to="/dashboard" />
} />
<Route path="/organigrama" element={
  user?.role === "admin" ? <OrganigramaPage /> : <Navigate to="/dashboard" />
} />
              <Route path="/"            element={<Navigate to="/dashboard" />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;