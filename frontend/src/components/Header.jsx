import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, User, Settings, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ user, onLogout, onToggleSidebar }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getUserPhoto = () => {
    if (!user?.photo) return null;
    if (user.photo.startsWith("http")) return user.photo;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    let baseUrl = "";
    try {
      const url = new URL(apiUrl);
      baseUrl = url.origin;
    } catch {
      baseUrl = apiUrl.replace(/\/api\/?$/, "");
    }
    return `${baseUrl}/storage/${user.photo}`;
  };

  const userPhoto = getUserPhoto();

  const handlePerfil = () => {
    setDropdownOpen(false);
    navigate("/perfil");
  };

  const handleConfiguracion = () => {
    setDropdownOpen(false);
    navigate("/configuracion");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ProfileImage = ({ size = "w-8 h-8" }) => (
    <img
      src={userPhoto || "/perfil.png"}
      alt={user?.name || "Usuario"}
      className={`${size} rounded-full object-cover border-2 border-white/30`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/perfil.png";
      }}
    />
  );

  return (
    <header
      className="h-14 flex items-center justify-between px-4 shadow-md"
      style={{
        background: "linear-gradient(135deg, #31138b 77%, #ff4d94 60%)",
      }}
    >
      {/* Botón hamburguesa — solo móvil */}
      <div className="flex items-center gap-2 text-white">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition">
          <Bell size={18} />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Dropdown de usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/20 transition group"
          >
            <div className="relative">
              <ProfileImage size="w-8 h-8" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#ff4d94]"></span>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-white/70 capitalize leading-tight">
                {user?.role}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`hidden sm:block text-white/80 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
              {/* Cabecera del perfil */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#ff4d94]/10 to-white">
                <div className="flex items-center gap-3">
                  <ProfileImage size="w-10 h-10" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón Perfil */}
             <button
  onClick={handlePerfil}
  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ff4d94]/10 transition"
>
  <User size={16} className="text-[#ff4d94]" />
  Perfil
</button>

              {/* Botón Configuración */}
              <button
                onClick={handleConfiguracion}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ff4d94]/10 transition"
              >
                <Settings size={16} className="text-[#ff4d94]" />
                Configuración
              </button>

              {/* Cerrar sesión */}
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