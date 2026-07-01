import { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Wallet, ChevronDown, ChevronLeft, ChevronRight,
  Check, TrendingUp, TrendingDown, Tag, Plus,
} from "lucide-react";
import ModalTransaccion from "./transaccion/ModalTransaccion";
import ModalCategorias  from "./transaccion/ModalCategorias";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const PALETTE = [
  "#31138b","#ff4d94","#ffbf2f","#10b981","#3b82f6",
  "#f97316","#8b5cf6","#06b6d4","#ef4444","#64748b",
  "#84cc16","#ec4899","#14b8a6","#a855f7","#f59e0b",
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getCurrencySymbol(code) {
  const map = {
    PEN: "S/", USD: "$", EUR: "€", ARS: "$", BOB: "Bs",
    CLP: "$", COP: "$", CRC: "₡", CUP: "$", GTQ: "Q",
    HNL: "L", MXN: "$", NIO: "C$", PYG: "₲", DOP: "RD$",
    UYU: "$U", VES: "Bs.S",
  };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

// ── Navegadores de fecha ──────────────────────────────────────────────────────
function WeekNavigator({ value, onChange }) {
  const getWeekLabel = (date) => {
    const d   = new Date(date);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const lun = new Date(d); lun.setDate(d.getDate() - day);
    const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    const fmt = (x) => `${x.getDate()} ${MESES[x.getMonth()].slice(0, 3)}`;
    return `${fmt(lun)} — ${fmt(dom)} ${dom.getFullYear()}`;
  };
  const move = (dir) => {
    const d = new Date(value);
    d.setDate(d.getDate() + dir * 7);
    if (d <= new Date()) onChange(d.toISOString().split("T")[0]);
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all">
      <button onClick={() => move(-1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600"><ChevronLeft size={16} /></button>
      <span className="text-xs font-bold text-purple-900 min-w-[160px] text-center">{getWeekLabel(value)}</span>
      <button onClick={() => move(1)} disabled={new Date(value) >= new Date()} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600 disabled:opacity-30"><ChevronRight size={16} /></button>
    </div>
  );
}

function MonthNavigator({ mes, anio, onChange }) {
  const move = (dir) => {
    let m = mes + dir, a = anio;
    if (m > 11) { m = 0; a++; }
    if (m < 0)  { m = 11; a--; }
    const now = new Date();
    if (a > now.getFullYear() || (a === now.getFullYear() && m > now.getMonth())) return;
    onChange(m, a);
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all">
      <button onClick={() => move(-1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600"><ChevronLeft size={16} /></button>
      <span className="text-xs font-bold text-purple-900 min-w-[120px] text-center">{MESES[mes]} {anio}</span>
      <button onClick={() => move(1)} disabled={anio === new Date().getFullYear() && mes === new Date().getMonth()} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600 disabled:opacity-30"><ChevronRight size={16} /></button>
    </div>
  );
}

function DayNavigator({ value, onChange }) {
  const move = (dir) => {
    const d = new Date(value);
    d.setDate(d.getDate() + dir);
    if (d <= new Date()) onChange(d.toISOString().split("T")[0]);
  };
  const label = () => {
    const d   = new Date(value);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === hoy.getTime()) return "Hoy";
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    if (d.getTime() === ayer.getTime()) return "Ayer";
    return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all">
      <button onClick={() => move(-1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600"><ChevronLeft size={16} /></button>
      <span className="text-xs font-bold text-purple-900 min-w-[100px] text-center">{label()}</span>
      <button onClick={() => move(1)} disabled={value === new Date().toISOString().split("T")[0]} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-50 transition text-purple-600 disabled:opacity-30"><ChevronRight size={16} /></button>
    </div>
  );
}

// ── Donut vacío ───────────────────────────────────────────────────────────────
function EmptyDonut({ label, color, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group w-full">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={`${color}20`} strokeWidth="12"
            strokeDasharray="239" strokeDashoffset="0" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg"
            style={{ background: color }}>
            <Plus size={22} className="text-white" />
          </div>
          <span className="text-xs font-bold text-gray-400">Agregar</span>
        </div>
      </div>
      <p className="text-sm font-bold uppercase tracking-wide" style={{ color }}>{label}</p>
    </button>
  );
}

// ── Donut con datos ───────────────────────────────────────────────────────────
function DonutChart({ data, total, label, color, currency, onClick }) {
  if (!data || data.length === 0) return <EmptyDonut label={label} color={color} onClick={onClick} />;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="bg-white border border-purple-100 rounded-xl px-4 py-3 shadow-lg text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ background: d.payload.color }} />
          <span className="font-bold text-gray-700">{d.payload.name}</span>
        </div>
        <p className="font-extrabold text-lg" style={{ color: d.payload.color }}>{formatMoney(d.value, currency)}</p>
        <p className="text-gray-400 text-xs">{((d.value / total) * 100).toFixed(1)}%</p>
      </div>
    );
  };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 w-full group">
      <div className="relative w-48 h-48 transition-all duration-300 group-hover:scale-105">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={68}
              paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-400 font-semibold">Total</span>
          <span className="text-xl font-extrabold text-gray-800 leading-tight">
            {getCurrencySymbol(currency)}{Number(total).toLocaleString("es-PE", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] mt-1 font-bold" style={{ color }}>{data.length} categ.</span>
        </div>
      </div>
      <p className="text-sm font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color }}>
        {label}
        <Plus size={14} className="opacity-60" />
      </p>
    </button>
  );
}

// ── AccountSelector ───────────────────────────────────────────────────────────
function AccountSelector({ accounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const cuenta = accounts.find(a => a.id === selected) || accounts[0];
  if (!cuenta) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-xs font-bold text-white hover:bg-white/30 transition-all">
        <div className="w-3 h-3 rounded-full bg-white/60 shadow-sm" />
        {cuenta.name}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-purple-100 rounded-xl shadow-xl z-50 overflow-hidden">
          {accounts.map(a => (
            <button key={a.id} onClick={() => { onChange(a.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                ${a.id === selected ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-700 hover:bg-gray-50"}`}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} />
              <span className="flex-1 text-left">{a.name}</span>
              {a.is_primary && <span className="text-[10px] text-purple-400 font-bold">Principal</span>}
              {a.id === selected && <Check size={14} className="text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardUserPage() {
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const hoy    = new Date().toISOString().split("T")[0];

  const [accounts,        setAccounts]        = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filtro,          setFiltro]           = useState("semana");
  const [diaActual,       setDiaActual]        = useState(hoy);
  const [semanaRef,       setSemanaRef]        = useState(hoy);
  const [mesActual,       setMesActual]        = useState(new Date().getMonth());
  const [anioActual,      setAnioActual]       = useState(new Date().getFullYear());
  const [periodoDesde,    setPeriodoDesde]     = useState("");
  const [periodoHasta,    setPeriodoHasta]     = useState("");
  const [statsGastos,     setStatsGastos]      = useState([]);
  const [statsIngresos,   setStatsIngresos]    = useState([]);
  const [categorias,      setCategorias]       = useState([]);
  const [loadingStats,    setLoadingStats]     = useState(false);
  const [showCategorias,  setShowCategorias]   = useState(false);
  const [modalTipo,       setModalTipo]        = useState(null);

  const cargarCuentas = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setAccounts(data);
        const p = data.find(a => a.is_primary) || data[0];
        setSelectedAccount(prev => prev ?? p.id);
      }
    } catch {}
  }, []);

  const cargarCategorias = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const cargarStats = useCallback(async () => {
    if (!selectedAccount) return;
    setLoadingStats(true);
    try {
      const params = new URLSearchParams({ filtro, account_id: selectedAccount });
      if (filtro === "dia")    params.append("dia", diaActual);
      if (filtro === "semana") params.append("semana_ref", semanaRef);
      if (filtro === "mes")    { params.append("mes", mesActual + 1); params.append("anio", anioActual); }
      if (filtro === "periodo" && periodoDesde && periodoHasta) {
        params.append("desde", periodoDesde);
        params.append("hasta", periodoHasta);
      }
      const res  = await fetch(`${API_URL}/transactions/stats?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setStatsGastos(data.gastos    || []);
      setStatsIngresos(data.ingresos || []);
    } catch {} finally { setLoadingStats(false); }
  }, [selectedAccount, filtro, diaActual, semanaRef, mesActual, anioActual, periodoDesde, periodoHasta]);

  useEffect(() => { cargarCuentas(); cargarCategorias(); }, [cargarCuentas, cargarCategorias]);
  useEffect(() => { cargarStats(); }, [cargarStats]);

  const cuentaActual  = accounts.find(a => a.id === selectedAccount);
  const totalGastos   = useMemo(() => statsGastos.reduce((s, c)   => s + Number(c.value), 0), [statsGastos]);
  const totalIngresos = useMemo(() => statsIngresos.reduce((s, c) => s + Number(c.value), 0), [statsIngresos]);

  const FILTROS = [
    { key: "dia",     label: "Día"     },
    { key: "semana",  label: "Semana"  },
    { key: "mes",     label: "Mes"     },
    { key: "periodo", label: "Período" },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>

 {/* Bienvenida */}
<div className="space-y-0.5">
  <p className="text-sm font-medium" style={{ color: "#31138b" }}>
    {saludo}
  </p>
  <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
    {user.name?.split(" ")[0]}, <span className="font-normal text-gray-600">a tu control financiero</span>
  </h1>
</div>

      {/* Separador tricolor */}
      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Billetera */}
      {cuentaActual && (
        <div className="rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${cuentaActual.color || "#31138b"} 0%, #4c1d95 40%, #ff4d94 80%, #ffbf2f 100%)` }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: "rgba(255,77,148,0.15)" }} />
          <div className="absolute -bottom-12 right-24 w-40 h-40 rounded-full" style={{ background: "rgba(255,191,47,0.12)" }} />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Wallet size={160} className="text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                  <Wallet size={28} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white/90">Billetera</span>
                  <p className="text-xs text-white/70">{cuentaActual.name}</p>
                </div>
              </div>
              {accounts.length > 1 && (
                <AccountSelector accounts={accounts} selected={selectedAccount} onChange={setSelectedAccount} />
              )}
            </div>

            <p className="text-5xl font-extrabold tracking-tight mb-1">
              {formatMoney(cuentaActual.balance, cuentaActual.currency)}
            </p>
            <p className="text-xs text-white/60 uppercase tracking-wider">Balance total</p>

            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-white/20">
              <div className="flex items-center gap-3 bg-green-500/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-green-400/40">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-white/80 uppercase tracking-wide font-semibold">Ingresos</p>
                  <p className="text-sm font-extrabold text-white">{formatMoney(totalIngresos, cuentaActual.currency)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-red-500/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-red-400/40">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingDown size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-white/80 uppercase tracking-wide font-semibold">Gastos</p>
                  <p className="text-sm font-extrabold text-white">{formatMoney(totalGastos, cuentaActual.currency)}</p>
                </div>
              </div>

              <button onClick={() => setModalTipo("expense")}
                className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 shadow-lg">
                <Plus size={16} /> Nueva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros + Navegador */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-purple-100">
          {FILTROS.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all
                ${filtro === key ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:text-purple-700 hover:bg-purple-50"}`}>
              {label}
            </button>
          ))}
        </div>

        {filtro === "dia"    && <DayNavigator   value={diaActual} onChange={setDiaActual} />}
        {filtro === "semana" && <WeekNavigator  value={semanaRef} onChange={setSemanaRef} />}
        {filtro === "mes"    && <MonthNavigator mes={mesActual}   anio={anioActual} onChange={(m, a) => { setMesActual(m); setAnioActual(a); }} />}
        {filtro === "periodo" && (
          <div className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl px-4 py-2 shadow-sm flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Desde</label>
              <input type="date" value={periodoDesde} onChange={e => setPeriodoDesde(e.target.value)} max={hoy}
                className="border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-500 transition" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Hasta</label>
              <input type="date" value={periodoHasta} onChange={e => setPeriodoHasta(e.target.value)} max={hoy}
                className="border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-500 transition" />
            </div>
          </div>
        )}

        {loadingStats && (
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin self-center" />
        )}

        <button onClick={() => setShowCategorias(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm">
          <Tag size={14} /> Categorías
        </button>
      </div>

      {/* Donuts */}
      <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-purple-700 text-lg">Por categoría</h3>
          <span className="text-xs text-purple-400 font-medium">Haz clic para agregar</span>
        </div>
        <div className="grid grid-cols-2 gap-8 mt-4">
          {/* Gastos */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={statsGastos} total={totalGastos} label="Gastos" color="#ef4444"
              currency={cuentaActual?.currency ?? "PEN"} onClick={() => setModalTipo("expense")} />
            {statsGastos.length > 0 && (
              <div className="w-full max-w-[220px] space-y-1.5">
                {statsGastos.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color || PALETTE[i % PALETTE.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-bold text-gray-700">{formatMoney(cat.value, cuentaActual?.currency)}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">
                      {totalGastos > 0 ? ((cat.value / totalGastos) * 100).toFixed(0) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Ingresos */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={statsIngresos} total={totalIngresos} label="Ingresos" color="#10b981"
              currency={cuentaActual?.currency ?? "PEN"} onClick={() => setModalTipo("income")} />
            {statsIngresos.length > 0 && (
              <div className="w-full max-w-[220px] space-y-1.5">
                {statsIngresos.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color || PALETTE[i % PALETTE.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-bold text-gray-700">{formatMoney(cat.value, cuentaActual?.currency)}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">
                      {totalIngresos > 0 ? ((cat.value / totalIngresos) * 100).toFixed(0) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales — montados en document.body via createPortal (dentro de cada componente) */}
      {showCategorias && (
        <ModalCategorias
          categorias={categorias}
          onClose={() => setShowCategorias(false)}
          onActualizado={cargarCategorias}
        />
      )}
      {modalTipo && (
        <ModalTransaccion
          tipo={modalTipo}
          cuentas={accounts}
          cuentaId={selectedAccount}
          categorias={categorias}
          onClose={() => setModalTipo(null)}
          onGuardado={() => { cargarCuentas(); cargarStats(); setModalTipo(null); }}
        />
      )}
    </div>
  );
}