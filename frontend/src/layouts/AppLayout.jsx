import { useState, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ── Hook reutilizable para páginas hijas ────────────────────────────────────
export function useAppContext() {
  return useOutletContext();
}

export default function AppLayout({ user, onLogout, onUserUpdate }) {
  // Estado del sidebar: abierto por defecto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // ── Cerrar/abrir según tamaño de pantalla ──
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Alternar sidebar (para móvil) ──
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // ── Cerrar sidebar (para móvil) ──
  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f7f7fb] overflow-hidden">
      {/* Sidebar con control de apertura/cierre */}
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header recibe toggleSidebar para el botón hamburguesa */}
        <Header
          user={user}
          onToggleSidebar={toggleSidebar}  // 👈 cambia onMenuClick por onToggleSidebar
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ onUserUpdate }} />
        </main>
        <Footer />
      </div>
    </div>
  );
}