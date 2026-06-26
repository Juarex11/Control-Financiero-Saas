import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const COLORES = [
  "#7c3aed","#ec4899","#f59e0b","#ef4444","#f97316",
  "#10b981","#3b82f6","#8b5cf6","#06b6d4","#31138b",
  "#ff4d94","#ffbf2f","#64748b","#84cc16","#14b8a6",
];

export default function ModalCategoriaRecordatorio({ categoria, onClose, onGuardado }) {
  const esEdicion = !!categoria;
  const [form,    setForm]    = useState({ name: categoria?.name ?? "", color: categoria?.color ?? "#7c3aed" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("El nombre es obligatorio.");
    setError(""); setLoading(true);
    try {
      const url  = esEdicion
        ? `${API_URL}/reminder-categories/${categoria.id}/update`
        : `${API_URL}/reminder-categories`;
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar.");
      onGuardado();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", width:"100%", maxWidth:420, boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>
            {esEdicion ? "Editar categoría" : "Nueva categoría"}
          </span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>Nombre</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Servicios, Suscripciones…"
              style={{ width:"100%", height:40, border:"2px solid #e5e7eb", padding:"0 0.75rem", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }} />
          </div>

          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"#6b7280", marginBottom:"0.5rem" }}>Color</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", alignItems:"center" }}>
              {COLORES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer",
                    border: form.color === c ? "3px solid #1f2937" : "2px solid transparent",
                    boxShadow: form.color === c ? "0 0 0 2px #fff, 0 0 0 4px #1f2937" : "none",
                    display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                  {form.color === c && <Check size={13} color="#fff" strokeWidth={3} />}
                </button>
              ))}
              <label style={{ width:32, height:32, borderRadius:"50%", border:"2px solid #e5e7eb", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"0.7rem", color:"#9ca3af", fontWeight:700 }}>
                +<input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ position:"absolute", opacity:0, width:0, height:0 }} />
              </label>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.375rem" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:form.color, border:"1px solid #e5e7eb" }} />
              <span style={{ fontSize:"0.7rem", color:"#9ca3af", fontFamily:"monospace" }}>{form.color}</span>
            </div>
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#ef4444", fontSize:"0.75rem", background:"#fef2f2", border:"1px solid #fca5a5", padding:"0.5rem 0.75rem" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width:"100%", height:44, background:"#31138b", color:"#fff", fontWeight:700, fontSize:"0.875rem", border:"none", cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear categoría"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}