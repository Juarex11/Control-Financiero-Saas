import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users } from "lucide-react";

const MENU = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/usuarios",  label: "Usuarios",  Icon: Users            },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-30
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-purple-600">Control Financiero</h2>
        </div>

        <nav className="p-4 space-y-1">
          {MENU.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition
                ${isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}