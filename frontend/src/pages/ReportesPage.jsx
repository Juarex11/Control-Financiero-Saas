import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ChevronLeft, ChevronRight, ChevronDown, Check,
  TrendingUp, TrendingDown, Wallet, BarChart2,
  ArrowUpCircle, ArrowDownCircle, Activity, Pencil, Trash2,
} from "lucide-react";
import ModalTransaccion from "./transaccion/ModalTransaccion";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PALETTE = ["#31138b","#ff4d94","#ffbf2f","#10b981","#3b82f6","#f97316","#8b5cf6","#06b6d4","#ef4444","#64748b"];

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
function formatCompact(amount) {
  if (Math.abs(amount) >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return Number(amount).toFixed(0);
}

// ── Navegadores ───────────────────────────────────────────────────────────────
function WeekNavigator({ value, onChange }) {
  const label = (date) => {
    const d = new Date(date);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const lun = new Date(d); lun.setDate(d.getDate() - dow);
    const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    const f = x => `${x.getDate()} ${MESES[x.getMonth()].slice(0,3)}`;
    return `${f(lun)} — ${f(dom)} ${dom.getFullYear()}`;
  };
  const move = dir => {
    const d = new Date(value); d.setDate(d.getDate() + dir * 7);
    if (d <= new Date()) onChange(d.toISOString().split("T")[0]);
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[2px] px-2 py-1.5 shadow-sm">
      <button onClick={() => move(-1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={14} /></button>
      <span className="text-xs font-bold text-gray-700 min-w-[160px] text-center">{label(value)}</span>
      <button onClick={() => move(1)} disabled={new Date(value) >= new Date()} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><ChevronRight size={14} /></button>
    </div>
  );
}
function MonthNavigator({ mes, anio, onChange }) {
  const move = dir => {
    let m = mes + dir, a = anio;
    if (m > 11) { m = 0; a++; } if (m < 0) { m = 11; a--; }
    const now = new Date();
    if (a > now.getFullYear() || (a === now.getFullYear() && m > now.getMonth())) return;
    onChange(m, a);
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[2px] px-2 py-1.5 shadow-sm">
      <button onClick={() => move(-1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={14} /></button>
      <span className="text-xs font-bold text-gray-700 min-w-[120px] text-center">{MESES[mes]} {anio}</span>
      <button onClick={() => move(1)} disabled={anio === new Date().getFullYear() && mes === new Date().getMonth()} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><ChevronRight size={14} /></button>
    </div>
  );
}
function DayNavigator({ value, onChange }) {
  const move = dir => {
    const d = new Date(value); d.setDate(d.getDate() + dir);
    if (d <= new Date()) onChange(d.toISOString().split("T")[0]);
  };
  const label = () => {
    const d = new Date(value); const hoy = new Date(); hoy.setHours(0,0,0,0); d.setHours(0,0,0,0);
    if (d.getTime() === hoy.getTime()) return "Hoy";
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate()-1);
    if (d.getTime() === ayer.getTime()) return "Ayer";
    return `${d.getDate()} ${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  };
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[2px] px-2 py-1.5 shadow-sm">
      <button onClick={() => move(-1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={14} /></button>
      <span className="text-xs font-bold text-gray-700 min-w-[100px] text-center">{label()}</span>
      <button onClick={() => move(1)} disabled={value === new Date().toISOString().split("T")[0]} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><ChevronRight size={14} /></button>
    </div>
  );
}

// ── Selector cuenta ───────────────────────────────────────────────────────────
function CuentaSelector({ accounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const cuenta = accounts.find(a => a.id === selected) || accounts[0];
  if (!cuenta) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#31138b]/20 rounded-[2px] text-sm font-bold text-[#31138b] hover:border-[#31138b]/40 transition shadow-sm">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cuenta.color }} />
        {cuenta.name}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-[2px] shadow-xl z-20">
          {accounts.map(a => (
            <button key={a.id} onClick={() => { onChange(a.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
                ${a.id === selected ? "bg-[#31138b]/5 text-[#31138b] font-bold" : "text-gray-700 hover:bg-gray-50"}`}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} />
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

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, currency, icon: Icon, color, sub, subColor }) {
  return (
    <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-gray-800 leading-tight">{formatMoney(value, currency)}</p>
        {sub && <p className="text-xs font-semibold mt-0.5" style={{ color: subColor ?? "#6b7280" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Salud financiera ──────────────────────────────────────────────────────────
function SaludFinanciera({ ingresos, gastos, currency }) {
  const balance    = ingresos - gastos;
  const ratio      = ingresos > 0 ? (gastos / ingresos) * 100 : 0;
  const ahorro     = ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0;

  let nivel = "Excelente"; let color = "#10b981"; let pct = 100;
  if (ratio > 90)      { nivel = "Crítico";    color = "#ef4444"; pct = 10; }
  else if (ratio > 75) { nivel = "Ajustado";   color = "#f97316"; pct = 35; }
  else if (ratio > 55) { nivel = "Moderado";   color = "#ffbf2f"; pct = 60; }
  else if (ratio > 35) { nivel = "Bueno";      color = "#3b82f6"; pct = 80; }

  return (
    <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
        <Activity size={16} className="text-[#31138b]" /> Salud financiera
      </h3>
      <div className="flex items-center gap-4 mb-4">
        {/* Gauge simple */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${(pct / 100) * 239} 239`} strokeLinecap="round" style={{ transition:"stroke-dasharray .8s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold" style={{ color }}>{pct}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Nivel</span>
              <span className="font-bold" style={{ color }}>{nivel}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Ratio gasto/ingreso</span>
              <span className="font-bold text-gray-700">{ratio.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(ratio,100)}%`, background: color }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Tasa de ahorro</span>
              <span className="font-bold text-gray-700">{ahorro.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width:`${Math.max(0,ahorro)}%`, background:"#10b981" }} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400">Balance período</p>
          <p className="text-base font-extrabold" style={{ color: balance >= 0 ? "#10b981" : "#ef4444" }}>
            {formatMoney(balance, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">¿Qué recomienda?</p>
          <p className="text-xs font-semibold text-gray-600 leading-tight mt-0.5">
            {ratio > 90  ? "Reduce gastos urgente" :
             ratio > 75  ? "Revisa gastos no esenciales" :
             ratio > 55  ? "Puedes mejorar el ahorro" :
             ratio > 35  ? "Vas bien, mantén el ritmo" :
                           "Excelente disciplina 🎉"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Comparativa ───────────────────────────────────────────────────────────────
function Comparativa({ compare, currency }) {
  if (!compare) return null;
  const { actual, anterior } = compare;
  const diffIngresos = actual.ingresos - anterior.ingresos;
  const diffGastos   = actual.gastos   - anterior.gastos;
  const diffBalance  = actual.balance  - anterior.balance;

  const Fila = ({ label, actual: a, anterior: ant, diff, invert }) => {
    const positivo = invert ? diff < 0 : diff >= 0;
    return (
      <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
        <span className="text-xs font-bold text-gray-700 flex-1 text-right">{formatMoney(a, currency)}</span>
        <span className="text-xs text-gray-400 flex-1 text-right">{formatMoney(ant, currency)}</span>
        <span className={`text-xs font-bold w-20 text-right ${positivo ? "text-green-600" : "text-red-500"}`}>
          {diff >= 0 ? "+" : ""}{formatMoney(diff, currency)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <BarChart2 size={16} className="text-[#31138b]" /> Comparativa vs mes anterior
      </h3>
      <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400 font-bold">
        <span className="w-20 shrink-0" />
        <span className="flex-1 text-right">Este mes</span>
        <span className="flex-1 text-right">Mes anterior</span>
        <span className="w-20 text-right">Diferencia</span>
      </div>
      <Fila label="Ingresos"  actual={actual.ingresos} anterior={anterior.ingresos} diff={diffIngresos} invert={false} />
      <Fila label="Gastos"    actual={actual.gastos}   anterior={anterior.gastos}   diff={diffGastos}   invert={true}  />
      <Fila label="Balance"   actual={actual.balance}  anterior={anterior.balance}  diff={diffBalance}  invert={false} />
    </div>
  );
}

// ── Badge de procedencia ──────────────────────────────────────────────────────
function OrigenBadge({ t }) {
  if (t.goal_id) {
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">Meta</span>;
  }
  if (t.debt_id) {
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 shrink-0">Deuda</span>;
  }
  if (t.type === "transfer") {
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">Transferencia</span>;
  }
  if (t.category_id) {
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">Categoría</span>;
  }
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 shrink-0">Sin origen</span>;
}

// ── Historial (nuevo con procedencia y ocultar editar) ──────────────────────
function HistorialItem({ t, currency, onEdit, onDelete, deleting }) {
  const isIncome    = t.type === "income";
  const isTransfer  = t.type === "transfer";
  const puedeEditar = !t.goal_id && !t.debt_id; // no editable si viene de Meta/Deuda

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition group">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: isTransfer ? "#eff6ff" : isIncome ? "#f0fdf4" : "#fef2f2" }}>
        {isTransfer
          ? <Wallet size={14} className="text-blue-500" />
          : isIncome
          ? <ArrowUpCircle size={14} className="text-green-500" />
          : <ArrowDownCircle size={14} className="text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">
          {t.category?.name ?? t.goal?.name ?? t.debt?.name ?? (isTransfer ? "Transferencia" : "Sin categoría")}
        </p>
        <div className="flex items-center gap-1.5">
          {t.hora && <span className="text-[10px] text-gray-400 shrink-0">{t.hora}</span>}
          {t.note && <span className="text-[10px] text-gray-400 truncate">· {t.note}</span>}
        </div>
      </div>

      {/* Columna: procedencia */}
      <div className="shrink-0">
        <OrigenBadge t={t} />
      </div>

      <span className={`text-sm font-extrabold shrink-0 ${isIncome ? "text-green-600" : isTransfer ? "text-blue-600" : "text-red-500"}`}>
        {isIncome ? "+" : isTransfer ? "↔" : "-"}{formatMoney(t.amount, currency)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        {puedeEditar && (
          <button onClick={() => onEdit(t)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded text-gray-400 hover:text-[#31138b] transition">
            <Pencil size={12} />
          </button>
        )}
        <button onClick={() => onDelete(t.id)} disabled={deleting === t.id}
          className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition">
          {deleting === t.id
            ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
            : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const hoy = new Date().toISOString().split("T")[0];

  const [accounts,        setAccounts]        = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [categorias,      setCategorias]      = useState([]);
  const [filtro,          setFiltro]           = useState("mes");
  const [diaActual,       setDiaActual]        = useState(hoy);
  const [semanaRef,       setSemanaRef]        = useState(hoy);
  const [mesActual,       setMesActual]        = useState(new Date().getMonth());
  const [anioActual,      setAnioActual]       = useState(new Date().getFullYear());
  const [periodoDesde,    setPeriodoDesde]     = useState("");
  const [periodoHasta,    setPeriodoHasta]     = useState("");

  const [stats,     setStats]     = useState(null);
  const [historial, setHistorial] = useState({});
  const [compare,   setCompare]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [editTx,    setEditTx]    = useState(null);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [rA, rC] = await Promise.all([
          fetch(`${API_URL}/accounts`,   { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const [dA, dC] = await Promise.all([rA.json(), rC.json()]);
        if (Array.isArray(dA) && dA.length > 0) {
          setAccounts(dA);
          setSelectedAccount((dA.find(a => a.is_primary) || dA[0]).id);
        }
        setCategorias(Array.isArray(dC) ? dC : []);
      } catch {}
    };
    cargar();
  }, []);

  // ── Parámetros de fecha ───────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ filtro, account_id: selectedAccount });
    if (filtro === "dia")    p.append("dia", diaActual);
    if (filtro === "semana") p.append("semana_ref", semanaRef);
    if (filtro === "mes")    { p.append("mes", mesActual + 1); p.append("anio", anioActual); }
    if (filtro === "periodo" && periodoDesde && periodoHasta) {
      p.append("desde", periodoDesde); p.append("hasta", periodoHasta);
    }
    return p;
  }, [filtro, selectedAccount, diaActual, semanaRef, mesActual, anioActual, periodoDesde, periodoHasta]);

  // ── Cargar datos ──────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const p = buildParams();
      const [rS, rH] = await Promise.all([
        fetch(`${API_URL}/transactions/stats?${p}`,   { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/transactions/history?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [dS, dH] = await Promise.all([rS.json(), rH.json()]);
      setStats(dS);
      setHistorial(typeof dH === "object" && !Array.isArray(dH) ? dH : {});

      // Comparativa solo en vista mes
      if (filtro === "mes") {
        const rC = await fetch(`${API_URL}/transactions/compare?account_id=${selectedAccount}&mes=${mesActual+1}&anio=${anioActual}`,
          { headers: { Authorization: `Bearer ${getToken()}` } });
        setCompare(await rC.json());
      } else {
        setCompare(null);
      }
    } catch {} finally { setLoading(false); }
  }, [buildParams, selectedAccount, filtro, mesActual, anioActual]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Eliminar transacción ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargarDatos();
    } finally { setDeleting(null); }
  };

  // ── Datos derivados ───────────────────────────────────────────────────────
  const cuenta      = accounts.find(a => a.id === selectedAccount);
  const currency    = cuenta?.currency ?? "PEN";
  const gastos      = stats?.gastos    ?? [];
  const ingresos    = stats?.ingresos  ?? [];
  const totalG      = useMemo(() => gastos.reduce((s, c)   => s + Number(c.value), 0), [gastos]);
  const totalI      = useMemo(() => ingresos.reduce((s, c) => s + Number(c.value), 0), [ingresos]);
  const balance     = totalI - totalG;

  // Datos para gráfico general (barras + línea)
  const chartGeneral = useMemo(() => {
    const all = [...gastos.map(c => ({ name: c.name, Gastos: c.value, Ingresos: 0 }))];
    ingresos.forEach(c => {
      const existing = all.find(x => x.name === c.name);
      if (existing) existing.Ingresos = c.value;
      else all.push({ name: c.name, Gastos: 0, Ingresos: c.value });
    });
    return all.map(x => ({ ...x, Balance: x.Ingresos - x.Gastos }));
  }, [gastos, ingresos]);

  // Días del historial ordenados
  const diasOrdenados = useMemo(() =>
    Object.keys(historial).sort((a, b) => new Date(b) - new Date(a)),
  [historial]);

  const FILTROS = [
    { key: "dia", label: "Día" }, { key: "semana", label: "Semana" },
    { key: "mes", label: "Mes" }, { key: "periodo", label: "Período" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-[2px] px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-bold" style={{ color: p.color }}>{formatMoney(p.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Análisis</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Reportes</h1>
        </div>
        {accounts.length > 1 && (
          <CuentaSelector accounts={accounts} selected={selectedAccount} onChange={setSelectedAccount} />
        )}
      </div>

      {/* Separador */}
      <div className="flex rounded-[2px] overflow-hidden h-1">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Filtros + Navegador */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white p-1 rounded-[2px] shadow-sm border border-gray-200">
          {FILTROS.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition
                ${filtro === key ? "bg-[#31138b] text-white shadow" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {filtro === "dia"    && <DayNavigator   value={diaActual} onChange={setDiaActual} />}
        {filtro === "semana" && <WeekNavigator  value={semanaRef} onChange={setSemanaRef} />}
        {filtro === "mes"    && <MonthNavigator mes={mesActual} anio={anioActual} onChange={(m, a) => { setMesActual(m); setAnioActual(a); }} />}
        {filtro === "periodo" && (
          <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-200 rounded-[2px] px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Desde</label>
              <input type="date" value={periodoDesde} onChange={e => setPeriodoDesde(e.target.value)} max={hoy}
                className="border border-gray-200 rounded-[2px] px-2 py-1 text-xs outline-none focus:border-[#31138b]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Hasta</label>
              <input type="date" value={periodoHasta} onChange={e => setPeriodoHasta(e.target.value)} max={hoy}
                className="border border-gray-200 rounded-[2px] px-2 py-1 text-xs outline-none focus:border-[#31138b]" />
            </div>
          </div>
        )}

        {loading && <div className="w-5 h-5 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ingresos" value={totalI} currency={currency} icon={TrendingUp}    color="#10b981" />
        <KpiCard label="Gastos"   value={totalG} currency={currency} icon={TrendingDown}  color="#ef4444" />
        <KpiCard label="Balance"  value={balance} currency={currency} icon={Wallet}       color={balance >= 0 ? "#31138b" : "#ef4444"}
          sub={balance >= 0 ? "Superávit ↑" : "Déficit ↓"} subColor={balance >= 0 ? "#10b981" : "#ef4444"} />
        <KpiCard label="Categorías activas" value={gastos.length + ingresos.length} currency={currency}
          icon={BarChart2} color="#ff4d94"
          sub={`${gastos.length} gastos · ${ingresos.length} ingresos`} />
      </div>

      {/* Gráfico general — barras + línea balance */}
      {chartGeneral.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Ingresos vs Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartGeneral} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[3,3,0,0]} maxBarSize={40} />
              <Bar dataKey="Gastos"   fill="#ef4444" radius={[3,3,0,0]} maxBarSize={40} />
              <Line type="monotone" dataKey="Balance" stroke="#31138b" strokeWidth={2} dot={{ fill:"#31138b", r:3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico gastos + ingresos por categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gastos */}
        {gastos.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" /> Solo Gastos
            </h3>
            <div className="flex gap-4 items-center">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gastos} cx="50%" cy="50%" innerRadius={28} outerRadius={50}
                      paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {gastos.map((e, i) => <Cell key={i} fill={e.color || PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 max-h-40 overflow-y-auto">
                {gastos.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || PALETTE[i % PALETTE.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-bold text-gray-700">{formatMoney(c.value, currency)}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">
                      {totalG > 0 ? ((c.value / totalG) * 100).toFixed(0) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ingresos */}
        {ingresos.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Solo Ingresos
            </h3>
            <div className="flex gap-4 items-center">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ingresos} cx="50%" cy="50%" innerRadius={28} outerRadius={50}
                      paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {ingresos.map((e, i) => <Cell key={i} fill={e.color || PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 max-h-40 overflow-y-auto">
                {ingresos.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || PALETTE[i % PALETTE.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-bold text-gray-700">{formatMoney(c.value, currency)}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">
                      {totalI > 0 ? ((c.value / totalI) * 100).toFixed(0) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Salud + Comparativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SaludFinanciera ingresos={totalI} gastos={totalG} currency={currency} />
        {compare && <Comparativa compare={compare} currency={currency} />}
      </div>

      {/* Historial agrupado por día */}
      {diasOrdenados.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Historial de transacciones</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {diasOrdenados.map(dia => {
              const txs      = historial[dia] ?? [];
              const subI     = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
              const subG     = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
              const dObj     = new Date(dia + "T12:00:00");
              const hoyD     = new Date(); hoyD.setHours(0,0,0,0); dObj.setHours(0,0,0,0);
              const ayerD    = new Date(hoyD); ayerD.setDate(hoyD.getDate()-1);
              const labelDia = dObj.getTime() === hoyD.getTime() ? "Hoy"
                             : dObj.getTime() === ayerD.getTime() ? "Ayer"
                             : `${dObj.getDate()} ${MESES[dObj.getMonth()]} ${dObj.getFullYear()}`;
              return (
                <div key={dia}>
                  {/* Cabecera del día */}
                  <div className="flex items-center justify-between px-5 py-2 bg-gray-50">
                    <span className="text-xs font-bold text-gray-600">{labelDia}</span>
                    <div className="flex items-center gap-4 text-[10px]">
                      {subI > 0 && <span className="text-green-600 font-bold">+{formatMoney(subI, currency)}</span>}
                      {subG > 0 && <span className="text-red-500 font-bold">-{formatMoney(subG, currency)}</span>}
                    </div>
                  </div>
                  {/* Transacciones del día */}
                  <div className="divide-y divide-gray-50">
                    {txs.map(t => (
                      <HistorialItem key={t.id} t={t} currency={currency}
                        onEdit={(tx) => setEditTx(tx)}
                        onDelete={handleDelete}
                        deleting={deleting} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {diasOrdenados.length === 0 && !loading && (
        <div className="bg-white border border-gray-100 rounded-[2px] shadow-sm p-10 text-center">
          <BarChart2 size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Sin transacciones en este período.</p>
        </div>
      )}

      {/* Modal editar */}
      {editTx && (
        <ModalTransaccion
          tipo={editTx.type}
          cuentas={accounts}
          cuentaId={editTx.account_id}
          categorias={categorias}
          onClose={() => setEditTx(null)}
          onGuardado={() => { setEditTx(null); cargarDatos(); }}
        />
      )}
    </div>
  );
}