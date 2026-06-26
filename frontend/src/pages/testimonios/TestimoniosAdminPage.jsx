import { useState, useEffect, useCallback } from "react";
import {
  Star, Check, X, Trash2, RefreshCw,
  MessageSquare, Clock, CheckCircle, XCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const ESTADO = {
  pendiente: { label: "Pendiente", bg: "#fef9c3", color: "#ca8a04", Icon: Clock       },
  aprobado:  { label: "Aprobado",  bg: "#f0fdf4", color: "#16a34a", Icon: CheckCircle },
  rechazado: { label: "Rechazado", bg: "#fef2f2", color: "#dc2626", Icon: XCircle     },
};

function Badge({ estado }) {
  const e = ESTADO[estado] ?? ESTADO.pendiente;
  const Icon = e.Icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem", fontSize:"0.65rem", fontWeight:700,
      padding:"0.2rem 0.6rem", background:e.bg, color:e.color, border:`1.5px solid ${e.color}40`, borderRadius:2 }}>
      <Icon size={11} strokeWidth={2.5} /> {e.label}
    </span>
  );
}

function Estrellas({ value }) {
  return (
    <div style={{ display:"flex", gap:"0.15rem" }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={13} strokeWidth={1.5}
          fill={value >= n ? "#ffbf2f" : "none"}
          color={value >= n ? "#ffbf2f" : "#d1d5db"} />
      ))}
    </div>
  );
}

