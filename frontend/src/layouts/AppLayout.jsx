import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AppLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#f7f7fb] overflow-hidden">
     <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />


      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen((s) => !s)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}