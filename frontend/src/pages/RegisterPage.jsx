import { useState, useEffect } from "react";
import { Mail, Lock, User, Key, ArrowRight, ArrowLeft, Check } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function RegisterPage({ onLogin, onGoLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:                  "",
    email:                 "",
    password:              "",
    password_confirmation: "",
    codigo_padre:          "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [padreNombre, setPadreNombre] = useState("");
  const totalSteps = 4;

  // Reinicia la animación de los textos cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = async () => {
    setError("");

    if (step === 1) {
      if (!form.codigo_padre) {
        setError("El código de invitación es requerido");
        return;
      }
      // Validar si el código existe
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/validar-codigo`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ codigo: form.codigo_padre }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Código inválido.");
          setLoading(false);
          return;
        }
        // Mostrar nombre del padre como confirmación
        setPadreNombre(data.nombre);
      } catch {
        setError("No se pudo verificar el código.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (step === 2 && !form.name) {
      setError("El nombre completo es requerido");
      return;
    }
    if (step === 3 && !form.email) {
      setError("El email es requerido");
      return;
    }

    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError("");
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error al registrarse.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el contenido del paso actual
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <label className="block mb-2 font-semibold text-[#31138b] text-sm">
              Código de invitación
            </label>
            <div className="relative">
              <Key
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
              />
              <input
                type="text"
                value={form.codigo_padre}
                onChange={e => { 
                  set("codigo_padre", e.target.value.toUpperCase()); 
                  setPadreNombre(""); 
                }}
                placeholder="XXXXXXXX"
                className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-purple-500 transition font-mono tracking-widest"
                autoFocus
              />
            </div>
            {padreNombre && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-[2px]">
                <Check size={14} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700 font-semibold">
                  Invitado por: {padreNombre}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Ingresa el código de 8 caracteres que te proporcionó quien te invitó
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <label className="block mb-2 font-semibold text-[#31138b] text-sm">
              Nombre completo
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
              />
              <input
                type="text"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Juan Pérez"
                className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-purple-500 transition"
                autoFocus
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <label className="block mb-2 font-semibold text-[#31138b] text-sm">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
              />
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="juan@correo.com"
                className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-purple-500 transition"
                autoFocus
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <label className="block mb-2 font-semibold text-[#31138b] text-sm">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-11 text-sm outline-none focus:border-purple-500 transition"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <label className="block mb-2 font-semibold text-[#31138b] text-sm mt-4">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password_confirmation}
                onChange={e => set("password_confirmation", e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    "Código de invitación",
    "Nombre completo",
    "Email",
    "Contraseña",
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#f7f7fb]">
      {/* Estilos de animación */}
      <style>{`
        @keyframes slideInFromLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes gentleSway {
          0%, 100% { transform: scale(1.08) translate(0, 0); }
          25% { transform: scale(1.08) translate(-8px, -5px); }
          50% { transform: scale(1.08) translate(5px, -10px); }
          75% { transform: scale(1.08) translate(-3px, -5px); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slideInFromLeft 1s ease-out forwards; }
        .animate-slide-in-delay-1 { animation: slideInFromLeft 1s ease-out 0.2s forwards; opacity: 0; }
        .animate-slide-in-delay-2 { animation: slideInFromLeft 1s ease-out 0.4s forwards; opacity: 0; }
        .animate-slide-in-delay-3 { animation: slideInFromLeft 1s ease-out 0.6s forwards; opacity: 0; }
        .animate-gentle-sway { animation: gentleSway 18s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>

      {/* ── PANEL IZQUIERDO ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden border-r border-gray-100 select-none">
        <img
          src="/login.webp"
          alt="Fondo"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-gentle-sway"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          style={{ transformOrigin: "center center" }}
        />

        <div className="relative z-10 flex flex-col items-center w-full h-full px-[8%] pt-[5%]">
          <div key={animationKey} className="w-full max-w-[380px]">
            <div className="mb-0 animate-slide-in">
              <img
                src="/logo.png"
                alt="Control Financiero"
                className="w-64 xl:w-72 pointer-events-none"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            <h2 className="text-[24px] xl:text-[30px] font-bold leading-[1.2] text-[#31138b] text-left -mt-1 select-none animate-slide-in-delay-1">
              Únete y comienza a{" "}
              <span className="text-pink-500">hacer crecer tu futuro.</span>
            </h2>

            <div className="mt-3 mb-3 w-24 h-[3px] bg-gradient-to-r from-[#6b21d9] via-[#ff4d94] to-[#ffbf2f] animate-slide-in-delay-2" />

            <p className="text-gray-600 text-sm xl:text-[15px] leading-relaxed text-left select-none animate-slide-in-delay-3">
              Regístrate con el código de invitación y empieza a gestionar tus finanzas con inteligencia y orden.
            </p>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="w-full lg:w-[55%] xl:w-[58%] flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md bg-white rounded-[2px] shadow-[0_12px_48px_rgba(0,0,0,.08)] p-7 sm:p-10">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-medium text-[#31138b] mb-2">
              Crear cuenta
            </h1>
            <p className="text-gray-500 text-sm">
              Paso {step} de {totalSteps}: {stepTitles[step - 1]}
            </p>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i + 1 === step
                      ? "bg-gradient-to-r from-[#6b21d9] to-[#ff4d94] text-white shadow-lg"
                      : i + 1 < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      i + 1 < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div key={step} className="animate-fade-in-up">
              {renderStepContent()}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-[2px] mt-4">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="h-12 w-24 rounded-[2px] border-2 border-gray-200 text-gray-600 font-medium text-sm flex items-center justify-center gap-1 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Atrás
                </button>
              )}
              
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="h-12 flex-1 rounded-[2px] bg-gradient-to-r from-[#6b21d9] via-[#ff4d94] to-[#ffbf2f] text-white font-semibold text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[.99] transition-all disabled:opacity-50"
                >
                  {loading ? "Verificando…" : "Siguiente"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 rounded-[2px] bg-gradient-to-r from-[#6b21d9] via-[#ff4d94] to-[#ffbf2f] text-white font-semibold text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[.99] transition-all disabled:opacity-50"
                >
                  {loading ? "Registrando…" : "Crear cuenta"}
                  <Check size={17} />
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-400 pt-6">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={onGoLogin}
              className="font-semibold text-[#31138b] hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}