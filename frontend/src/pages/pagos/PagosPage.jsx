import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Pause, Play, History,
  Check, SkipForward, Bell, Calendar, RefreshCw,
  TrendingUp, TrendingDown, Tag, AlertCircle,
} from "lucide-react";
import ModalPago      from "./ModalPago";
import ModalHistorial from "./ModalHistorial";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE",{minimumFractionDigits:2})}`;
}
function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function diasRestantes(str) {
  if (!str) return null;
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const next = new Date(str + "T12:00:00"); next.setHours(0,0,0,0);
  return Math.round((next - hoy) / 86400000);
}

const FREQ_LABEL = {
  once: "Una vez", daily: "Diario", weekly: "Semanal",
  biweekly: "Cada 2 sem.", every4weeks: "Cada 4 sem.",
  monthly: "Mensual", bimonthly: "Cada 2 meses",
  quarterly: "Trimestral", semiannual: "Semestral",
};

// ── Tarjeta de pago con fondo de color ──────────────────────────────────────
function TarjetaPago({ pago, onEdit, onDelete, onToggle, onHistorial, onMark, deleting, toggling }) {
  const dias    = diasRestantes(pago.next_reminder_date);
  const vencido = dias !== null && dias <= 0;
  const urgente = dias !== null && dias <= 3 && dias > 0;
  const paused  = pago.status === "paused";

  // Color de fondo: usar el color de la categoría o uno por defecto
  const colorBase = pago.category?.color 
    || (pago.type === "income" ? "#10b981" : "#ef4444");

  const badgeDias = () => {
    if (paused)          return { label: "Pausado",  bg:"rgba(255,255,255,0.2)", color:"#fff" };
    if (dias === null)   return { label: "Una vez",  bg:"rgba(255,255,255,0.2)", color:"#fff" };
    if (vencido)         return { label: "Vencido",  bg:"rgba(255,255,255,0.3)", color:"#fff" };
    if (dias === 0)      return { label: "Hoy",      bg:"rgba(255,255,255,0.3)", color:"#fff" };
    if (urgente)         return { label: `${dias}d`, bg:"rgba(255,255,255,0.25)", color:"#fff" };
    return { label: `${dias}d`, bg:"rgba(255,255,255,0.2)", color:"#fff" };
  };
  const badge = badgeDias();

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colorBase} 0%, ${colorBase}dd 100%)`,
        borderRadius: "4px",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        opacity: paused ? 0.75 : 1,
        transition: "all .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
      }}
    >
      {/* Fila superior */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flex:1, minWidth:0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink:0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.2)",
          }}>
            {pago.type === "income"
              ? <TrendingUp size={18} style={{ color: "#fff" }} />
              : <TrendingDown size={18} style={{ color: "#fff" }} />}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:"0.9rem", color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {pago.name}
            </p>
            <p style={{ margin:0, fontSize:"0.7rem", color:"rgba(255,255,255,0.7)" }}>
              {pago.account?.name} · {FREQ_LABEL[pago.frequency] ?? pago.frequency}
            </p>
          </div>
        </div>
        {/* Badge días */}
        <span style={{
          fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.6rem", flexShrink:0,
          background: badge.bg, color: badge.color,
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "4px",
        }}>
          {badge.label}
        </span>
      </div>

      {/* Monto + próxima fecha */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"1.25rem", fontWeight:800, color:"#fff" }}>
          {pago.type === "income" ? "+" : "-"}{formatMoney(pago.amount, pago.currency)}
        </span>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:0, fontSize:"0.65rem", color:"rgba(255,255,255,0.6)" }}>Próx. recordatorio</p>
          <p style={{ margin:0, fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>{formatDate(pago.next_reminder_date)}</p>
        </div>
      </div>

      {/* Etiqueta + categoría */}
      {(pago.label || pago.category) && (
        <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
          {pago.category && (
            <span style={{
              fontSize:"0.65rem", fontWeight:600, padding:"0.15rem 0.5rem",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px",
            }}>
              {pago.category.name}
            </span>
          )}
          {pago.label && (
            <span style={{
              fontSize:"0.65rem", fontWeight:600, padding:"0.15rem 0.5rem",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
            }}>
              #{pago.label}
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div style={{
        display:"flex", gap:"0.375rem", paddingTop:"0.5rem",
        borderTop:"1px solid rgba(255,255,255,0.15)",
      }}>
        {/* Marcar pagado / saltado — solo si está pendiente y activo */}
        {!paused && dias !== null && (vencido || dias === 0) && (
          <>
            <button onClick={() => onMark(pago, "paid")}
              title="Marcar como pagado"
              style={{
                flex:1, height:32,
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                fontWeight:700, fontSize:"0.7rem",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.25rem",
                borderRadius: "4px",
              }}>
              <Check size={13} /> Pagado
            </button>
            <button onClick={() => onMark(pago, "skipped")}
              title="Saltar"
              style={{
                height:32, padding:"0 0.75rem",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight:700, fontSize:"0.7rem",
                cursor:"pointer", display:"flex", alignItems:"center", gap:"0.25rem",
                borderRadius: "4px",
              }}>
              <SkipForward size={13} /> Saltar
            </button>
          </>
        )}

        <div style={{ marginLeft:"auto", display:"flex", gap:"0.25rem" }}>
          <button onClick={() => onHistorial(pago)} title="Historial"
            style={{
              width:32, height:32,
              background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.15)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.7)",
              borderRadius: "4px",
            }}>
            <History size={14} />
          </button>
          <button onClick={() => onToggle(pago)} disabled={toggling === pago.id} title={paused ? "Reactivar" : "Pausar"}
            style={{
              width:32, height:32,
              background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.15)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: paused ? "#fff" : "rgba(255,255,255,0.7)",
              borderRadius: "4px",
            }}>
            {toggling === pago.id
              ? <div style={{ width:12, height:12, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
              : paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button onClick={() => onEdit(pago)} title="Editar"
            style={{
              width:32, height:32,
              background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.15)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.7)",
              borderRadius: "4px",
            }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(pago.id)} disabled={deleting === pago.id} title="Eliminar"
            style={{
              width:32, height:32,
              background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.15)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.7)",
              borderRadius: "4px",
            }}>
            {deleting === pago.id
              ? <div style={{ width:12, height:12, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
              : <Trash2 size={14} />}
          </button>
        </div>
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
        fetch(`${API_URL}/recurring-payments`,    { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/accounts`,              { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/reminder-categories`,   { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [dP, dA, dC] = await Promise.all([rP.json(), rA.json(), rC.json()]);
      setPagos(Array.isArray(dP)    ? dP : []);
      setAccounts(Array.isArray(dA) ? dA : []);
      setCategorias(Array.isArray(dC) ? dC : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/recurring-payments/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
    } finally { setDeleting(null); }
  };

  const handleToggle = async (pago) => {
    setToggling(pago.id);
    try {
      await fetch(`${API_URL}/recurring-payments/${pago.id}/toggle`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
    } finally { setToggling(null); }
  };

  const handleMark = async (pago, status) => {
    try {
      const res  = await fetch(`${API_URL}/recurring-payments/${pago.id}/logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const logs = await res.json();
      const pending = logs.find(l => l.status === "pending");
      if (!pending) return;
      await fetch(`${API_URL}/recurring-payments/${pago.id}/mark`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ log_id: pending.id, status }),
      });
      cargar();
    } catch {}
  };

  const pagosFiltrados = pagos.filter(p => {
    if (filtroTipo   !== "all" && p.type   !== filtroTipo)   return false;
    if (filtroStatus !== "all" && p.status !== filtroStatus) return false;
    return true;
  });

  const totalGastos   = pagos.filter(p => p.type === "expense" && p.status === "active").reduce((s, p) => s + Number(p.amount), 0);
  const totalIngresos = pagos.filter(p => p.type === "income"  && p.status === "active").reduce((s, p) => s + Number(p.amount), 0);
  const vencidos      = pagos.filter(p => p.status === "active" && diasRestantes(p.next_reminder_date) !== null && diasRestantes(p.next_reminder_date) <= 0).length;

  const btnFilter = (active) => ({
    padding:"0.4rem 1rem",
    fontSize:"0.75rem",
    fontWeight:600,
    cursor:"pointer",
    transition:"all .15s",
    background: active ? "#31138b" : "#fff",
    color:      active ? "#fff"    : "#6b7280",
    border:     active ? "2px solid #31138b" : "2px solid #e5e7eb",
    borderRadius: "4px",
  });

  return (
    <div style={{ padding:"1.5rem", minHeight:"100vh", background:"#f9fafb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Finanzas</p>
          <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#111827" }}>Pagos habituales</h1>
        </div>
        <button onClick={() => setModalNuevo(true)}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 1.25rem", background:"#31138b", color:"#fff", border:"none", fontWeight:700, fontSize:"0.875rem", cursor:"pointer", borderRadius:"4px" }}>
          <Plus size={16} /> Nuevo pago
        </button>
      </div>

      {/* Separador tricolor */}
      <div style={{ display:"flex", height:4, marginBottom:"1.5rem", overflow:"hidden", borderRadius:"2px" }}>
        <div style={{ flex:1, background:"#31138b" }} />
        <div style={{ flex:1, background:"#ff4d94" }} />
        <div style={{ flex:1, background:"#ffbf2f" }} />
      </div>

      {/* KPIs con fondo de color */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          {
            label: "Gastos activos/período",
            value: `- ${getCurrencySymbol("PEN")} ${totalGastos.toLocaleString("es-PE",{minimumFractionDigits:2})}`,
            color: "#ef4444",
            icon: TrendingDown,
          },
          {
            label: "Ingresos activos/período",
            value: `+ ${getCurrencySymbol("PEN")} ${totalIngresos.toLocaleString("es-PE",{minimumFractionDigits:2})}`,
            color: "#10b981",
            icon: TrendingUp,
          },
          {
            label: "Vencidos o por vencer hoy",
            value: `${vencidos} pago${vencidos !== 1 ? "s" : ""}`,
            color: vencidos > 0 ? "#f97316" : "#6b7280",
            icon: AlertCircle,
          },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              style={{
                background: `linear-gradient(135deg, ${k.color} 0%, ${k.color}dd 100%)`,
                borderRadius: "4px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={18} style={{ color: "#fff" }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:"0.65rem", fontWeight:600, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.03em" }}>
                  {k.label}
                </p>
                <p style={{ margin:0, fontSize:"1.1rem", fontWeight:800, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {k.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
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

      {/* Grid de tarjetas */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
          <div style={{ width:32, height:32, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
        </div>
      ) : pagosFiltrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", background:"#fff", border:"1px solid #f3f4f6", borderRadius:"4px" }}>
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

      {/* Modales */}
      {(modalNuevo || modalEditar) && (
        <ModalPago
          pago={modalEditar}
          accounts={accounts}
          categorias={categorias}
          onClose={() => { setModalNuevo(false); setModalEditar(null); }}
          onGuardado={() => { setModalNuevo(false); setModalEditar(null); cargar(); }}
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