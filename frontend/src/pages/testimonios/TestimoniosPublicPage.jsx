import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, MessageSquare, Plus, Pencil, Clock, CheckCircle, XCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

function Estrellas({ value, readonly = true, size = 14 }) {
  return (
    <div style={{ display:"flex", gap:"0.15rem" }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} strokeWidth={1.5}
          fill={n <= value ? "#ffbf2f" : "none"}
          color={n <= value ? "#ffbf2f" : "#d1d5db"} />
      ))}
    </div>
  );
}

function TarjetaPublica({ t }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>
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
            {t.cargo_empresa && <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af" }}>{t.cargo_empresa}</p>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.25rem", flexShrink:0 }}>
          <Estrellas value={t.estrellas} />
          <span style={{ fontSize:"0.6rem", color:"#9ca3af" }}>{t.created_at}</span>
        </div>
      </div>
      <p style={{ margin:0, fontSize:"0.875rem", color:"#374151", lineHeight:1.65, fontStyle:"italic",
        borderLeft:"3px solid #31138b", paddingLeft:"0.875rem" }}>
        "{t.contenido}"
      </p>
      {t.destacado && (
        <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#ca8a04" }}>⭐ Destacado</span>
      )}
    </div>
  );
}

export default function TestimoniosPublicPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [publicos, setPublicos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [miTestimonio, setMiTestimonio] = useState(null);
  const [cargandoMio, setCargandoMio] = useState(false);

  // Cargar comunidad (testimonios aprobados de otros)
  const cargarPublicos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/testimonios`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar testimonios.");
      const aprobados = (Array.isArray(data) ? data : [])
        .filter(t => t.estado === "aprobado" && t.nombre !== user.name);
      setPublicos(aprobados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar mi testimonio (para saber si existe y mostrar botón)
  const cargarMiTestimonio = async () => {
    setCargandoMio(true);
    try {
      const res = await fetch(`${API_URL}/testimonios/mio`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data && data.id) {
        setMiTestimonio(data);
      } else {
        setMiTestimonio(null);
      }
    } catch (err) {
      console.error("Error al cargar mi testimonio:", err);
    } finally {
      setCargandoMio(false);
    }
  };

  useEffect(() => {
    cargarPublicos();
    cargarMiTestimonio();
  }, []);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Comunidad</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Testimonios de usuarios</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{publicos.length} testimonios</span>
          {!cargandoMio && (
            <button
              onClick={() => navigate("/testimonios/mi-testimonio")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#31138b] rounded-[4px] hover:bg-[#4c1d95] transition"
            >
              {miTestimonio ? (
                <>
                  <Pencil size={16} /> Mi testimonio
                </>
              ) : (
                <>
                  <Plus size={16} /> Crear testimonio
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-[2px] overflow-hidden h-1">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
          <div style={{ width:28, height:28, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ textAlign:"center", padding:"2rem", background:"#fff", border:"1px solid #fca5a5" }}>
          <p style={{ color:"#dc2626" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop:"1rem", padding:"0.5rem 1.5rem", background:"#31138b", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer" }}>
            Reintentar
          </button>
        </div>
      ) : publicos.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", background:"#fff", border:"1px dashed #e5e7eb" }}>
          <MessageSquare size={48} style={{ color:"#e5e7eb", margin:"0 auto 0.75rem" }} />
          <p style={{ color:"#9ca3af", fontSize:"0.95rem", margin:0 }}>Aún no hay testimonios aprobados de otros usuarios.</p>
          <p style={{ color:"#d1d5db", fontSize:"0.8rem", marginTop:"0.25rem" }}>Sé el primero en compartir tu experiencia.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"1rem" }}>
          {publicos.map(t => <TarjetaPublica key={t.id} t={t} />)}
        </div>
      )}
    </div>
  );
}