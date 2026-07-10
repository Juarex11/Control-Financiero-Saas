import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Pause, Play, History,
  Check, SkipForward, Bell, AlertTriangle,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
} from "lucide-react";
import ModalPago      from "./ModalPago";
import ModalHistorial from "./ModalHistorial";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getCurrencySymbol(code) {
  const map = {
    PEN: "S/", USD: "$", EUR: "€", ARS: "$", BOB: "Bs",
    CLP: "$", COP: "$", CRC: "₡", CUP: "$", GTQ: "Q",
    HNL: "L", MXN: "$", NIO: "C$", PYG: "₲", DOP: "RD$",
    UYU: "$U", VES: "Bs.S",
  };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE",{minimumFractionDigits:2})}`;
}
function formatDate(str) {
  if (!str) return "—";
  const soloFecha = str.split("T")[0];
  const d = new Date(soloFecha + "T12:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function formatHora(str) {
  if (!str) return "";
  const partes = str.split(":");
  const h = parseInt(partes[0], 10);
  const m = partes[1] ?? "00";
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// ── Helpers de zona horaria del usuario (no del navegador) ─────────────────
function getUserTimezone() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.timezone || "America/Lima";
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
function diasRestantes(str) {
  if (!str) return null;
  const soloFecha = str.split("T")[0];
  const tz     = getUserTimezone();
  const hoyStr = hoyEnTz(tz);
  const hoy    = new Date(hoyStr + "T12:00:00");
  const next   = new Date(soloFecha + "T12:00:00");
  return Math.round((next - hoy) / 86400000);
}

const FREQ_LABEL = {
  once: "Una vez", daily: "Diario", weekly: "Semanal",
  biweekly: "Cada 2 sem.", every4weeks: "Cada 4 sem.",
  monthly: "Mensual", bimonthly: "Cada 2 meses",
  quarterly: "Trimestral", semiannual: "Semestral",
};

// ── Badge de estado ──────────────────────────────────────────────────────────
function EstadoBadge({ paused, vencido, esHoy, dias, urgente, pendientesAcumulados }) {
  let config;

  if (paused) {
    config = { label: "Pausado", Icon: Pause, bg: "#1f2937", color: "#f3f4f6", border: "1px solid #374151" };
  } else if (vencido) {
    config = {
      label: pendientesAcumulados > 1 ? `Vencido ×${pendientesAcumulados}` : "Vencido",
      Icon: AlertTriangle, bg: "rgba(255,255,255,0.32)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
    };
  } else if (esHoy) {
    config = { label: "Hoy", Icon: Clock, bg: "rgba(255,255,255,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)" };
  } else if (dias === null) {
    config = { label: "—", Icon: null, bg: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
  } else if (urgente) {
    config = { label: `${dias}d`, Icon: Clock, bg: "rgba(255,255,255,0.25)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" };
  } else {
    config = { label: `${dias}d`, Icon: null, bg: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
  }

  const { label, Icon, bg, color, border } = config;

  return (
    <span style={{
      display: "flex", alignItems: "center", gap: "0.3rem",
      fontSize: paused ? "0.72rem" : "0.65rem",
      fontWeight: 700,
      padding: paused ? "0.35rem 0.7rem" : "0.25rem 0.6rem",
      flexShrink: 0,
      background: bg, color, border,
      borderRadius: "20px",
      boxShadow: paused ? "0 2px 6px rgba(0,0,0,0.25)" : "none",
    }}>
      {Icon && <Icon size={paused ? 13 : 11} />}
      {label}
    </span>
  );
}

// ── Tarjeta de pago ──────────────────────────────────────────────────────────
function TarjetaPago({ pago, onEdit, onDelete, onToggle, onHistorial, onMark, deleting, toggling }) {
  const dias    = diasRestantes(pago.next_reminder_date);
  const paused  = pago.status === "paused";

  const horaYaPaso = () => {
    if (!pago.reminder_time) return false;
    const tz = getUserTimezone();
    return pago.reminder_time.slice(0,5) <= horaActualEnTz(tz);
  };

  const pendientesAcumulados = pago.pending_count ?? 0;
  const hayPendiente = pendientesAcumulados > 0;

  const vencido = !paused && hayPendiente && dias !== null && (dias < 0 || (dias === 0 && horaYaPaso()));
  const esHoy   = !paused && hayPendiente && dias === 0 && !vencido;
  const urgente = !paused && dias !== null && dias > 0 && dias <= 3;

  const colorBase = pago.category?.color
    || (pago.type === "income" ? "#10b981" : "#ef4444");

  return (
    <div
      style={{
        background: paused
          ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
          : `linear-gradient(135deg, ${colorBase} 0%, ${colorBase}dd 100%)`,
        borderRadius: "14px",
        padding: "1.1rem 1.3rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        transition: "all .2s",
        boxShadow: vencido
          ? "0 4px 16px rgba(0,0,0,0.18), 0 0 0 2px rgba(255,255,255,0.45)"
          : "0 2px 10px rgba(0,0,0,0.10)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
      }}
    >
      {/* Fila superior */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flex:1, minWidth:0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink:0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.2)",
          }}>
            {pago.type === "income"
              ? <TrendingUp size={19} style={{ color: "#fff" }} />
              : <TrendingDown size={19} style={{ color: "#fff" }} />}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:"0.92rem", color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {pago.name}
            </p>
            <p style={{ margin:0, fontSize:"0.7rem", color:"rgba(255,255,255,0.7)" }}>
              {pago.account?.name} · {FREQ_LABEL[pago.frequency] ?? pago.frequency}
            </p>
          </div>
        </div>
        <EstadoBadge
          paused={paused} vencido={vencido} esHoy={esHoy}
          dias={dias} urgente={urgente} pendientesAcumulados={pendientesAcumulados}
        />
      </div>

      {/* Monto + próxima fecha */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"1.3rem", fontWeight:800, color:"#fff" }}>
          {pago.type === "income" ? "+" : "-"}{formatMoney(pago.amount, pago.currency)}
        </span>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:0, fontSize:"0.65rem", color:"rgba(255,255,255,0.6)" }}>Próx. recordatorio</p>
          <p style={{ margin:0, fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>
            {formatDate(pago.next_reminder_date)}
            {pago.reminder_time && (
              <span style={{ fontWeight:600, opacity:0.85 }}> · {formatHora(pago.reminder_time)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Etiqueta + categoría */}
      {(pago.label || pago.category || pendientesAcumulados > 1) && (
        <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
          {pago.category && (
            <span style={{
              fontSize:"0.65rem", fontWeight:600, padding:"0.2rem 0.6rem",
              background: "rgba(255,255,255,0.2)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)", borderRadius: "10px",
            }}>
              {pago.category.name}
            </span>
          )}
          {pago.label && (
            <span style={{
              fontSize:"0.65rem", fontWeight:600, padding:"0.2rem 0.6rem",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
            }}>
              #{pago.label}
            </span>
          )}
          {pendientesAcumulados > 1 && (
            <span style={{
              display:"flex", alignItems:"center", gap:"0.25rem",
              fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.6rem",
              background: "rgba(255,255,255,0.25)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px",
            }}>
              <Clock size={11} /> {pendientesAcumulados} pendientes
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display:"flex", gap:"0.375rem", paddingTop:"0.6rem", borderTop:"1px solid rgba(255,255,255,0.15)" }}>
        {!paused && (vencido || esHoy) && (
          <>
            <button onClick={() => onMark(pago, "paid")} title="Marcar como pagado"
              style={{
                flex:1, height:34, background: "rgba(255,255,255,0.22)",
                border: "1px solid rgba(255,255,255,0.32)", color: "#fff",
                fontWeight:700, fontSize:"0.72rem", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.3rem",
                borderRadius: "8px", transition: "background .15s",
              }}>
              <Check size={14} /> Pagado
            </button>
            <button onClick={() => onMark(pago, "skipped")} title="Saltar"
              style={{
                height:34, padding:"0 0.85rem", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)", color: "#fff",
                fontWeight:700, fontSize:"0.72rem", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.3rem",
                borderRadius: "8px",
              }}>
              <SkipForward size={14} /> Saltar
            </button>
          </>
        )}

        <div style={{ marginLeft:"auto", display:"flex", gap:"0.3rem" }}>
          <button onClick={() => onHistorial(pago)} title="Historial"
            style={{
              width:34, height:34, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.85)", borderRadius: "8px",
            }}>
            <History size={15} />
          </button>

          <button onClick={() => onToggle(pago)} disabled={toggling === pago.id} title={paused ? "Reactivar" : "Pausar"}
            style={{
              width:34, height:34,
              background: paused ? "#fbbf24" : "rgba(255,255,255,0.12)",
              border: paused ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.18)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: paused ? "#1f2937" : "rgba(255,255,255,0.85)",
              borderRadius: "8px",
              boxShadow: paused ? "0 0 0 3px rgba(251,191,36,0.3)" : "none",
              transition: "all .15s",
            }}>
            {toggling === pago.id
              ? <div style={{ width:13, height:13, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
              : paused ? <Play size={15} /> : <Pause size={15} />}
          </button>

          <button onClick={() => onEdit(pago)} title="Editar"
            style={{
              width:34, height:34, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.85)", borderRadius: "8px",
            }}>
            <Pencil size={15} />
          </button>

          <button onClick={() => onDelete(pago.id)} disabled={deleting === pago.id} title="Eliminar"
            style={{
              width:34, height:34, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.85)", borderRadius: "8px",
            }}>
            {deleting === pago.id
              ? <div style={{ width:13, height:13, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
              : <Trash2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI card reutilizable ─────────────────────────────────────────────────────
function KpiCard({ Icon, label, children, colorFrom, colorTo }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
      borderRadius: "14px", padding: "1.1rem 1.3rem",
      display: "flex", alignItems: "center", gap: "0.85rem",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)", color: "#fff",
    }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={20} style={{ color: "#fff" }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.04em" }}>
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PagosPage() {
  const [pagos,       setPagos]       = useState([]);
  const [accounts,    setAccounts]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtroTipo,  setFiltroTipo]  = useState("all");
  const [filtroStatus,setFiltroStatus]= useState("all");
  const [modalNuevo,  setModalNuevo]  = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalHist,   setModalHist]   = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [toggling,    setToggling]    = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rP, rA, rC] = await Promise.all([
        fetch(`${API_URL}/recurring-payments`,  { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/accounts`,            { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/reminder-categories`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [dP, dA, dC] = await Promise.all([rP.json(), rA.json(), rC.json()]);
      setPagos(Array.isArray(dP)    ? dP : []);
      setAccounts(Array.isArray(dA) ? dA : []);
      setCategorias(Array.isArray(dC) ? dC : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Refrescar cuando se confirma/edita un pago desde cualquier parte de la app
  // (campanita del header, sidebar, historial, u otro componente)
  useEffect(() => {
    window.addEventListener("recurring-payments-updated", cargar);
    return () => window.removeEventListener("recurring-payments-updated", cargar);
  }, [cargar]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/recurring-payments/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
      window.dispatchEvent(new Event("recurring-payments-updated"));
    } finally { setDeleting(null); }
  };

  const handleToggle = async (pago) => {
    setToggling(pago.id);
    try {
      await fetch(`${API_URL}/recurring-payments/${pago.id}/toggle`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
      window.dispatchEvent(new Event("recurring-payments-updated"));
    } finally { setToggling(null); }
  };

  // Confirma el pendiente MÁS ANTIGUO (orden cronológico: 01, 02, 03...)
  const handleMark = async (pago, status) => {
    try {
      const res  = await fetch(`${API_URL}/recurring-payments/${pago.id}/logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const logs = await res.json();
      const pendientes = (Array.isArray(logs) ? logs : [])
        .filter(l => l.status === "pending")
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
      const masAntiguo = pendientes[0];
      if (!masAntiguo) return;

      await fetch(`${API_URL}/recurring-payments/${pago.id}/mark`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ log_id: masAntiguo.id, status }),
      });
      cargar();
      window.dispatchEvent(new Event("recurring-payments-updated"));
    } catch {}
  };

  const pagosFiltrados = pagos.filter(p => {
    if (filtroTipo   !== "all" && p.type   !== filtroTipo)   return false;
    if (filtroStatus !== "all" && p.status !== filtroStatus) return false;
    return true;
  });

  const agruparPorMoneda = (lista) => {
    const grupos = {};
    lista.forEach(p => {
      const cur = p.currency || "PEN";
      grupos[cur] = (grupos[cur] || 0) + Number(p.amount);
    });
    return grupos;
  };

  const gastosPorMoneda   = agruparPorMoneda(pagos.filter(p => p.type === "expense" && p.status === "active"));
  const ingresosPorMoneda = agruparPorMoneda(pagos.filter(p => p.type === "income"  && p.status === "active"));
  const vencidos = pagos.filter(p => {
    if (p.status !== "active") return false;
    if ((p.pending_count ?? 0) === 0) return false;
    const d = diasRestantes(p.next_reminder_date);
    return d !== null && d <= 0;
  }).length;

  const btnFilter = (active) => ({
    padding:"0.45rem 1.1rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
    background: active ? "#31138b" : "#fff", color: active ? "#fff" : "#6b7280",
    border: active ? "1px solid #31138b" : "1px solid #e5e7eb", borderRadius: "9px",
  });

  return (
    <div style={{ padding:"1.5rem", minHeight:"100vh", background:"#f9fafb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Finanzas</p>
          <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#111827" }}>Entradas y Salidas habituales</h1>
        </div>
        <button onClick={() => setModalNuevo(true)}
          style={{
            display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.65rem 1.3rem",
            background:"#31138b", color:"#fff", border:"none", fontWeight:700, fontSize:"0.875rem",
            cursor:"pointer", borderRadius:"10px", boxShadow: "0 2px 8px rgba(49,19,139,0.25)",
          }}>
          <Plus size={17} /> Nuevo pago
        </button>
      </div>

      <div style={{ display:"flex", height:4, marginBottom:"1.5rem", overflow:"hidden", borderRadius:"2px" }}>
        <div style={{ flex:1, background:"#31138b" }} />
        <div style={{ flex:1, background:"#ff4d94" }} />
        <div style={{ flex:1, background:"#ffbf2f" }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        <KpiCard Icon={TrendingDown} label="Gastos activos/período" colorFrom="#ef4444" colorTo="#ef4444dd">
          {Object.keys(gastosPorMoneda).length === 0 ? (
            <p style={{ margin:0, fontSize:"1.1rem", fontWeight:800 }}>—</p>
          ) : (
            Object.entries(gastosPorMoneda).map(([cur, total]) => (
              <p key={cur} style={{ margin:0, fontSize:"1rem", fontWeight:800, whiteSpace:"nowrap" }}>
                - {getCurrencySymbol(cur)} {total.toLocaleString("es-PE",{minimumFractionDigits:2})}
              </p>
            ))
          )}
        </KpiCard>

        <KpiCard Icon={TrendingUp} label="Ingresos activos/período" colorFrom="#10b981" colorTo="#10b981dd">
          {Object.keys(ingresosPorMoneda).length === 0 ? (
            <p style={{ margin:0, fontSize:"1.1rem", fontWeight:800 }}>—</p>
          ) : (
            Object.entries(ingresosPorMoneda).map(([cur, total]) => (
              <p key={cur} style={{ margin:0, fontSize:"1rem", fontWeight:800, whiteSpace:"nowrap" }}>
                + {getCurrencySymbol(cur)} {total.toLocaleString("es-PE",{minimumFractionDigits:2})}
              </p>
            ))
          )}
        </KpiCard>

        <KpiCard
          Icon={AlertTriangle}
          label="Vencidos o por vencer hoy"
          colorFrom={vencidos > 0 ? "#f97316" : "#6b7280"}
          colorTo={vencidos > 0 ? "#f97316dd" : "#6b7280dd"}
        >
          <p style={{ margin:0, fontSize:"1.1rem", fontWeight:800, whiteSpace:"nowrap" }}>
            {vencidos} pago{vencidos !== 1 ? "s" : ""}
          </p>
        </KpiCard>
      </div>

      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:"0.25rem" }}>
          {[{key:"all",label:"Todos"},{key:"expense",label:"Gastos"},{key:"income",label:"Ingresos"}].map(f => (
            <button key={f.key} onClick={() => setFiltroTipo(f.key)} style={btnFilter(filtroTipo === f.key)}>{f.label}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:"0.25rem" }}>
          {[{key:"all",label:"Estado: todos"},{key:"active",label:"Activos"},{key:"paused",label:"Pausados"}].map(f => (
            <button key={f.key} onClick={() => setFiltroStatus(f.key)} style={btnFilter(filtroStatus === f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
          <div style={{ width:32, height:32, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
        </div>
      ) : pagosFiltrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", background:"#fff", border:"1px solid #f3f4f6", borderRadius:"14px" }}>
          <Bell size={48} color="#e5e7eb" style={{ margin:"0 auto 1rem" }} />
          <p style={{ color:"#9ca3af", fontSize:"0.875rem" }}>
            {pagos.length === 0 ? "Aún no tienes pagos habituales. ¡Crea el primero!" : "No hay pagos con estos filtros."}
          </p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
          {pagosFiltrados.map(pago => (
            <TarjetaPago key={pago.id} pago={pago}
              onEdit={p => setModalEditar(p)}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onHistorial={p => setModalHist(p)}
              onMark={handleMark}
              deleting={deleting}
              toggling={toggling} />
          ))}
        </div>
      )}

      {(modalNuevo || modalEditar) && (
        <ModalPago
          pago={modalEditar}
          accounts={accounts}
          categorias={categorias}
          onClose={() => { setModalNuevo(false); setModalEditar(null); }}
          onGuardado={() => {
            setModalNuevo(false);
            setModalEditar(null);
            cargar();
            window.dispatchEvent(new Event("recurring-payments-updated"));
          }}
        />
      )}
      {modalHist && (
        <ModalHistorial
          pago={modalHist}
          onClose={() => setModalHist(null)}
          onActualizado={cargar}
        />
      )}
    </div>
  );
}