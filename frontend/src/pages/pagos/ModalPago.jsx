import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, AlertCircle, Tag } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}

const FRECUENCIAS = [
  { key: "once",        label: "Una vez"          },
  { key: "daily",       label: "Diario"            },
  { key: "weekly",      label: "Semanalmente"      },
  { key: "biweekly",    label: "Cada 2 semanas"    },
  { key: "every4weeks", label: "Cada 4 semanas"    },
  { key: "monthly",     label: "Mensualmente"      },
  { key: "bimonthly",   label: "Cada 2 meses"      },
  { key: "quarterly",   label: "Cada trimestre"    },
  { key: "semiannual",  label: "Cada 6 meses"      },
];

// accounts/categorias con default [] por si el padre aún no terminó de cargarlos
export default function ModalPago({ pago, accounts = [], categorias = [], onClose, onGuardado }) {
  // Todos los hooks se declaran siempre, sin condiciones, arriba del todo
  const esEdicion = !!pago;
  const hoy = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    type:                 pago?.type                 ?? "expense",
    account_id:           pago?.account_id           ?? "",
    reminder_category_id: pago?.reminder_category_id ?? "",
    name:                 pago?.name                 ?? "",
    amount:               pago?.amount               ?? "",
    frequency:            pago?.frequency            ?? "monthly",
    start_date:           pago?.start_date?.split("T")[0] ?? hoy,
    end_date:             pago?.end_date?.split("T")[0]   ?? "",
    reminder_time:        pago?.reminder_time?.slice(0,5) ?? "08:00",
    label:                pago?.label                ?? "",
    comment:              pago?.comment              ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-seleccionar cuenta y categoría cuando lleguen (o si aún no hay elegidas)
  useEffect(() => {
    if (!form.account_id && accounts.length > 0) {
      set("account_id", accounts[0].id);
    }
  }, [accounts]);

  useEffect(() => {
    if (!form.reminder_category_id && categorias.length > 0) {
      set("reminder_category_id", categorias[0].id);
    }
  }, [categorias]);

  const cuentaSeleccionada = accounts.find(a => a.id === Number(form.account_id));

  const handleSubmit = async () => {
    if (!form.name.trim())  return setError("El nombre es obligatorio.");
    if (!form.account_id || Number(form.account_id) <= 0) return setError("Selecciona una cuenta válida.");
    if (!form.reminder_category_id) return setError("Selecciona una categoría.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Ingresa un monto válido.");
    if (!form.start_date)   return setError("La fecha de inicio es obligatoria.");
    setError(""); setLoading(true);
    try {
      const url  = esEdicion
        ? `${API_URL}/recurring-payments/${pago.id}/update`
        : `${API_URL}/recurring-payments`;
      const body = {
        ...form,
        account_id:           Number(form.account_id),
        reminder_category_id: Number(form.reminder_category_id),
        amount:               Number(form.amount),
        end_date:             form.end_date || null,
      };
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(body),
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

  const inputCls = "w-full h-10 border-2 border-gray-200 px-3 text-sm outline-none focus:border-[#31138b] transition bg-white box-border";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1";

  // El renderizado condicional (sin categorías) va DENTRO del JSX,
  // después de todos los hooks, para no romper las reglas de React
  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {categorias.length === 0 ? (
        // ── Modal de "Falta una categoría" ──
        <div style={{ background:"#fff", width:"100%", maxWidth:400, boxShadow:"0 25px 50px rgba(0,0,0,0.25)", borderRadius:"4px", overflow:"hidden" }}>
          <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem" }}>Falta una categoría</span>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding:"2rem 1.5rem", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Tag size={26} color="#31138b" />
            </div>
            <p style={{ margin:0, fontSize:"0.875rem", color:"#374151" }}>
              Necesitas crear al menos una categoría antes de programar un pago habitual.
            </p>
            <button
              onClick={() => { onClose(); navigate("/recordatorios"); }}
              style={{ width:"100%", height:44, background:"#31138b", color:"#fff", fontWeight:700, fontSize:"0.875rem", border:"none", cursor:"pointer", borderRadius:"4px" }}
            >
              Crear categoría ahora
            </button>
          </div>
        </div>
      ) : (
        // ── Formulario normal ──
        <div style={{ background:"#fff", width:"100%", maxWidth:640, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }}>
          <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem" }}>
              {esEdicion ? "Editar pago habitual" : "Nuevo pago habitual"}
            </span>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {esEdicion && pago?.status === "paused" && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#92400e", fontSize:"0.75rem", background:"#fffbeb", border:"1px solid #fde68a", padding:"0.6rem 0.75rem", borderRadius:"4px" }}>
                <AlertCircle size={14} />
                Este pago está pausado. Si cambias la fecha de inicio, se reactivará automáticamente.
              </div>
            )}

            <div>
              <label className={labelCls}>Tipo</label>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                {[{key:"expense",label:"Gasto",color:"#ef4444"},{key:"income",label:"Ingreso",color:"#10b981"}].map(t => (
                  <button key={t.key} onClick={() => set("type", t.key)}
                    style={{
                      flex:1, height:40, fontWeight:700, fontSize:"0.8rem", cursor:"pointer", transition:"all .15s",
                      border: `2px solid ${form.type === t.key ? t.color : "#e5e7eb"}`,
                      background: form.type === t.key ? `${t.color}15` : "#f9fafb",
                      color: form.type === t.key ? t.color : "#9ca3af",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label className={labelCls}>Nombre del pago</label>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Ej: Netflix, Alquiler, Sueldo…" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Cuenta</label>
                <select value={form.account_id} onChange={e => set("account_id", e.target.value)} className={inputCls}>
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  Monto {cuentaSeleccionada ? `(${cuentaSeleccionada.currency})` : ""}
                </label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.875rem", fontWeight:700, color:"#9ca3af" }}>
                    {getCurrencySymbol(cuentaSeleccionada?.currency ?? "PEN")}
                  </span>
                  <input type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => set("amount", e.target.value)} placeholder="0.00"
                    style={{ width:"100%", height:40, border:"2px solid #e5e7eb", paddingLeft:"2rem", paddingRight:"0.75rem", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Frecuencia</label>
                <select value={form.frequency} onChange={e => set("frequency", e.target.value)} className={inputCls}>
                  {FRECUENCIAS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Categoría</label>
                <select value={form.reminder_category_id} onChange={e => set("reminder_category_id", e.target.value)} className={inputCls}>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Fecha de inicio</label>
                <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Hora de recordatorio</label>
                <input type="time" value={form.reminder_time} onChange={e => set("reminder_time", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Fecha de finalización (opcional)</label>
                <input type="date" value={form.end_date} min={form.start_date}
                  onChange={e => set("end_date", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Etiqueta (opcional)</label>
                <input type="text" value={form.label} onChange={e => set("label", e.target.value)}
                  placeholder="Ej: hogar, trabajo, suscripción…" className={inputCls} />
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label className={labelCls}>Comentario (opcional)</label>
                <textarea value={form.comment} onChange={e => set("comment", e.target.value)}
                  placeholder="Notas adicionales…" rows={3}
                  style={{ width:"100%", border:"2px solid #e5e7eb", padding:"0.5rem 0.75rem", fontSize:"0.875rem", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
              </div>
            </div>

            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#ef4444", fontSize:"0.75rem", background:"#fef2f2", border:"1px solid #fca5a5", padding:"0.5rem 0.75rem" }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width:"100%", height:44, background:"#31138b", color:"#fff", fontWeight:700, fontSize:"0.875rem", border:"none", cursor:"pointer", opacity: loading ? 0.6 : 1, transition:"opacity .15s" }}>
              {loading ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear pago habitual"}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}