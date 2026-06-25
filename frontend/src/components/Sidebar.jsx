import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users } from "lucide-react";

const MENU_ADMIN = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/usuarios",  label: "Usuarios",  Icon: Users            },
];

const MENU_USER = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
];

export default function Sidebar({ open, onClose, user }) {
  const MENU = user?.role === "admin" ? MENU_ADMIN : MENU_USER;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-30
        shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transform transition-transform duration-300 ease-in-out flex flex-col w-64
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="border-b border-gray-100 flex items-center justify-center px-6 py-6">
          <img src="/logo.png" alt="Control Financiero" className="w-48"
            draggable="false" onContextMenu={e => e.preventDefault()} />
        </div>

        <nav className="p-2 space-y-1 flex-1">
          {MENU.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm font-semibold transition
                ${isActive
                  ? "bg-[#31138b] text-white shadow-[0_2px_8px_rgba(49,19,139,0.25)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`
              }>
              <Icon size={18} className="shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}