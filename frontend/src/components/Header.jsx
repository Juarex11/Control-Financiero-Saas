import { Menu, LogOut } from "lucide-react";

export default function Header({ user, onMenuClick, onLogout }) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shadow-sm">
      <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-800">
        <Menu size={22} />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition font-semibold">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </header>
  );
}