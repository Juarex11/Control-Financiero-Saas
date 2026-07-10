import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }
import {
  LayoutDashboard, Users, Wallet, ChevronLeft, ChevronRight,
  BarChart2, RefreshCw, Tag, MessageSquare, Star, Megaphone,
  UserCircle, Target, CreditCard, Gem,
  TrendingUp, DollarSign, HelpCircle, FileText, Rocket,
  GitBranch, ShieldCheck, Calendar,
} from "lucide-react";

// ── Menú admin ────────────────────────────────────────────────────────────────
const MENU_ADMIN = [
  {
    grupo: null,
    items: [
      { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/perfil",    label: "Mi perfil", Icon: UserCircle       },
    ],
  },
  {
    grupo: "Gestión",
    items: [
      { to: "/usuarios",           label: "Usuarios",      Icon: Users        },
      { to: "/admin/tickets",      label: "Tickets",       Icon: MessageSquare },
      { to: "/admin/testimonios",  label: "Testimonios",   Icon: Star         },
      { to: "/admin/anuncios",     label: "Anuncios",      Icon: Megaphone    },
      { to: "/agenda", label: "Mi Agenda", Icon: Calendar },
    ],
  },
  {
    grupo: "Beneficios",
    items: [
      { to: "/membresia",        label: "Administrar membresía",   Icon: Gem        },
      { to: "/comisiones",       label: "Comisiones",     Icon: TrendingUp },
      { to: "/ganancias",        label: "Mis ganancias",  Icon: DollarSign },
    ],
  },
];

// ── Menú usuario ──────────────────────────────────────────────────────────────
const MENU_USER = [
  {
    grupo: null,
    items: [
      { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/perfil",    label: "Mi perfil", Icon: UserCircle       },
      { to: "/agenda", label: "Mi Agenda", Icon: Calendar },
    ],
  },
  {
    grupo: "Finanzas",
    items: [
      { to: "/cuentas",    label: "Cuentas",        Icon: Wallet    },
      { to: "/reportes",   label: "Reportes",       Icon: BarChart2 },
      { to: "/pagos",      label: "Movimientos habit.",  Icon: RefreshCw },
      { to: "/recordatorios", label: "Categorías de Movi.",   Icon: Tag       },
      { to: "/metas",      label: "Metas",          Icon: Target    },
      { to: "/deudas",     label: "Deudas",         Icon: CreditCard },
    ],
  },
  {
    grupo: "Comunidad",
    items: [
      { to: "/anuncios",    label: "Anuncios",       Icon: Megaphone    },
      { to: "/tickets",     label: "Soporte",        Icon: MessageSquare },
      { to: "/testimonios", label: "Mi testimonio",  Icon: Star         },
      { to: "/mi-equipo",   label: "Mi equipo",      Icon: Users        },
    ],
  },
  {
    grupo: "Beneficios",
    items: [
      { to: "/membresia",        label: "Mi membresía",   Icon: Gem        },
      { to: "/comisiones",       label: "Comisiones",     Icon: TrendingUp },
      { to: "/ganancias",        label: "Mis ganancias",  Icon: DollarSign },
      { to: "/plan-emprendedor", label: "Plan emprendedor", Icon: Rocket   },
    ],
  },
  {
    grupo: "Ayuda",
    items: [
      { to: "/ayuda",    label: "Centro de ayuda", Icon: HelpCircle },
      { to: "/terminos", label: "Términos",         Icon: FileText  },
    ],
  },
];

// ── Badge de pendientes/vencidos ────────────────────────────────────────────
function PagosBadge({ hoy, vencidos, collapsed }) {
  if (hoy === 0 && vencidos === 0) return null;

  if (collapsed) {
    // En modo colapsado: un solo puntito, rojo si hay vencidos, si no amarillo
    return (
      <span
        className="absolute top-1 right-1 w-2 h-2 rounded-full"
        style={{ background: vencidos > 0 ? "#ef4444" : "#f59e0b" }}
      />
    );
  }

  return (
    <span className="flex items-center gap-1 ml-auto shrink-0">
      {vencidos > 0 && (
        <span
          className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none"
          style={{ background: "#ef4444" }}
          title="Vencidos"
        >
          {vencidos}
        </span>
      )}
      {hoy > 0 && (
        <span
          className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none"
          style={{ background: "#f59e0b" }}
          title="Vence hoy"
        >
          {hoy}
        </span>
      )}
    </span>
  );
}

// ── Item de navegación ────────────────────────────────────────────────────────
function NavItem({ to, label, Icon, collapsed, onClose, badge }) {
  return (
    <NavLink
      to={to}
      onClick={() => { if (window.innerWidth < 1024) onClose(); }}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150
        ${collapsed ? "justify-center px-2" : ""}
        ${isActive
          ? "bg-[#31138b] text-white shadow-[0_2px_8px_rgba(49,19,139,0.25)]"
          : "text-gray-500 hover:bg-purple-50 hover:text-[#31138b]"
        }`
      }
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="whitespace-nowrap truncate">{label}</span>}
      {badge}
    </NavLink>
  );
}

// ── Separador de grupo ────────────────────────────────────────────────────────
function GrupoLabel({ label, collapsed }) {
  if (collapsed) {
    return <div className="my-2 mx-3 h-px bg-gray-100" />;
  }
  return (
    <div className="flex items-center gap-2 px-3 pt-4 pb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [pendHoy,      setPendHoy]      = useState(0);
  const [pendVencidos, setPendVencidos] = useState(0);
  const MENU = user?.role === "admin" ? MENU_ADMIN : MENU_USER;

const getUserTimezone = () => user?.timezone || "America/Lima";

  const hoyEnTz = (tz) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    return `${map.year}-${map.month}-${map.day}`;
  };

  const horaActualEnTz = (tz) => new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());

  const cargarPendientes = useCallback(async () => {
    if (user?.role === "admin") return; // solo aplica a usuarios normales
    try {
      const res  = await fetch(`${API_URL}/recurring-payments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const tz     = getUserTimezone();
      const hoyStr = hoyEnTz(tz);
      const horaActual = horaActualEnTz(tz);
      const hoy0   = new Date(hoyStr + "T12:00:00");

      let hoy = 0, vencidos = 0;

    data.forEach(p => {
        if (p.status !== "active" || !p.next_reminder_date) return;
        if ((p.pending_count ?? 0) === 0) return; // sin nada pendiente, no cuenta

        const soloFecha = p.next_reminder_date.split("T")[0];
        const fechaObj   = new Date(soloFecha + "T12:00:00");
        const dias       = Math.round((fechaObj - hoy0) / 86400000);

        if (dias < 0) {
          vencidos++;
        } else if (dias === 0) {
          const horaPaso = p.reminder_time && p.reminder_time.slice(0,5) <= horaActual;
          if (horaPaso) vencidos++;
          else hoy++;
        }
      });

      setPendHoy(hoy);
      setPendVencidos(vencidos);
    } catch {}
  }, [user?.role, user?.timezone]);
useEffect(() => {
    cargarPendientes();
    const interval = setInterval(cargarPendientes, 5 * 60 * 1000); // cada 5 min
    window.addEventListener("recurring-payments-updated", cargarPendientes);
    return () => {
      clearInterval(interval);
      window.removeEventListener("recurring-payments-updated", cargarPendientes);
    };
  }, [cargarPendientes]);

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-30
        shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transform transition-all duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
        ${collapsed ? "w-16 lg:w-16" : "w-64"}
      `}>

        {/* ── Logo más grande ── */}
        <div className={`
          shrink-0 border-b border-gray-100 flex items-center justify-center
          transition-all duration-300
          ${collapsed ? "px-2 py-5 h-24" : "px-6 py-5 h-28"}
        `}>
          {collapsed ? (
            <img
              src="/logo-icon.png"
              alt="CF"
              className="w-12 h-12 object-contain"
              draggable="false"
              onContextMenu={e => e.preventDefault()}
              onError={e => { e.target.src = "/logo.png"; e.target.className = "w-12 h-12 object-contain"; }}
            />
          ) : (
            <img
              src="/logo.png"
              alt="Control Financiero"
              className="w-56 h-16 object-contain"
              draggable="false"
              onContextMenu={e => e.preventDefault()}
              onError={e => { e.target.src = "/logo.png"; e.target.className = "w-56 h-16 object-contain"; }}
            />
          )}
        </div>

        {/* ── Nav con scroll custom ── */}
        <nav className={`
          flex-1 overflow-y-auto overflow-x-hidden py-2
          scrollbar-thin
        `}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#e9d5ff transparent",
          }}
        >
          {/* Estilo scrollbar webkit */}
          <style>{`
            aside nav::-webkit-scrollbar { width: 4px; }
            aside nav::-webkit-scrollbar-track { background: transparent; }
            aside nav::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 99px; }
            aside nav::-webkit-scrollbar-thumb:hover { background: #c4b5fd; }
          `}</style>

          <div className={`${collapsed ? "px-1.5 space-y-0.5" : "px-2 space-y-0.5"}`}>
            {MENU.map((seccion, si) => (
              <div key={si}>
                {/* Separador/grupo */}
                {seccion.grupo && (
                  <GrupoLabel label={seccion.grupo} collapsed={collapsed} />
                )}

                {/* Items */}
                {seccion.items.map(({ to, label, Icon }) => (
                  <NavItem
                    key={to}
                    to={to}
                    label={label}
                    Icon={Icon}
                    collapsed={collapsed}
                    onClose={onClose}
                    badge={
                      to === "/pagos"
                        ? <PagosBadge hoy={pendHoy} vencidos={pendVencidos} collapsed={collapsed} />
                        : null
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* ── Botón colapsar (solo desktop) ── */}
        <div className="shrink-0 hidden lg:block border-t border-gray-100 p-2">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-[#31138b] transition text-sm font-medium"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed
              ? <ChevronRight size={15} />
              : <><ChevronLeft size={15} /><span className="text-xs">Ocultar</span></>
            }
          </button>
        </div>

      </aside>
    </>
  );
}