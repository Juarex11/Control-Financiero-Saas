import { useState, useRef, useEffect } from "react";
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";

export default function Header({ user, onMenuClick, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Construir la URL de la foto
  const getUserPhoto = () => {
    if (!user?.photo) return null;
    
    // Si ya es una URL completa
    if (user.photo.startsWith("http")) {
      return user.photo;
    }
    
    // Construir URL desde la ruta relativa
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const baseUrl = apiUrl.replace("/api", "");
    
    return `${baseUrl}/storage/${user.photo}`;
  };

  const userPhoto = getUserPhoto();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Componente de imagen de perfil reutilizable
  const ProfileImage = ({ size = "w-8 h-8" }) => (
    <img
      src={userPhoto || "/perfil.png"}
      alt={user?.name || "Usuario"}
      className={`${size} rounded-full object-cover border-2 border-gray-100`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/perfil.png";
      }}
    />
  );

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shadow-sm">
      {/* Botón menú */}
      <button
        onClick={onMenuClick}
        className="w-9 h-9 flex items-center justify-center rounded-[2px] text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3">
        {/* Notificación */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-[2px] text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Dropdown del usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-[2px] hover:bg-gray-50 transition group"
          >
            <div className="relative">
              <ProfileImage size="w-8 h-8" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-gray-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú desplegable */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-[2px] shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ProfileImage size="w-10 h-10" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <User size={16} className="text-gray-400" />
                Perfil
              </button>

              <button
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <Settings size={16} className="text-gray-400" />
                Configuración
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-medium"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}