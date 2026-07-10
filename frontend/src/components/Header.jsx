import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, ChevronDown, User, Settings, LogOut, Menu, Check, SkipForward, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ── Funciones auxiliares ──────────────────────────────────────────────────────
function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE",{minimumFractionDigits:2})}`;
}
function getUserTimezone(user) {
  return user?.timezone || "America/Lima";
}
function hoyEnTz(tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return `${map.year}-${map.month}-${map.day}`;
}
function horaActualEnTz(tz) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
}

// ✅ Agregamos la función que faltaba
function formatDate(str) {
  if (!str) return "—";
  const soloFecha = str.split("T")[0];
  const d = new Date(soloFecha + "T12:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Componente reloj ────────────────────────────────────────────────────────
function RelojUsuario({ timezone }) {
  const [hora, setHora] = useState("");

  useEffect(() => {
    if (!timezone) return;
    const actualizar = () => {
      try {
        const ahora = new Date().toLocaleTimeString("es-PE", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
        });
        setHora(ahora);
      } catch {
        setHora("");
      }
    };
    actualizar();
    const interval = setInterval(actualizar, 1000 * 30);
    return () => clearInterval(interval);
  }, [timezone]);

  if (!timezone || !hora) return null;

  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-white">{hora}</span>
      <span className="text-[9px] text-white/60 hidden sm:block">
        {timezone.replace("_", " ").split("/").pop()}
      </span>
    </div>
  );
}

// ─── Dropdown de notificaciones ──────────────────────────────────────────────
function NotificacionesDropdown({ user, onCountChange }) {
  const [open, setOpen] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/notifications/pending`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setPendientes(lista);
      onCountChange?.(lista.length);
    } catch {} finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5 * 60 * 1000); // cada 5 min
    window.addEventListener("recurring-payments-updated", cargar);
    return () => {
      clearInterval(interval);
      window.removeEventListener("recurring-payments-updated", cargar);
    };
  }, [cargar]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const marcar = async (log, status) => {
    setActioning(log.id);
    try {
      await fetch(`${API_URL}/recurring-payments/${log.recurring_payment_id}/mark`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ log_id: log.id, status }),
      });
      await cargar();
      window.dispatchEvent(new Event("recurring-payments-updated"));
    } finally { setActioning(null); }
  };

  const count = pendientes.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-bold text-gray-800">Recordatorios pendientes</p>
            <p className="text-xs text-gray-400">{count} por confirmar</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : count === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
                <Clock size={28} />
                <p className="text-xs text-gray-400">Sin pendientes por ahora</p>
              </div>
            ) : (
              pendientes.map(log => {
                const pago = log.recurring_payment;
                const tz = getUserTimezone(user);
                const hoyStr = hoyEnTz(tz);
                const fechaLog = log.scheduled_date?.split("T")[0];

                let estado; // "vencido" | "hoy"
                if (fechaLog < hoyStr) {
                  estado = "vencido";
                } else {
                  const horaPaso = pago?.reminder_time && pago.reminder_time.slice(0,5) <= horaActualEnTz(tz);
                  estado = horaPaso ? "vencido" : "hoy";
                }

                return (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: estado === "vencido" ? "#fef2f2" : "#fffbeb" }}>
                      <Clock size={16} className={estado === "vencido" ? "text-red-500" : "text-amber-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{pago?.name || "Sin nombre"}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        {formatDate(fechaLog)} · {formatMoney(pago?.amount, pago?.currency)}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${estado === "vencido" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                          {estado === "vencido" ? "Vencido" : "Vence hoy"}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => marcar(log, "paid")} disabled={actioning === log.id}
                        title="Confirmar"
                        className="w-7 h-7 flex items-center justify-center rounded border-2 border-green-200 bg-green-50 hover:bg-green-100 transition">
                        <Check size={13} className="text-green-600" />
                      </button>
                      <button onClick={() => marcar(log, "skipped")} disabled={actioning === log.id}
                        title="Saltar"
                        className="w-7 h-7 flex items-center justify-center rounded border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition">
                        <SkipForward size={13} className="text-yellow-600" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate("/pagos"); }}
            className="w-full py-2.5 text-xs font-bold text-[#31138b] hover:bg-purple-50 transition border-t border-gray-100"
          >
            Ver todos los pagos habituales
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Header principal ────────────────────────────────────────────────────────
export default function Header({ user = {}, onLogout, onToggleSidebar }) {
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
      {/* Lado izquierdo: menú hamburguesa + reloj */}
      <div className="flex items-center gap-3 text-white">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <RelojUsuario timezone={user?.timezone} />
      </div>

      {/* Lado derecho: notificaciones + perfil */}
      <div className="flex items-center gap-3">
        <NotificacionesDropdown user={user} />

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
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-white/70 capitalize leading-tight">
                {user?.role || "usuario"}
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
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#ff4d94]/10 to-white">
                <div className="flex items-center gap-3">
                  <ProfileImage size="w-10 h-10" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user?.role || "usuario"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePerfil}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ff4d94]/10 transition"
              >
                <User size={16} className="text-[#ff4d94]" />
                Perfil
              </button>

              <button
                onClick={handleConfiguracion}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-[#ff4d94]/10 transition"
              >
                <Settings size={16} className="text-[#ff4d94]" />
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