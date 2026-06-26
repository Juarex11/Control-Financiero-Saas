import { useState } from "react";
import {
  Briefcase, ChevronRight, ChevronLeft, Check,
  BarChart2, PiggyBank, Layers, CreditCard,
  Zap, BookOpen, Home, Shield,
  User, Smartphone, TrendingUp,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Actividad" },
  { id: 2, label: "Ingresos"  },
  { id: 3, label: "Metas"     },
  { id: 4, label: "Deudas"    },
  { id: 5, label: "Finalidad" },
];
const TOTAL = STEPS.length;

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

const STEP_COPY = [
  { title: "¿A qué te dedicas?",       sub: "Cuéntanos sobre tu actividad principal."          },
  { title: "Tus ingresos",             sub: "Ingresa tu ingreso mensual aproximado."            },
  { title: "¿Qué quieres lograr?",     sub: "Elige una o más metas financieras."               },
  { title: "¿Tienes deudas activas?",  sub: "Esto nos ayuda a darte alertas precisas."         },
  { title: "¿Para qué usarás la app?", sub: "Personalizamos tu experiencia según tu objetivo." },
];

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
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-200"
                style={
                  isDone   ? { background: "#31138b", color: "#fff" }
                  : isActive ? { background: "#ff4d94", color: "#fff", boxShadow: "0 0 0 3px rgba(255,77,148,.18)" }
                  : { background: "transparent", border: "1px solid #d1d5db", color: "#9ca3af" }
                }
              >
                {isDone ? <Check size={10} /> : s.id}
              </div>
              <span
                className="text-[9px] font-semibold mt-0.5 hidden sm:block"
                style={{ color: isDone ? "#31138b" : isActive ? "#ff4d94" : "#9ca3af" }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-[1.5px] mb-3 transition-all duration-300"
                style={{ background: isDone ? "#31138b" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Paso 1 ───────────────────────────────────────────────────────────────────
function Step1({ data, set }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACTIVIDADES.map(({ value, label, desc, Icon }) => {
        const sel = data.actividad === value;
        return (
          <button
            key={value}
            onClick={() => set("actividad", value)}
            className="text-left flex items-center gap-3 p-3 transition-all duration-150"
            style={sel
              ? { border: "1.5px solid #31138b", background: "rgba(49,19,139,.05)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{ background: sel ? "#31138b" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Paso 2 ───────────────────────────────────────────────────────────────────
function Step2({ data, set }) {
  return (
    <div className="pt-2 pb-1">
      <div className="relative">
        <span className="absolute left-0 bottom-[8px] text-[22px] font-light text-gray-300">S/</span>
        <input
          type="number"
          inputMode="decimal"
          value={data.monto}
          onChange={e => set("monto", e.target.value)}
          placeholder="0"
          className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-[#31138b]
                     outline-none text-[34px] font-light text-gray-900 pl-9 pb-2 pt-1
                     transition-colors duration-200 placeholder:text-gray-200"
          style={{ letterSpacing: "-0.02em" }}
        />
      </div>
      <p className="text-[11px] text-gray-500 mt-2">
        Dato opcional — solo personaliza tu experiencia.
      </p>
    </div>
  );
}

// ─── Paso 3 ───────────────────────────────────────────────────────────────────
function Step3({ data, set }) {
  const toggle = (val) => {
    const prev = data.metas || [];
    set("metas", prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {METAS.map(({ value, label, Icon }) => {
        const sel = (data.metas || []).includes(value);
        return (
          <button
            key={value}
            onClick={() => toggle(value)}
            className="flex flex-col items-center gap-2 text-center p-3 transition-all duration-150"
            style={sel
              ? { border: "1.5px solid #ffbf2f", background: "rgba(255,191,47,.06)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: sel ? "#ffbf2f" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={14} />
            </div>
            <p className="text-[11px] font-semibold leading-tight"
               style={{ color: sel ? "#92650a" : "#374151" }}>
              {label}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Paso 4 ───────────────────────────────────────────────────────────────────
function Step4({ data, set }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
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
                ? { border: `1.5px solid ${color}`, background: `${color}08` }
                : { border: "1px solid #e5e7eb", background: "#fff" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: sel ? color : "#f3f4f6" }}
              >
                <CreditCard size={18} style={{ color: sel ? "#fff" : "#6b7280" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {data.deudas === true && (
        <div className="p-3 flex items-center gap-3"
             style={{ border: "1px dashed rgba(255,77,148,.35)", background: "rgba(255,77,148,.03)" }}>
          <p className="text-[12px] font-semibold text-gray-600 shrink-0">¿Cuántas?</p>
          <div className="flex gap-1.5">
            {["1", "2", "3", "4", "5+"].map(n => (
              <button
                key={n}
                onClick={() => set("num_deudas", n)}
                className="w-9 h-9 text-[12px] font-semibold transition-all duration-150"
                style={data.num_deudas === n
                  ? { border: "1.5px solid #ff4d94", background: "#ff4d94", color: "#fff" }
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

// ─── Paso 5 ───────────────────────────────────────────────────────────────────
function Step5({ data, set }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FINALIDADES.map(({ value, label, desc, Icon }) => {
        const sel = data.finalidad === value;
        return (
          <button
            key={value}
            onClick={() => set("finalidad", value)}
            className="text-left flex items-center gap-3 p-3 transition-all duration-150"
            style={sel
              ? { border: "1.5px solid #31138b", background: "rgba(49,19,139,.05)" }
              : { border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{ background: sel ? "#31138b" : "#f3f4f6", color: sel ? "#fff" : "#6b7280" }}
            >
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pantalla final ───────────────────────────────────────────────────────────
function Done() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-6 px-10">
      <img src="/logo.png" alt="Logo" className="h-20 object-contain" />

      <div>
        <h2 className="text-[28px] font-semibold text-gray-900 mb-2">¡Todo listo!</h2>
        <p className="text-[15px] text-gray-500 leading-relaxed max-w-[300px] mx-auto">
          Bienvenido a <span className="font-semibold text-gray-700">Control Financiero</span>.
          Tu perfil está configurado y puedes empezar a gestionar tus finanzas.
        </p>
      </div>

      {/* Franja tricolor */}
      <div className="flex w-full h-[2px]">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      <button
        onClick={() => window.location.href = "/dashboard"}
        className="px-10 py-3 text-white text-[14px] font-semibold flex items-center gap-2 transition hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#31138b 0%,#ff4d94 100%)" }}
      >
        Ir al dashboard <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({
    actividad: "", monto: "",
    metas: [], deudas: null, num_deudas: "", finalidad: "",
  });

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const canNext = () => {
    if (step === 1) return !!data.actividad;
    if (step === 2) return true;
    if (step === 3) return (data.metas || []).length > 0;
    if (step === 4) return data.deudas !== null;
    if (step === 5) return !!data.finalidad;
    return true;
  };

  const next = () => {
    if (step < TOTAL) setStep(s => s + 1);
    else { setDone(true); onComplete?.(data); }
  };

  if (done) return <div className="h-full"><Done /></div>;

  const { title, sub } = STEP_COPY[step - 1];

  return (
    <div className="h-full flex flex-col px-10 py-6 max-w-[580px]">

      {/* Logo centrado y más grande */}
      <div className="flex justify-center mb-5">
        <img src="/logo.png" alt="Logo" className="h-14 object-contain" />
      </div>

      {/* Progress */}
      <ProgressBar current={step} />

      {/* Franja tricolor — sin bordes redondeados */}
      <div className="flex h-[2px] overflow-hidden mb-5">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Título */}
      <div className="mb-4">
        <span
          className="inline-flex items-center px-[10px] py-[2px] text-[10px] font-semibold mb-1.5"
          style={{ background: "rgba(49,19,139,.08)", color: "#31138b" }}
        >
          Paso {step} de {TOTAL}
        </span>
        <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">{title}</h2>
        <p className="text-[13px] text-gray-500 mt-0.5">{sub}</p>
      </div>

      {/* Contenido */}
      <div className="flex-1">
        {step === 1 && <Step1 data={data} set={set} />}
        {step === 2 && <Step2 data={data} set={set} />}
        {step === 3 && <Step3 data={data} set={set} />}
        {step === 4 && <Step4 data={data} set={set} />}
        {step === 5 && <Step5 data={data} set={set} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold
                       text-gray-600 hover:bg-gray-100 transition"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <ChevronLeft size={14} /> Atrás
          </button>
        ) : <div />}

        <button
          onClick={next}
          disabled={!canNext()}
          className="flex items-center gap-1.5 px-6 py-2 text-[13px] font-semibold
                     text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canNext() ? "linear-gradient(135deg,#31138b 0%,#ff4d94 100%)" : "#e5e7eb",
            color: canNext() ? "#fff" : "#9ca3af",
          }}
        >
          {step === TOTAL
            ? <><Check size={13} /> Finalizar</>
            : <>Continuar <ChevronRight size={13} /></>
          }
        </button>
      </div>
    </div>
  );
}