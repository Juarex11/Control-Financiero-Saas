import { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Wallet, ChevronDown, Plus, X, Check, Pencil, Trash2,
  TrendingUp, TrendingDown, Tag, ArrowLeftRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("token");
}

const PALETTE = [
  "#31138b", "#ff4d94", "#ffbf2f", "#10b981", "#3b82f6",
  "#f97316", "#8b5cf6", "#ef4444", "#06b6d4", "#64748b",
];

const FILTROS = [
  { key: "dia",     label: "Hoy"     },
  { key: "semana",  label: "Semana"  },
  { key: "mes",     label: "Mes"     },
  { key: "periodo", label: "Período" },
];

function getCurrencySymbol(code) {
  const map = { PEN:"S/", USD:"$", EUR:"€", GBP:"£", BRL:"R$", CLP:"$", COP:"$", MXN:"$", ARS:"$", BOB:"Bs" };
  return map[code] ?? code;
}

function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

function EmptyDonut({ label, color }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="14" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-400 font-semibold">Sin datos</span>
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{label}</p>
    </div>
  );
}

function DonutChart({ data, total, label, color, currency }) {
  if (!data || data.length === 0) return <EmptyDonut label={label} color={color} />;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={52} paddingAngle={2} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatMoney(v, currency)}
              contentStyle={{ fontSize: 11, borderRadius: 4, border: "1px solid #e5e7eb" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-gray-400">Total</span>
          <span className="text-sm font-extrabold text-gray-800 leading-tight">
            {getCurrencySymbol(currency)}{Number(total).toLocaleString("es-PE", { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{label}</p>
    </div>
  );
}

function CategoriasModal({ onClose }) {
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tipo,       setTipo]       = useState("expense");
  const [form,       setForm]       = useState({ name: "", color: PALETTE[0] });
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => categorias.filter(c => c.tipo === tipo), [categorias, tipo]);

  const handleSave = async () => {
    if (!form.name) { setError("El nombre es requerido."); return; }
    setSaving(true);
    try {
      const url = editing ? `${API_URL}/categories/${editing.id}/update` : `${API_URL}/categories`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, color: form.color, tipo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error."); return; }
      setForm({ name: "", color: PALETTE[0] });
      setEditing(null);
      setError("");
      cargar();
    } catch { setError("No se pudo conectar."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    cargar();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[6px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Gestión de categorías</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[2px] hover:bg-gray-100 text-gray-400 transition">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-[4px]">
            {[{ key: "expense", label: "Gastos", color: "#ef4444" }, { key: "income", label: "Ingresos", color: "#10b981" }].map(({ key, label, color }) => (
              <button key={key}
                onClick={() => { setTipo(key); setEditing(null); setForm({ name: "", color: PALETTE[0] }); setError(""); }}
                className={`flex-1 py-2 text-sm font-bold rounded-[3px] transition ${tipo === key ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                style={tipo === key ? { color } : {}}>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-3 p-4 bg-gray-50 rounded-[4px] border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{editing ? "Editar" : "Nueva"} categoría</p>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre de categoría..."
              className="w-full border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition bg-white" />
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: c }}>
                  {form.color === c && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              {editing && (
                <button onClick={() => { setEditing(null); setForm({ name: "", color: PALETTE[0] }); setError(""); }}
                  className="px-4 py-2 border border-gray-200 rounded-[4px] text-sm text-gray-500 hover:bg-gray-100 transition">
                  Cancelar
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-[4px] text-white text-sm font-bold disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg, #31138b 0%, #ff4d94 100%)" }}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Agregar"}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay categorías de {tipo === "expense" ? "gastos" : "ingresos"} aún
            </div>
          ) : (
            <div className="space-y-2">
              {filtradas.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-[4px]">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(cat); setForm({ name: cat.name, color: cat.color }); }}
                      className="w-7 h-7 flex items-center justify-center rounded-[2px] text-gray-400 hover:text-[#31138b] hover:bg-purple-50 transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[2px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const cuenta = accounts.find(a => a.id === selected) || accounts[0];
  if (!cuenta) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 border border-white/30 rounded-[4px] text-xs font-semibold text-white hover:bg-white/30 transition">
        <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
        {cuenta.name}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-[4px] shadow-lg z-20">
          {accounts.map(a => (
            <button key={a.id} onClick={() => { onChange(a.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
                ${a.id === selected ? "bg-[#31138b]/5 text-[#31138b] font-bold" : "text-gray-700 hover:bg-gray-50"}`}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
              <span className="flex-1 text-left">{a.name}</span>
              {a.is_primary && <span className="text-[10px] text-gray-400">Principal</span>}
              {a.id === selected && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardUserPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const [accounts,        setAccounts]        = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filtro,          setFiltro]          = useState("semana");
  const [periodoDesde,    setPeriodoDesde]     = useState("");
  const [periodoHasta,    setPeriodoHasta]     = useState("");
  const [statsGastos,     setStatsGastos]      = useState([]);
  const [statsIngresos,   setStatsIngresos]    = useState([]);
  const [loadingStats,    setLoadingStats]     = useState(false);
  const [showCategorias,  setShowCategorias]   = useState(false);

  const cargarCuentas = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setAccounts(data);
        const principal = data.find(a => a.is_primary) || data[0];
        setSelectedAccount(principal.id);
      }
    } catch {}
  }, []);

  useEffect(() => { cargarCuentas(); }, [cargarCuentas]);

  const cargarStats = useCallback(async () => {
    if (!selectedAccount) return;
    setLoadingStats(true);
    try {
      const params = new URLSearchParams({ filtro, account_id: selectedAccount });
      if (filtro === "periodo" && periodoDesde && periodoHasta) {
        params.append("desde", periodoDesde);
        params.append("hasta", periodoHasta);
      }
      const res  = await fetch(`${API_URL}/transactions/stats?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setStatsGastos(data.gastos    || []);
      setStatsIngresos(data.ingresos || []);
    } catch {
      setStatsGastos([]);
      setStatsIngresos([]);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedAccount, filtro, periodoDesde, periodoHasta]);

  useEffect(() => { cargarStats(); }, [cargarStats]);

  const cuentaActual  = accounts.find(a => a.id === selectedAccount);
  const totalGastos   = useMemo(() => statsGastos.reduce((s, c)   => s + Number(c.value), 0), [statsGastos]);
  const totalIngresos = useMemo(() => statsIngresos.reduce((s, c) => s + Number(c.value), 0), [statsIngresos]);

  return (
    <div className="p-6 space-y-5">

      {/* Bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{saludo}</p>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-0.5">
            {user.name?.split(" ")[0]}, tu control financiero
          </h1>
        </div>
        <div className="hidden sm:flex gap-1 items-end h-8">
          <div className="w-2 rounded-t-sm" style={{ height: "60%", background: "#31138b" }} />
          <div className="w-2 rounded-t-sm" style={{ height: "80%", background: "#ff4d94" }} />
          <div className="w-2 rounded-t-sm" style={{ height: "100%", background: "#ffbf2f" }} />
        </div>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-[3px] overflow-hidden h-1">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Billetera */}
      {cuentaActual && (
        <div className="rounded-[6px] p-5 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${cuentaActual.color} 0%, ${cuentaActual.color}cc 100%)` }}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-white/80" />
                <span className="text-sm font-semibold text-white/80">Billetera</span>
              </div>
              {accounts.length > 1 && (
                <AccountSelector accounts={accounts} selected={selectedAccount} onChange={setSelectedAccount} />
              )}
            </div>
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{cuentaActual.name}</p>
            <p className="text-4xl font-extrabold">{formatMoney(cuentaActual.balance, cuentaActual.currency)}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-white/60" />
                <span className="text-xs text-white/60">Ingresos:</span>
                <span className="text-xs font-bold">{formatMoney(totalIngresos, cuentaActual.currency)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-white/60" />
                <span className="text-xs text-white/60">Gastos:</span>
                <span className="text-xs font-bold">{formatMoney(totalGastos, cuentaActual.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros + Categorías */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-[4px]">
          {FILTROS.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition
                ${filtro === key ? "bg-white shadow-sm text-[#31138b]" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCategorias(true)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-[4px] text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
          <Tag size={13} /> Categorías
        </button>
      </div>

      {/* Filtro período */}
      {filtro === "periodo" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500">Desde</label>
            <input type="date" value={periodoDesde} onChange={e => setPeriodoDesde(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs outline-none focus:border-[#31138b]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500">Hasta</label>
            <input type="date" value={periodoHasta} onChange={e => setPeriodoHasta(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs outline-none focus:border-[#31138b]" />
          </div>
        </div>
      )}

      {/* Gráficas donut */}
      <div className="bg-white rounded-[4px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 text-sm">
            Resumen por categoría —{" "}
            <span className="text-gray-400 font-normal">{FILTROS.find(f => f.key === filtro)?.label}</span>
          </h3>
          {loadingStats && <div className="w-4 h-4 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />}
        </div>
        <div className="grid grid-cols-2 gap-8">
          {/* Gastos */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={statsGastos} total={totalGastos} label="Gastos" color="#ef4444" currency={cuentaActual?.currency ?? "PEN"} />
            {statsGastos.length > 0 && (
              <div className="w-full space-y-1.5">
                {statsGastos.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color || PALETTE[i % PALETTE.length] }} />
                      <span className="text-gray-600 truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="font-bold text-gray-700">{formatMoney(cat.value, cuentaActual?.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Ingresos */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={statsIngresos} total={totalIngresos} label="Ingresos" color="#10b981" currency={cuentaActual?.currency ?? "PEN"} />
            {statsIngresos.length > 0 && (
              <div className="w-full space-y-1.5">
                {statsIngresos.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color || PALETTE[i % PALETTE.length] }} />
                      <span className="text-gray-600 truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="font-bold text-gray-700">{formatMoney(cat.value, cuentaActual?.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cambiar cuenta */}
      {accounts.length > 1 && (
        <div className="bg-white rounded-[4px] border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight size={14} className="text-[#31138b]" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Cambiar cuenta</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {accounts.map(a => (
              <button key={a.id} onClick={() => setSelectedAccount(a.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[4px] border-2 text-xs font-bold transition
                  ${a.id === selectedAccount ? "border-[#31138b] bg-[#31138b]/5 text-[#31138b]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                {a.name}
                {a.is_primary && <span className="text-[10px] text-gray-400">(Principal)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {showCategorias && <CategoriasModal onClose={() => setShowCategorias(false)} />}
    </div>
  );
}