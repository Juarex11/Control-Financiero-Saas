import { useState, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header  from "../components/Header";
import Footer  from "../components/Footer";

// ── Hook reutilizable para páginas hijas ────────────────────────────────────
export function useAppContext() {
  return useOutletContext();
}

export default function AppLayout({ user, onLogout, onUserUpdate }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#f7f7fb] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(s => !s)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ onUserUpdate }} />
        </main>
        <Footer />  {/* ← fuera del main, dentro del flex col */}
      </div>
    </div>
  );
}