function TarjetaTestimonio({ t, onEstado, onDestacado, onEliminar, loading }) {
  const borderColor = t.estado === "pendiente" ? "#fde047" : t.estado === "aprobado" ? "#bbf7d0" : "#fca5a5";

  return (
    <div style={{ background:"#fff", border:`1.5px solid ${borderColor}`, padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.875rem" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.75rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", minWidth:0 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, overflow:"hidden",
            background: t.foto ? "transparent" : "#31138b",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {t.foto
              ? <img src={t.foto} alt={t.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <span style={{ color:"#fff", fontWeight:800, fontSize:"0.9rem" }}>{t.nombre?.[0]?.toUpperCase()}</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:"0.875rem", color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.nombre}</p>
            <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af" }}>{t.email}</p>
            {t.cargo_empresa && <p style={{ margin:0, fontSize:"0.7rem", color:"#6b7280" }}>{t.cargo_empresa}</p>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.25rem", flexShrink:0 }}>
          <Badge estado={t.estado} />
          {t.destacado && (
            <span style={{ fontSize:"0.6rem", fontWeight:700, color:"#ca8a04" }}>⭐ Destacado</span>
          )}
        </div>
      </div>

      {/* Estrellas + fecha */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Estrellas value={Number(t.estrellas)} />
        <span style={{ fontSize:"0.65rem", color:"#9ca3af" }}>{t.created_at}</span>
      </div>

      {/* Contenido */}
      <p style={{ margin:0, fontSize:"0.875rem", color:"#374151", lineHeight:1.65, fontStyle:"italic",
        borderLeft:"3px solid #31138b", paddingLeft:"0.875rem", background:"#f8fafc", padding:"0.75rem 0.75rem 0.75rem 1rem" }}>
        "{t.contenido}"
      </p>

      {/* Acciones */}
      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", paddingTop:"0.625rem", borderTop:"1px solid #f3f4f6" }}>
        {t.estado !== "aprobado" && (
          <button onClick={() => onEstado(t.id, "aprobado")} disabled={loading === t.id}
            style={{ display:"flex", alignItems:"center", gap:"0.375rem", height:32, padding:"0 0.875rem", background:"#f0fdf4", color:"#16a34a", fontWeight:700, fontSize:"0.75rem", border:"1px solid #86efac", cursor:"pointer", opacity: loading===t.id?.5:1 }}>
            <Check size={13} /> Aprobar
          </button>
        )}
        {t.estado !== "rechazado" && (
          <button onClick={() => onEstado(t.id, "rechazado")} disabled={loading === t.id}
            style={{ display:"flex", alignItems:"center", gap:"0.375rem", height:32, padding:"0 0.875rem", background:"#fef2f2", color:"#dc2626", fontWeight:700, fontSize:"0.75rem", border:"1px solid #fca5a5", cursor:"pointer", opacity: loading===t.id?.5:1 }}>
            <X size={13} /> Rechazar
          </button>
        )}
        {t.estado !== "pendiente" && (
          <button onClick={() => onEstado(t.id, "pendiente")} disabled={loading === t.id}
            style={{ display:"flex", alignItems:"center", gap:"0.375rem", height:32, padding:"0 0.875rem", background:"#fef9c3", color:"#ca8a04", fontWeight:700, fontSize:"0.75rem", border:"1px solid #fde047", cursor:"pointer", opacity: loading===t.id?.5:1 }}>
            <Clock size={13} /> Pendiente
          </button>
        )}
        {t.estado === "aprobado" && (
          <button onClick={() => onDestacado(t.id)} disabled={loading === t.id}
            style={{ display:"flex", alignItems:"center", gap:"0.375rem", height:32, padding:"0 0.875rem",
              background: t.destacado ? "#fef9c3" : "#f9fafb",
              color:      t.destacado ? "#ca8a04" : "#6b7280",
              fontWeight:700, fontSize:"0.75rem",
              border:`1px solid ${t.destacado?"#fde047":"#e5e7eb"}`, cursor:"pointer", opacity: loading===t.id?.5:1 }}>
            <Star size={13} fill={t.destacado?"#ffbf2f":"none"} color={t.destacado?"#ffbf2f":"#6b7280"} />
            {t.destacado ? "Quitar destacado" : "Destacar"}
          </button>
        )}
        <button onClick={() => onEliminar(t.id)} disabled={loading === t.id}
          style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.375rem", height:32, padding:"0 0.875rem", background:"#fff", color:"#dc2626", fontWeight:700, fontSize:"0.75rem", border:"1px solid #fca5a5", cursor:"pointer", opacity: loading===t.id?.5:1 }}>
          <Trash2 size={13} /> Eliminar
        </button>
      </div>
    </div>
  );
}

export default function TestimoniosAdminPage() {
  const [testimonios,   setTestimonios]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filtro,        setFiltro]        = useState("all");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const url  = filtro === "all" ? `${API_URL}/admin/testimonios` : `${API_URL}/admin/testimonios?estado=${filtro}`;
      const res  = await fetch(url, { headers: { Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      setTestimonios(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleEstado = async (id, estado) => {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/testimonios/${id}/estado`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
        body:    JSON.stringify({ estado }),
      });
      cargar();
    } finally { setActionLoading(null); }
  };

  const handleDestacado = async (id) => {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/testimonios/${id}/destacado`, {
        method:  "POST",
        headers: { Authorization:`Bearer ${getToken()}` },
      });
      cargar();
    } finally { setActionLoading(null); }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este testimonio?")) return;
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/testimonios/${id}`, {
        method:  "DELETE",
        headers: { Authorization:`Bearer ${getToken()}` },
      });
      cargar();
    } finally { setActionLoading(null); }
  };

  const stats = {
    total:     testimonios.length,
    pendiente: testimonios.filter(t => t.estado === "pendiente").length,
    aprobado:  testimonios.filter(t => t.estado === "aprobado").length,
    rechazado: testimonios.filter(t => t.estado === "rechazado").length,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Administración</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Testimonios</h1>
        </div>
        <button onClick={cargar}
          className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 text-gray-600 font-bold text-sm cursor-pointer hover:bg-gray-50 transition">
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-[2px] overflow-hidden h-1">
        <div className="flex-1" style={{ background:"#31138b" }} />
        <div className="flex-1" style={{ background:"#ff4d94" }} />
        <div className="flex-1" style={{ background:"#ffbf2f" }} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { k:"all",       l:"Total",      v:stats.total,     c:"#31138b", bg:"#f5f3ff" },
          { k:"pendiente", l:"Pendientes", v:stats.pendiente, c:"#ca8a04", bg:"#fef9c3" },
          { k:"aprobado",  l:"Aprobados",  v:stats.aprobado,  c:"#16a34a", bg:"#f0fdf4" },
          { k:"rechazado", l:"Rechazados", v:stats.rechazado, c:"#dc2626", bg:"#fef2f2" },
        ].map(s => (
          <button key={s.k} onClick={() => setFiltro(filtro===s.k?"all":s.k)}
            className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-4 flex items-start gap-3 text-left transition hover:border-gray-300 cursor-pointer"
            style={{ borderLeftWidth:3, borderLeftColor: filtro===s.k ? s.c : "transparent" }}>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.l}</p>
              <p className="text-2xl font-extrabold leading-tight" style={{ color: s.c }}>{s.v}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-white p-1 rounded-[2px] shadow-sm border border-gray-200 w-fit">
        {[{k:"all",l:"Todos"},{k:"pendiente",l:"Pendientes"},{k:"aprobado",l:"Aprobados"},{k:"rechazado",l:"Rechazados"}].map(f => (
          <button key={f.k} onClick={() => setFiltro(f.k)}
            className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition ${filtro===f.k?"bg-[#31138b] text-white shadow":"text-gray-500 hover:text-gray-700"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
          <div style={{ width:28, height:28, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        </div>
      ) : testimonios.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-[2px] p-10 text-center">
          <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Sin testimonios con este filtro.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:"1rem" }}>
          {testimonios.map(t => (
            <TarjetaTestimonio key={t.id} t={t}
              onEstado={handleEstado}
              onDestacado={handleDestacado}
              onEliminar={handleEliminar}
              loading={actionLoading} />
          ))}
        </div>
      )}
    </div>
  );
}