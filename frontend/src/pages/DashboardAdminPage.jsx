import { useState, useEffect, useCallback } from "react";
import {
  Users, ShieldCheck, TrendingUp, UserPlus,
  Briefcase, Target, CreditCard, Globe,
  BarChart2, RefreshCw, Calendar,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

// ── Labels legibles ───────────────────────────────────────────────────────────
const ACTIVIDAD_LABEL = {
  dependiente:   "Dependiente",
  independiente: "Independiente",
  empresario:    "Empresario",
  estudiante:    "Estudiante",
};
const FINALIDAD_LABEL = {
  personal:   "Control personal",
  familiar:   "Familia",
  negocio:    "Mi negocio",
  metas_vida: "Metas de vida",
  educacion:  "Educación",
  digital:    "Todo en un lugar",
};
const META_LABEL = {
  ahorrar:    "Ahorrar dinero",
  deudas:     "Reducir deudas",
  emergencia: "Fondo emergencia",
  compra:     "Gran compra",
  controlar:  "Control de gastos",
  ordenar:    "Ordenar finanzas",
};
const DIAS_CORTOS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ── Colores para gráficas ─────────────────────────────────────────────────────
const COLORS = ["#31138b","#ff4d94","#ffbf2f","#10b981","#3b82f6","#f97316","#8b5cf6"];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs font-bold text-gray-400 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Barra horizontal ──────────────────────────────────────────────────────────
function BarraH({ label, value, max, color, total }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const pctTotal = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700 truncate max-w-[160px]">{label}</span>
        <span className="font-bold shrink-0 ml-2" style={{ color }}>{value} <span className="text-gray-400 font-normal">({pctTotal}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Mini gráfica de línea (sparkline SVG) ─────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length === 0) return null;
  const max   = Math.max(...data.map(d => d.total), 1);
  const W     = 300;
  const H     = 60;
  const pad   = 4;
  const step  = (W - pad * 2) / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: pad + i * step,
    y: H - pad - ((d.total / max) * (H - pad * 2)),
  }));

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#31138b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#31138b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={path} fill="none" stroke="#31138b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#31138b" />
      ))}
    </svg>
  );
}

// ── Donut pequeño ─────────────────────────────────────────────────────────────
function MiniDonut({ segments, size = 80 }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (total === 0) return <div className="w-20 h-20 rounded-full bg-gray-100" />;

  const r   = 28;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const pct  = seg.value / total;
    const dash = pct * circ;
    const arc  = { ...seg, dash, offset, color: seg.color || COLORS[i % COLORS.length] };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="10"
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={-arc.offset + circ * 0.25}
          strokeLinecap="butt"
        />
      ))}
      <circle cx={cx} cy={cy} r="18" fill="white" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#374151">
        {total}
      </text>
    </svg>
  );
}

