import { useState, useEffect } from "react";
import {
  Briefcase, ChevronRight, ChevronLeft, Check,
  BarChart2, PiggyBank, Layers, CreditCard,
  Zap, BookOpen, Home, Shield,
  User, Smartphone, TrendingUp, Search,
} from "lucide-react";

// ─── PAÍSES ──────────────────────────────────────────────────────────────────
const PAISES = [
  { value: "Argentina",            label: "Argentina",            code: "AR", tz: "America/Argentina/Buenos_Aires", tel: "+54"  },
  { value: "Bolivia",              label: "Bolivia",              code: "BO", tz: "America/La_Paz",                 tel: "+591" },
  { value: "Chile",                label: "Chile",                code: "CL", tz: "America/Santiago",               tel: "+56"  },
  { value: "Colombia",             label: "Colombia",             code: "CO", tz: "America/Bogota",                 tel: "+57"  },
  { value: "Costa Rica",           label: "Costa Rica",           code: "CR", tz: "America/Costa_Rica",             tel: "+506" },
  { value: "Cuba",                 label: "Cuba",                 code: "CU", tz: "America/Havana",                 tel: "+53"  },
  { value: "Ecuador",              label: "Ecuador",              code: "EC", tz: "America/Guayaquil",              tel: "+593" },
  { value: "El Salvador",          label: "El Salvador",          code: "SV", tz: "America/El_Salvador",            tel: "+503" },
  { value: "España",               label: "España",               code: "ES", tz: "Europe/Madrid",                  tel: "+34"  },
  { value: "Guatemala",            label: "Guatemala",            code: "GT", tz: "America/Guatemala",              tel: "+502" },
  { value: "Honduras",             label: "Honduras",             code: "HN", tz: "America/Tegucigalpa",            tel: "+504" },
  { value: "México",               label: "México",               code: "MX", tz: "America/Mexico_City",            tel: "+52"  },
  { value: "Nicaragua",            label: "Nicaragua",            code: "NI", tz: "America/Managua",                tel: "+505" },
  { value: "Panamá",               label: "Panamá",               code: "PA", tz: "America/Panama",                 tel: "+507" },
  { value: "Paraguay",             label: "Paraguay",             code: "PY", tz: "America/Asuncion",               tel: "+595" },
  { value: "Perú",                 label: "Perú",                 code: "PE", tz: "America/Lima",                   tel: "+51"  },
  { value: "Puerto Rico",          label: "Puerto Rico",          code: "PR", tz: "America/Puerto_Rico",            tel: "+1"   },
  { value: "República Dominicana", label: "República Dominicana", code: "DO", tz: "America/Santo_Domingo",          tel: "+1"   },
  { value: "Uruguay",              label: "Uruguay",              code: "UY", tz: "America/Montevideo",             tel: "+598" },
  { value: "Venezuela",            label: "Venezuela",            code: "VE", tz: "America/Caracas",                tel: "+58"  },
];

// ─── PASOS ──────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "País"      },
  { id: 2, label: "Actividad" },
  { id: 3, label: "Metas"     },
  { id: 4, label: "Deudas"    },
  { id: 5, label: "Finalidad" },
];
const TOTAL = STEPS.length;

// ─── OPCIONES ─────────────────────────────────────────────────────────────────
const ACTIVIDADES = [
  { value: "dependiente",   label: "Dependiente",   desc: "Relación de dependencia",   Icon: Briefcase },
  { value: "independiente", label: "Independiente", desc: "Cuenta propia o freelance",  Icon: Zap       },
  { value: "empresario",    label: "Empresario",    desc: "Negocio o empresa propia",   Icon: BarChart2 },
  { value: "estudiante",    label: "Estudiante",    desc: "Estudio y/o trabajo",        Icon: BookOpen  },
];

