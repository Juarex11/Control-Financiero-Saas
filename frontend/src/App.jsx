import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage     from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout     from "./layouts/AppLayout";
import { logout }    from "./api/auth";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user,  setUser]  = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const handleLogin = (t, u) => {
    setToken(t);
    setUser(u);
  };

  const handleLogout = async () => {
    await logout(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {!token ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="*"      element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<AppLayout user={user} onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<DashboardPage user={user} />} />
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}