// ── Sección con título ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
        <Icon size={15} className="text-purple-400" /> {title}
      </h3>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = "h-24" }) {
  return <div className={`${h} bg-gray-100 rounded-2xl animate-pulse`} />;
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardAdminPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Error al cargar estadísticas");
      setStats(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const r = stats?.resumen;

  // Preparar datos para gráficas
  const maxActividad = stats ? Math.max(...(stats.actividades?.map(a => a.total) || [1])) : 1;
  const maxFinalidad = stats ? Math.max(...(stats.finalidades?.map(f => f.total) || [1])) : 1;
  const maxMeta      = stats ? Math.max(...(stats.metas?.map(m => m.total) || [1])) : 1;

  const deudaSegments = stats ? [
    { label: "Con deudas", value: stats.deudas.con, color: "#ff4d94" },
    { label: "Sin deudas", value: stats.deudas.sin, color: "#10b981" },
  ] : [];

  const actividadSegments = stats?.actividades?.map((a, i) => ({
    label: ACTIVIDAD_LABEL[a.label] || a.label,
    value: a.total,
    color: COLORS[i % COLORS.length],
  })) || [];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)" }}>

      {/* Título */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium" style={{ color: "#31138b" }}>{saludo}</p>
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          {user.name?.split(" ")[0]}, <span className="font-normal text-gray-600">panel de administración</span>
        </h1>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
          {error} — <button onClick={cargar} className="underline font-bold">reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skel key={i} />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skel key={i} h="h-48" />)}
          </div>
        </div>
      ) : stats && (
        <>
          {/* ── Fila 1: Stats rápidas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total usuarios"   value={r.total}         Icon={Users}     color="#31138b" />
            <StatCard label="Nuevos hoy"       value={r.nuevos_hoy}    Icon={UserPlus}  color="#ff4d94" sub={`${r.nuevos_semana} esta semana`} />
            <StatCard label="Este mes"         value={r.nuevos_mes}    Icon={Calendar}  color="#ffbf2f" />
            <StatCard label="Con onboarding"   value={r.con_onboarding} Icon={ShieldCheck} color="#10b981"
              sub={`${r.total > 0 ? Math.round((r.con_onboarding / r.total) * 100) : 0}% completado`} />
          </div>

          {/* ── Fila 2: Registros últimos 7 días ── */}
          <Section title="Registros últimos 7 días" icon={TrendingUp}>
            <div className="space-y-1">
              <Sparkline data={stats.registros} />
              <div className="flex justify-between">
                {stats.registros?.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold text-gray-700">{d.total}</span>
                    <span className="text-[9px] text-gray-400">
                      {DIAS_CORTOS[new Date(d.dia + "T12:00:00").getDay()]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Fila 3: Distribuciones onboarding ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Actividad */}
            <Section title="Actividad principal" icon={Briefcase}>
              <div className="flex items-center gap-4">
                <MiniDonut segments={actividadSegments} />
                <div className="flex-1 space-y-2">
                  {actividadSegments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                      <span className="flex-1 text-gray-600 truncate">{a.label}</span>
                      <span className="font-bold text-gray-700">{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Deudas */}
            <Section title="¿Tienen deudas?" icon={CreditCard}>
              <div className="flex items-center gap-4">
                <MiniDonut segments={deudaSegments} />
                <div className="flex-1 space-y-3">
                  {deudaSegments.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{d.label}</span>
                        <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${stats.deudas.con + stats.deudas.sin > 0
                              ? Math.round((d.value / (stats.deudas.con + stats.deudas.sin)) * 100)
                              : 0}%`,
                            background: d.color,
                          }} />
                      </div>
                    </div>
                  ))}
                  {stats.deudas.con > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Número más frecuente: —
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* Finalidad */}
            <Section title="¿Para qué usan la app?" icon={Target}>
              <div className="space-y-2.5">
                {stats.finalidades?.length > 0 ? stats.finalidades.map((f, i) => (
                  <BarraH
                    key={i}
                    label={FINALIDAD_LABEL[f.label] || f.label}
                    value={f.total}
                    max={maxFinalidad}
                    total={r.con_onboarding}
                    color={COLORS[i % COLORS.length]}
                  />
                )) : (
                  <p className="text-xs text-gray-400 text-center py-4">Sin datos aún</p>
                )}
              </div>
            </Section>

            {/* Metas */}
            <Section title="Metas más elegidas" icon={BarChart2}>
              <div className="space-y-2.5">
                {stats.metas?.length > 0 ? stats.metas.slice(0, 6).map((m, i) => (
                  <BarraH
                    key={i}
                    label={META_LABEL[m.label] || m.label}
                    value={m.total}
                    max={maxMeta}
                    total={r.con_onboarding}
                    color={COLORS[i % COLORS.length]}
                  />
                )) : (
                  <p className="text-xs text-gray-400 text-center py-4">Sin datos aún</p>
                )}
              </div>
            </Section>

            {/* Actividad barras */}
            <Section title="Tipo de actividad" icon={RefreshCw}>
              <div className="space-y-2.5">
                {stats.actividades?.length > 0 ? stats.actividades.map((a, i) => (
                  <BarraH
                    key={i}
                    label={ACTIVIDAD_LABEL[a.label] || a.label}
                    value={a.total}
                    max={maxActividad}
                    total={r.con_onboarding}
                    color={COLORS[i % COLORS.length]}
                  />
                )) : (
                  <p className="text-xs text-gray-400 text-center py-4">Sin datos aún</p>
                )}
              </div>
            </Section>

            {/* Países */}
            <Section title="Países" icon={Globe}>
              <div className="space-y-2.5">
                {stats.paises?.length > 0 ? stats.paises.map((p, i) => (
                  <BarraH
                    key={i}
                    label={p.label}
                    value={p.total}
                    max={stats.paises[0]?.total || 1}
                    total={r.total}
                    color={COLORS[i % COLORS.length]}
                  />
                )) : (
                  <p className="text-xs text-gray-400 text-center py-4">Sin datos de países aún</p>
                )}
              </div>
            </Section>

          </div>

          {/* ── Nota onboarding ── */}
          {r.con_onboarding < r.total && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-700">
                  {r.total - r.con_onboarding} usuarios sin completar onboarding
                </p>
                <p className="text-xs text-amber-500">
                  Las estadísticas de actividad, metas y finalidad solo incluyen usuarios que completaron el proceso.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}