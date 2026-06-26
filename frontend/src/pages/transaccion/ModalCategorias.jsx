import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Tag, Check, Pencil, Trash2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

export default function ModalCategorias({ categorias, onClose, onActualizado }) {
  const [tab,      setTab]      = useState("expense");
  const [form,     setForm]     = useState({ name: "", color: "#7c3aed" });
  const [editId,   setEditId]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(null);

  const filtradas = categorias.filter(c => c.type === tab);

  const resetForm = () => { setForm({ name: "", color: "#7c3aed" }); setEditId(null); setError(""); };

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, color: cat.color });
    setTab(cat.type);
  };

  const handleGuardar = async () => {
    if (!form.name.trim()) return setError("El nombre es obligatorio.");
    setError(""); setLoading(true);
    try {
      const url  = editId ? `${API_URL}/categories/${editId}/update` : `${API_URL}/categories`;
      const body = { name: form.name, color: form.color, type: tab, icon: "tag" };
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar.");
      onActualizado();
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/categories/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onActualizado();
    } finally {
      setDeleting(null);
    }
  };

  const COLORES = [
    "#7c3aed","#ec4899","#f59e0b","#ef4444","#f97316",
    "#10b981","#3b82f6","#8b5cf6","#06b6d4","#31138b",
    "#ff4d94","#ffbf2f","#64748b","#84cc16","#14b8a6",
  ];

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", width:"100%", maxWidth:520, maxHeight:"90vh", display:"flex", flexDirection:"column", borderRadius:0, boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#fff", fontWeight:700, fontSize:"1.1rem" }}>
            <Tag size={20} color="#facc15" />
            Categorías
          </div>
          <button onClick={onClose} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"#fff", cursor:"pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6", padding:"0 1.5rem", flexShrink:0 }}>
          {[{ key:"expense", label:"Gastos", color:"#ef4444" }, { key:"income", label:"Ingresos", color:"#10b981" }].map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); resetForm(); }}
              style={{
                padding:"0.75rem 1.25rem", fontSize:"0.75rem", fontWeight:700, background:"transparent",
                border:"none", borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
                color: tab === t.key ? t.color : "#9ca3af", cursor:"pointer", transition:"all .15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Cuerpo */}
        <div style={{ flex:1, overflowY:"auto", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Formulario */}
          <div style={{ background:"#faf5ff", border:"1px solid #e9d5ff", padding:"1rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <p style={{ fontSize:"0.75rem", fontWeight:700, color:"#7c3aed", margin:0 }}>
              {editId ? "Editar categoría" : "Nueva categoría"}
            </p>

            <input type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre de la categoría"
              style={{ width:"100%", height:40, border:"2px solid #ddd6fe", padding:"0 1rem", fontSize:"0.875rem", outline:"none", background:"#fff", boxSizing:"border-box" }} />

            {/* Paleta */}
            <div>
              <p style={{ fontSize:"0.7rem", color:"#6b7280", fontWeight:500, marginBottom:"0.375rem" }}>Color</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", alignItems:"center" }}>
                {COLORES.map(c => (
                  <button key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{
                      width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer",
                      border: form.color === c ? "3px solid #1f2937" : "2px solid transparent",
                      boxShadow: form.color === c ? "0 0 0 2px #fff, 0 0 0 4px #1f2937" : "none",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
                    }}>
                    {form.color === c && <Check size={13} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
                {/* Color libre */}
                <label style={{ width:32, height:32, borderRadius:"50%", border:"2px solid #e5e7eb", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"0.7rem", color:"#9ca3af", fontWeight:700, position:"relative", overflow:"hidden" }}>
                  +
                  <input type="color" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ position:"absolute", opacity:0, width:0, height:0 }} />
                </label>
              </div>
              {/* Preview */}
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.375rem" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:form.color, border:"1px solid #e5e7eb" }} />
                <span style={{ fontSize:"0.7rem", color:"#9ca3af", fontFamily:"monospace" }}>{form.color}</span>
              </div>
            </div>

            {error && (
              <p style={{ display:"flex", alignItems:"center", gap:"0.25rem", fontSize:"0.75rem", color:"#ef4444", margin:0 }}>
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={handleGuardar} disabled={loading}
                style={{ flex:1, height:40, background:"#31138b", color:"#fff", fontWeight:700, fontSize:"0.75rem", border:"none", cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Guardando…" : editId ? "Actualizar" : "Agregar"}
              </button>
              {editId && (
                <button onClick={resetForm}
                  style={{ height:40, padding:"0 1rem", border:"2px solid #e5e7eb", background:"#fff", fontSize:"0.75rem", fontWeight:700, color:"#6b7280", cursor:"pointer" }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          {filtradas.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2.5rem 0" }}>
              <Tag size={40} color="#e5e7eb" style={{ margin:"0 auto 0.75rem" }} />
              <p style={{ fontSize:"0.875rem", color:"#9ca3af" }}>
                Sin categorías de {tab === "expense" ? "gastos" : "ingresos"} aún.
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {filtradas.map(cat => (
                <div key={cat.id}
                  style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", background:"#fff", border:"2px solid #f3f4f6" }}>
                  <div style={{ width:36, height:36, borderRadius:4, background:`${cat.color}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:cat.color }} />
                  </div>

                  <span style={{ flex:1, fontSize:"0.875rem", fontWeight:600, color:"#374151" }}>{cat.name}</span>

                  {cat.is_default && (
                    <span style={{ fontSize:"0.625rem", color:"#9ca3af", border:"1px solid #e5e7eb", padding:"0.125rem 0.375rem", flexShrink:0 }}>
                      default
                    </span>
                  )}

                  <button onClick={() => handleEdit(cat)}
                    style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"#9ca3af", cursor:"pointer" }}>
                    <Pencil size={14} />
                  </button>

                  <button onClick={() => handleEliminar(cat.id)} disabled={deleting === cat.id}
                    style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"#9ca3af", cursor:"pointer" }}>
                    {deleting === cat.id
                      ? <div style={{ width:12, height:12, border:"2px solid #f87171", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}