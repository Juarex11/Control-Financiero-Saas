import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import ModalCategoriaRecordatorio from "./ModalCategoriaRecordatorio";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

export default function RecordatoriosPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | "nuevo" | categoria
  const [deleting,   setDeleting]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/reminder-categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/reminder-categories/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
    } finally { setDeleting(null); }
  };

  return (
    <div style={{ padding:"1.5rem", minHeight:"100vh", background:"#f9fafb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Configuración</p>
          <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#111827" }}>Categorías de recordatorios</h1>
          <p style={{ margin:"0.25rem 0 0", fontSize:"0.8rem", color:"#9ca3af" }}>
            Organiza tus pagos habituales con categorías propias.
          </p>
        </div>
        <button onClick={() => setModal("nuevo")}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 1.25rem", background:"#31138b", color:"#fff", border:"none", fontWeight:700, fontSize:"0.875rem", cursor:"pointer" }}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {/* Separador */}
      <div style={{ display:"flex", height:4, marginBottom:"1.5rem", overflow:"hidden" }}>
        <div style={{ flex:1, background:"#31138b" }} />
        <div style={{ flex:1, background:"#ff4d94" }} />
        <div style={{ flex:1, background:"#ffbf2f" }} />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
          <div style={{ width:32, height:32, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
        </div>
      ) : categorias.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", background:"#fff", border:"1px solid #f3f4f6" }}>
          <Tag size={48} color="#e5e7eb" style={{ margin:"0 auto 1rem" }} />
          <p style={{ color:"#9ca3af", fontSize:"0.875rem" }}>Aún no tienes categorías. ¡Crea la primera!</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"0.75rem" }}>
          {categorias.map(cat => (
            <div key={cat.id} style={{ background:"#fff", border:"2px solid #f3f4f6", padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"0.875rem" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:`${cat.color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:cat.color }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:"0.9rem", color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cat.name}</p>
                {cat.is_default && (
                  <span style={{ fontSize:"0.6rem", color:"#9ca3af", border:"1px solid #e5e7eb", padding:"0.1rem 0.375rem" }}>default</span>
                )}
              </div>
              <div style={{ display:"flex", gap:"0.25rem" }}>
                <button onClick={() => setModal(cat)} title="Editar"
                  style={{ width:32, height:32, background:"transparent", border:"1px solid #e5e7eb", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6b7280" }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id} title="Eliminar"
                  style={{ width:32, height:32, background:"transparent", border:"1px solid #fee2e2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}>
                  {deleting === cat.id
                    ? <div style={{ width:12, height:12, border:"2px solid #ef4444", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
                    : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalCategoriaRecordatorio
          categoria={modal === "nuevo" ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}