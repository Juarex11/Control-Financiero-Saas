import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, SkipForward, Clock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(str) {
  const d = new Date(str + "T12:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}

export default function ModalHistorial({ pago, onClose, onActualizado }) {
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actioning,setActioning]= useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/recurring-payments/${pago.id}/logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const marcar = async (logId, status) => {
    setActioning(logId);
    try {
      await fetch(`${API_URL}/recurring-payments/${pago.id}/mark`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ log_id: logId, status }),
      });
      await cargar();
      onActualizado();
    } finally { setActioning(null); }
  };

  const sym = getCurrencySymbol(pago.currency);

  const badgeStyle = (status) => {
    if (status === "paid")    return { background:"#dcfce7", color:"#16a34a", border:"1px solid #86efac" };
    if (status === "skipped") return { background:"#fef9c3", color:"#ca8a04", border:"1px solid #fde047" };
    return { background:"#eff6ff", color:"#2563eb", border:"1px solid #93c5fd" };
  };

  const badgeLabel = s => s === "paid" ? "Pagado" : s === "skipped" ? "Saltado" : "Pendiente";

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", width:"100%", maxWidth:520, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <p style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>{pago.name}</p>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.7rem", margin:0 }}>Historial de recordatorios</p>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={18} />
          </button>
        </div>

        {/* Info del pago */}
        <div style={{ padding:"0.75rem 1.5rem", background:"#f8fafc", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
          <div style={{ display:"flex", gap:"1.5rem", fontSize:"0.75rem", color:"#6b7280" }}>
            <span><b style={{ color:"#374151" }}>Monto:</b> {sym} {Number(pago.amount).toLocaleString("es-PE",{minimumFractionDigits:2})}</span>
            <span><b style={{ color:"#374151" }}>Cuenta:</b> {pago.account?.name}</span>
            <span><b style={{ color:"#374151" }}>Tipo:</b> {pago.type === "expense" ? "Gasto" : "Ingreso"}</span>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"3rem" }}>
              <div style={{ width:24, height:24, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"#9ca3af", fontSize:"0.875rem" }}>
              Sin registros aún.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1.5rem", borderBottom:"1px solid #f9fafb" }}>
                {/* Ícono estado */}
                <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  background: log.status === "paid" ? "#dcfce7" : log.status === "skipped" ? "#fef9c3" : "#eff6ff" }}>
                  {log.status === "paid"    ? <Check size={16} color="#16a34a" /> :
                   log.status === "skipped" ? <SkipForward size={16} color="#ca8a04" /> :
                   <Clock size={16} color="#2563eb" />}
                </div>

                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:"0.8rem", fontWeight:600, color:"#374151" }}>{formatDate(log.scheduled_date)}</p>
                  {log.note && <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af" }}>{log.note}</p>}
                </div>

                <span style={{ fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:2, ...badgeStyle(log.status) }}>
                  {badgeLabel(log.status)}
                </span>

                {/* Acciones solo en pendiente */}
                {log.status === "pending" && (
                  <div style={{ display:"flex", gap:"0.375rem" }}>
                    <button onClick={() => marcar(log.id, "paid")} disabled={actioning === log.id}
                      title="Marcar como pagado"
                      style={{ width:32, height:32, border:"2px solid #86efac", background:"#f0fdf4", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:2 }}>
                      {actioning === log.id ? <div style={{ width:12, height:12, border:"2px solid #16a34a", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
                        : <Check size={14} color="#16a34a" />}
                    </button>
                    <button onClick={() => marcar(log.id, "skipped")} disabled={actioning === log.id}
                      title="Saltar"
                      style={{ width:32, height:32, border:"2px solid #fde047", background:"#fefce8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:2 }}>
                      <SkipForward size={14} color="#ca8a04" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}