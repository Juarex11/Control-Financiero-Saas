import { useState } from "react";
import { NavLink } from "react-router-dom";
// Línea 4 — agrega MessageSquare
import {
  LayoutDashboard, Users, Wallet, ChevronLeft, ChevronRight,
  BarChart2, RefreshCw, Tag, MessageSquare, Star, // ← aquí
} from "lucide-react";

const MENU_ADMIN = [
  { to: "/dashboard",     label: "Dashboard",    Icon: LayoutDashboard },
  { to: "/usuarios",      label: "Usuarios",     Icon: Users            },
  { to: "/cuentas",       label: "Cuentas",      Icon: Wallet           },
  { to: "/reportes",      label: "Reportes",     Icon: BarChart2        },
  { to: "/pagos",         label: "Pagos habit.", Icon: RefreshCw        },
  { to: "/recordatorios", label: "Recordat.",    Icon: Tag              },
  { to: "/admin/tickets", label: "Tickets",  Icon: MessageSquare },
  { to: "/admin/testimonios", label: "Testimonios",   Icon: Star }

,
];

const MENU_USER = [
  { to: "/dashboard",     label: "Dashboard",    Icon: LayoutDashboard },
  { to: "/cuentas",       label: "Cuentas",      Icon: Wallet           },
  { to: "/reportes",      label: "Reportes",     Icon: BarChart2        },
  { to: "/pagos",         label: "Pagos habit.", Icon: RefreshCw        },
  { to: "/recordatorios", label: "Recordat.",    Icon: Tag              },
  { to: "/tickets",       label: "Soporte",  Icon: MessageSquare },
{ to: "/testimonios",       label: "Mi testimonio", Icon: Star }

];

export default function Sidebar({ open, onClose, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const MENU = user?.role === "admin" ? MENU_ADMIN : MENU_USER;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-30
        shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transform transition-all duration-300 ease-in-out flex flex-col
        ${open ? "w-64 translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
        ${collapsed ? "lg:w-16" : "lg:w-64"}
      `}>
        {/* Logo */}
        <div className={`border-b border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-300 ${collapsed ? "px-3 py-4" : "px-6 py-6"}`}>
          {collapsed ? (
            <img src="/logo-icon.png" alt="CF" className="w-10 h-10 object-contain" draggable="false"
              onContextMenu={e => e.preventDefault()}
              onError={e => { e.target.style.width="54px"; e.target.style.height="54px"; e.target.src="/logo.png"; }} />
          ) : (
            <img src="/logo.png" alt="Control Financiero" className="w-56" draggable="false"
              onContextMenu={e => e.preventDefault()} />
          )}
        </div>

        {/* Nav */}
        <nav className="p-2 space-y-1 flex-1">
          {MENU.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm font-semibold transition
                ${collapsed ? "justify-center lg:px-2" : ""}
                ${isActive
                  ? "bg-[#31138b] text-white shadow-[0_2px_8px_rgba(49,19,139,0.25)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`
              }>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Colapsar */}
        <div className="hidden lg:block border-t border-gray-100 p-2">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[2px] text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition text-sm font-medium"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}>
            {collapsed ? <ChevronRight size={16} /> : (<><ChevronLeft size={16} /><span className="text-xs">Colapsar</span></>)}
          </button>
        </div>
      </aside>
    </>
  );
}