const METAS = [
  { value: "ahorrar",    label: "Ahorrar dinero",    Icon: PiggyBank  },
  { value: "deudas",     label: "Reducir deudas",    Icon: CreditCard },
  { value: "emergencia", label: "Fondo emergencia",  Icon: Shield     },
  { value: "compra",     label: "Gran compra",       Icon: Home       },
  { value: "controlar",  label: "Control de gastos", Icon: BarChart2  },
  { value: "ordenar",    label: "Ordenar finanzas",  Icon: Layers     },
];

const FINALIDADES = [
  { value: "personal",   label: "Control personal",  desc: "Finanzas personales ordenadas",     Icon: User       },
  { value: "familiar",   label: "Familia",           desc: "Gastos e ingresos del hogar",       Icon: Home       },
  { value: "negocio",    label: "Mi negocio",        desc: "Apoyo a mi emprendimiento",         Icon: Briefcase  },
  { value: "metas_vida", label: "Metas de vida",     desc: "Objetivos a largo plazo",           Icon: TrendingUp },
  { value: "educacion",  label: "Educación",         desc: "Aprender a gestionar mi dinero",    Icon: BookOpen   },
  { value: "digital",    label: "Todo en un lugar",  desc: "Centralizar ingresos y gastos",     Icon: Smartphone },
];

