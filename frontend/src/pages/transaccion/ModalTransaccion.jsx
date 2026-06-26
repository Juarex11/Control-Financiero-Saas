import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeftRight, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

export default function ModalTransaccion({ tipo, cuentas, cuentaId, categorias, onClose, onGuardado }) {
  const [form, setForm] = useState({
    type:                tipo,
    account_id:          cuentaId,
    transfer_account_id: "",
    category_id:         "",
    amount:              "",
    note:                "",
    date:                new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const categoriasFiltradas = categorias.filter(c => c.type === form.type);
  const cuentaOrigen        = cuentas.find(c => c.id === form.account_id);
  const tieneDosOMas        = cuentas.length >= 2;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return setError("Ingresa un monto válido.");
    if (form.type === "transfer" && !form.transfer_account_id) return setError("Selecciona la cuenta destino.");
    setError(""); setLoading(true);
    try {
      const body = {
        type:                form.type,
        account_id:          Number(form.account_id),
        amount:              Number(form.amount),
        date:                form.date,
        note:                form.note || null,
        category_id:         form.category_id         ? Number(form.category_id)         : null,
        transfer_account_id: form.transfer_account_id ? Number(form.transfer_account_id) : null,
      };
      const res  = await fetch(`${API_URL}/transactions`, {
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

  const TIPOS = [
    { key: "expense",  label: "Gasto",        bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
    { key: "income",   label: "Ingreso",       bg: "#f0fdf4", border: "#86efac", text: "#16a34a" },
    ...(tieneDosOMas ? [{ key: "transfer", label: "Transferencia", bg: "#eff6ff", border: "#93c5fd", text: "#2563eb" }] : []),
  ];

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", width:"100%", maxWidth:"680px", maxHeight:"90vh", overflowY:"auto", borderRadius:0, boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ background:"#31138b", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#fff", fontWeight:700, fontSize:"1.1rem" }}>
            <ArrowLeftRight size={20} />
            Nueva transacción
          </div>
          <button onClick={onClose} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"#fff", cursor:"pointer", borderRadius:4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          {/* Tipo */}
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {TIPOS.map(t => (
              <button key={t.key}
                onClick={() => { set("type", t.key); set("category_id", ""); }}
                style={{
                  flex:1, padding:"0.6rem", fontSize:"0.75rem", fontWeight:700,
                  border: `2px solid ${form.type === t.key ? t.border : "#e5e7eb"}`,
                  background: form.type === t.key ? t.bg : "#f9fafb",
                  color: form.type === t.key ? t.text : "#9ca3af",
                  cursor:"pointer", transition:"all .15s",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {/* Cuenta origen */}
              <div>
                <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>
                  {form.type === "transfer" ? "Cuenta origen" : "Cuenta"}
                </label>
                <select value={form.account_id} onChange={e => set("account_id", Number(e.target.value))}
                  style={{ width:"100%", height:40, border:"2px solid #e5e7eb", padding:"0 0.75rem", fontSize:"0.875rem", outline:"none", background:"#fff" }}>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {formatMoney(c.balance, c.currency)}</option>
                  ))}
                </select>
              </div>

              {/* Cuenta destino */}
              {form.type === "transfer" && (
                <div>
                  <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>Cuenta destino</label>
                  <select value={form.transfer_account_id} onChange={e => set("transfer_account_id", e.target.value)}
                    style={{ width:"100%", height:40, border:"2px solid #e5e7eb", padding:"0 0.75rem", fontSize:"0.875rem", outline:"none", background:"#fff" }}>
                    <option value="">Seleccionar…</option>
                    {cuentas.filter(c => c.id !== form.account_id).map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {formatMoney(c.balance, c.currency)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monto */}
              <div>
                <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>
                  Monto {cuentaOrigen ? `(${cuentaOrigen.currency})` : ""}
                </label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.875rem", fontWeight:700, color:"#9ca3af" }}>
                    {getCurrencySymbol(cuentaOrigen?.currency ?? "PEN")}
                  </span>
                  <input type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => set("amount", e.target.value)} placeholder="0.00"
                    style={{ width:"100%", height:40, border:"2px solid #e5e7eb", paddingLeft:"2rem", paddingRight:"0.75rem", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {/* Fecha */}
              <div>
                <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>Fecha</label>
                <input type="date" value={form.date} max={new Date().toISOString().split("T")[0]}
                  onChange={e => set("date", e.target.value)}
                  style={{ width:"100%", height:40, border:"2px solid #e5e7eb", padding:"0 0.75rem", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Nota */}
              <div>
                <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>Nota (opcional)</label>
                <input type="text" value={form.note} onChange={e => set("note", e.target.value)}
                  placeholder="Ej: Supermercado Wong"
                  style={{ width:"100%", height:40, border:"2px solid #e5e7eb", padding:"0 0.75rem", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>
          </div>

          {/* Categorías */}
          {form.type !== "transfer" && (
            <div>
              <label style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", marginBottom:"0.375rem" }}>Categoría</label>
              {categoriasFiltradas.length === 0 ? (
                <p style={{ fontSize:"0.75rem", color:"#9ca3af", fontStyle:"italic" }}>Sin categorías. Créalas en "Categorías".</p>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                  {categoriasFiltradas.map(cat => (
                    <button key={cat.id}
                      onClick={() => set("category_id", cat.id === form.category_id ? "" : cat.id)}
                      style={{
                        display:"flex", alignItems:"center", gap:"0.375rem",
                        padding:"0.4rem 0.75rem", fontSize:"0.75rem", fontWeight:600,
                        border: `2px solid ${form.category_id === cat.id ? "#7c3aed" : "#e5e7eb"}`,
                        background: form.category_id === cat.id ? "#f5f3ff" : "#f9fafb",
                        color: form.category_id === cat.id ? "#6d28d9" : "#374151",
                        cursor:"pointer", transition:"all .15s",
                      }}>
                      <span style={{ width:10, height:10, borderRadius:"50%", background: form.category_id === cat.id ? "#7c3aed" : cat.color, display:"inline-block" }} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"#ef4444", fontSize:"0.75rem", background:"#fef2f2", border:"1px solid #fca5a5", padding:"0.5rem 0.75rem" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !form.amount}
            style={{ width:"100%", height:44, background:"#31138b", color:"#fff", fontWeight:700, fontSize:"0.875rem", border:"none", cursor:"pointer", opacity: (loading || !form.amount) ? 0.5 : 1, transition:"opacity .15s" }}>
            {loading ? "Guardando…" : "Guardar transacción"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}