// ─── TEXTOS POR PASO ────────────────────────────────────────────────────────
const STEP_COPY = [
  { title: "¿Desde qué país nos visitas?", sub: "Usamos esto para tu moneda y zona horaria." },
  { title: "¿A qué te dedicas?",           sub: "Cuéntanos sobre tu actividad principal."          },
  { title: "¿Qué quieres lograr?",         sub: "Elige una o más metas financieras."               },
  { title: "¿Tienes deudas activas?",      sub: "Esto nos ayuda a darte alertas precisas."         },
  { title: "¿Para qué usarás la app?",     sub: "Personalizamos tu experiencia según tu objetivo." },
];

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgressBar({ current }) {
  return (
    <div className="flex items-center mb-4">
      {STEPS.map((s, i) => {
        const isDone   = s.id < current;
        const isActive = s.id === current;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200"
                style={
                  isDone   ? { background: "#31138b", color: "#fff" }
                  : isActive ? { background: "#ff4d94", color: "#fff", boxShadow: "0 0 0 3px rgba(255,77,148,.18)" }
                  : { background: "transparent", border: "1.5px solid #d1d5db", color: "#9ca3af" }
                }
              >
                {isDone ? <Check size={12} /> : s.id}
              </div>
              <span
                className="text-[10px] font-semibold mt-1 hidden sm:block"
                style={{ color: isDone ? "#31138b" : isActive ? "#ff4d94" : "#9ca3af" }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-[2px] mb-3 transition-all duration-300"
                style={{ background: isDone ? "#31138b" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PASO 1 (PAÍS) con mejor responsive ────────────────────────────────────
function Step0({ data, set, loading, expanded, setExpanded, search, setSearch }) {
  const detected = PAISES.find(p => p.value === data.pais);

  const ordered = detected
    ? [detected, ...PAISES.filter(p => p.value !== detected.value)]
    : PAISES;

  const filtered = ordered.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-8 h-8 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Detectando tu país...</p>
      </div>
    );
  }

  if (detected && !expanded) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div
          className="w-full flex items-center gap-4 p-4 sm:p-5"
          style={{ border: "2px solid #31138b", background: "rgba(49,19,139,.05)" }}
        >
          <img
            src={`https://flagcdn.com/48x36/${detected.code.toLowerCase()}.png`}
            alt={detected.label}
            className="w-12 h-8 sm:w-14 sm:h-10 object-cover rounded-sm shrink-0"
          />
          <div className="flex-1">
            <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{detected.label}</p>
          </div>
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#31138b" }}
          >
            <Check size={16} className="text-white" />
          </div>
        </div>

        <button
          onClick={() => setExpanded(true)}
          className="text-sm font-semibold text-gray-500 hover:text-[#31138b] transition"
        >
          ¿No es tu país? Elegir otro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3 shrink-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#31138b]"
        />
      </div>
      <div className="flex-1 overflow-y-auto max-h-[220px] sm:max-h-[280px] pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr">
          {filtered.map(({ value, label, code }) => {
            const sel = data.pais === value;
            return (
              <button
                key={value}
                onClick={() => { set("pais", value); setExpanded(false); }}
                className="text-left flex items-center gap-2 p-2 transition-all duration-150 min-h-[44px]"
                style={sel
                  ? { border: "2px solid #31138b", background: "rgba(49,19,139,.05)" }
                  : { border: "1px solid #e5e7eb", background: "#fff" }}
              >
                <img
                  src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
                  alt={label}
                  className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                />
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{label}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 sm:col-span-3 text-center text-sm text-gray-400 mt-2">
              No se encontraron países
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PASO 2 (ACTIVIDAD) ─────────────────────────────────────────────────────
function Step2({ data, set }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ACTIVIDADES.map(({ value, label, desc, Icon }) => {
        const sel = data.actividad === value;
        return (
          <button
            key={value}
            onClick={() => set("actividad", value)}
            className="text-left flex items-center gap-4 p-4 transition-all duration-150"
            style={sel
              ? { border: "2px solid #31138b", background: "rgba(49,19,139,.05)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: sel ? "#31138b" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── PASO 3 (METAS) ─────────────────────────────────────────────────────────
function Step3({ data, set }) {
  const toggle = (val) => {
    const prev = data.metas || [];
    set("metas", prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {METAS.map(({ value, label, Icon }) => {
        const sel = (data.metas || []).includes(value);
        return (
          <button
            key={value}
            onClick={() => toggle(value)}
            className="flex flex-col items-center gap-2 text-center p-3 transition-all duration-150"
            style={sel
              ? { border: "2px solid #ffbf2f", background: "rgba(255,191,47,.06)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: sel ? "#ffbf2f" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={15} />
            </div>
            <p className="text-xs font-semibold leading-tight"
               style={{ color: sel ? "#92650a" : "#374151" }}>
              {label}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── PASO 4 (DEUDAS) ────────────────────────────────────────────────────────
function Step4({ data, set }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { value: true,  label: "Sí, tengo deudas", desc: "Tarjetas, préstamos u otros", color: "#ff4d94" },
          { value: false, label: "No, estoy libre",   desc: "Sin compromisos pendientes",  color: "#31138b" },
        ].map(({ value, label, desc, color }) => {
          const sel = data.deudas === value;
          return (
            <button
              key={String(value)}
              onClick={() => { set("deudas", value); if (!value) set("num_deudas", ""); }}
              className="flex flex-col items-center gap-2 p-4 text-center transition-all duration-150"
              style={sel
                ? { border: `2px solid ${color}`, background: `${color}08` }
                : { border: "1px solid #e5e7eb", background: "#fff" }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: sel ? color : "#f3f4f6" }}
              >
                <CreditCard size={20} style={{ color: sel ? "#fff" : "#6b7280" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {data.deudas === true && (
        <div className="p-4 flex flex-wrap items-center gap-3"
             style={{ border: "1px dashed rgba(255,77,148,.35)", background: "rgba(255,77,148,.03)" }}>
          <p className="text-sm font-semibold text-gray-600 shrink-0">¿Cuántas?</p>
          <div className="flex flex-wrap gap-2">
            {["1", "2", "3", "4", "5+"].map(n => (
              <button
                key={n}
                onClick={() => set("num_deudas", n)}
                className="w-10 h-10 text-sm font-semibold transition-all duration-150"
                style={data.num_deudas === n
                  ? { border: "2px solid #ff4d94", background: "#ff4d94", color: "#fff" }
                  : { border: "1px solid #e5e7eb", background: "#fff", color: "#374151" }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PASO 5 (FINALIDAD) ─────────────────────────────────────────────────────
function Step5({ data, set }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {FINALIDADES.map(({ value, label, desc, Icon }) => {
        const sel = data.finalidad === value;
        return (
          <button
            key={value}
            onClick={() => set("finalidad", value)}
            className="text-left flex items-center gap-4 p-4 transition-all duration-150"
            style={sel
              ? { border: "2px solid #31138b", background: "rgba(49,19,139,.05)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: sel ? "#31138b" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── PANTALLA FINAL ──────────────────────────────────────────────────────────
function Done() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-6 px-4 bg-[#f7f7fb]">
      <img src="/logo.png" alt="Logo" className="h-16 sm:h-20 object-contain" />

      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">¡Todo listo!</h2>
        <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
          Bienvenido a <span className="font-semibold text-gray-700">Control Financiero</span>.
          Tu perfil está configurado.
        </p>
      </div>

      <div className="flex w-full max-w-xs h-[2px]">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      <button
        onClick={() => window.location.href = "/dashboard"}
        className="px-8 py-2.5 text-white text-sm sm:text-base font-semibold flex items-center gap-2 transition hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#31138b 0%,#ff4d94 100%)" }}
      >
        Ir al dashboard <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [loadingCountry, setLoadingCountry] = useState(true);
  const [countryExpanded, setCountryExpanded] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
const [data, setData] = useState({
  pais: "",
  actividad: "",
  metas: [],
  deudas: null,
  num_deudas: "",
  finalidad: "",
});
  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("Error en la API");
        const info = await res.json();
        const countryCode = info.country_code;
        if (countryCode) {
          const found = PAISES.find(p => p.code === countryCode);
        if (found) {
  setData(prev => ({ ...prev, pais: found.value }));
}else {
            setCountryExpanded(true);
          }
        } else {
          setCountryExpanded(true);
        }
      } catch (error) {
        console.warn("No se pudo detectar el país:", error);
        setCountryExpanded(true);
      } finally {
        setLoadingCountry(false);
      }
    };
    detectCountry();
  }, []);

  const canNext = () => {
    if (step === 1) return !!data.pais;
    if (step === 2) return !!data.actividad;
    if (step === 3) return (data.metas || []).length > 0;
    if (step === 4) return data.deudas !== null;
    if (step === 5) return !!data.finalidad;
    return true;
  };

  const next = () => {
    if (step < TOTAL) setStep(s => s + 1);
    else { setDone(true); onComplete?.(data); }
  };

  if (done) return <Done />;

  const { title, sub } = STEP_COPY[step - 1];

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-screen justify-center">

      <div className="flex justify-center mb-4 sm:mb-6">
        <img src="/logo.png" alt="Logo" className="h-16 sm:h-20 object-contain" />
      </div>

      <ProgressBar current={step} />

      <div className="mb-4">
        <span
          className="inline-flex items-center px-3 py-[2px] text-[10px] sm:text-[11px] font-semibold mb-1.5"
          style={{ background: "rgba(49,19,139,.08)", color: "#31138b" }}
        >
          Paso {step} de {TOTAL}
        </span>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{title}</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1">{sub}</p>
      </div>

      <div className="flex-1 min-h-[220px]">
        {step === 1 && (
          <Step0
            data={data}
            set={set}
            loading={loadingCountry}
            expanded={countryExpanded}
            setExpanded={setCountryExpanded}
            search={searchCountry}
            setSearch={setSearchCountry}
          />
        )}
        {step === 2 && <Step2 data={data} set={set} />}
        {step === 3 && <Step3 data={data} set={set} />}
        {step === 4 && <Step4 data={data} set={set} />}
        {step === 5 && <Step5 data={data} set={set} />}
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-4">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold
                       text-gray-600 hover:bg-gray-100 transition"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <ChevronLeft size={14} /> Atrás
          </button>
        ) : <div />}

        <button
          onClick={next}
          disabled={!canNext()}
          className="flex items-center gap-2 px-5 py-2 text-sm sm:text-base font-semibold
                     text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canNext() ? "linear-gradient(135deg,#31138b 0%,#ff4d94 100%)" : "#e5e7eb",
            color: canNext() ? "#fff" : "#9ca3af",
          }}
        >
          {step === TOTAL
            ? <><Check size={14} /> Finalizar</>
            : <>Continuar <ChevronRight size={14} /></>
          }
        </button>
      </div>
    </div>
  );
}