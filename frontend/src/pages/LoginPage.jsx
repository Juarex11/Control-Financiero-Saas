import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "../api/auth";

export default function LoginPage({ onLogin, onGoRegister }) {
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Reinicia la animación de los textos cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onsole.log("submit disparado", form);
    setError("");
    setLoading(true);
    try {
      const data = await login(identificador, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#f7f7fb]">
      {/* Estilos de animación */}
      <style>{`
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes gentleSway {
          0%, 100% {
            transform: scale(1.08) translate(0, 0);
          }
          25% {
            transform: scale(1.08) translate(-8px, -5px);
          }
          50% {
            transform: scale(1.08) translate(5px, -10px);
          }
          75% {
            transform: scale(1.08) translate(-3px, -5px);
          }
        }

        .animate-slide-in {
          animation: slideInFromLeft 1s ease-out forwards;
        }

        .animate-slide-in-delay-1 {
          animation: slideInFromLeft 1s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-slide-in-delay-2 {
          animation: slideInFromLeft 1s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-slide-in-delay-3 {
          animation: slideInFromLeft 1s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-gentle-sway {
          animation: gentleSway 18s ease-in-out infinite;
        }
      `}</style>

      {/* ── PANEL IZQUIERDO - menos ancho ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden border-r border-gray-100 select-none">
        {/* Imagen de fondo con balanceo suave - protegida */}
        <img
          src="/login.webp"
          alt="Fondo login"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-gentle-sway"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          style={{ transformOrigin: "center center" }}
        />

        {/* Contenido encima de la imagen */}
        <div className="relative z-10 flex flex-col items-center w-full h-full px-[8%] pt-[5%]">
          {/* Contenedor interno con ancho máximo y alineación izquierda */}
          <div key={animationKey} className="w-full max-w-[380px]">
            {/* Logo protegido */}
            <div className="mb-0 animate-slide-in">
              <img
                src="/logo.png"
                alt="Control Financiero"
                className="w-64 xl:w-72 pointer-events-none"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {/* Título animado */}
            <h2 className="text-[24px] xl:text-[30px] font-bold leading-[1.2] text-[#31138b] text-left -mt-1 select-none animate-slide-in-delay-1">
              Toma el control de tus finanzas y haz{" "}
              <span className="text-pink-500">crecer tu futuro.</span>
            </h2>

            {/* Línea decorativa animada */}
            <div className="mt-3 mb-3 w-24 h-[3px] bg-gradient-to-r from-[#6b21d9] via-[#ff4d94] to-[#ffbf2f] animate-slide-in-delay-2" />

            {/* Párrafo animado */}
            <p className="text-gray-600 text-sm xl:text-[15px] leading-relaxed text-left select-none animate-slide-in-delay-3">
              Gestiona tus ingresos, controla tus gastos y alcanza tus metas financieras con inteligencia y orden.
            </p>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO - más ancho ── */}
      <div className="w-full lg:w-[55%] xl:w-[58%] flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md bg-white rounded-[2px] shadow-[0_12px_48px_rgba(0,0,0,.08)] p-7 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-medium text-[#31138b] mb-2">
              ¡Bienvenido de nuevo!
            </h1>
            <p className="text-gray-500 text-sm">
              Ingresa tu email o código de acceso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL / CÓDIGO */}
            <div>
              <label className="block mb-2 font-semibold text-[#31138b] text-sm">
                Email o código
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b21d9]"
                />
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="admin@control.com o XXXXXXXX"
                  className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-[2px] border border-gray-200 pl-11 pr-11 text-sm outline-none focus:border-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Recordarme y Olvidé mi contraseña */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#6b21d9] w-4 h-4 rounded-[2px]"
                />
                Recordarme
              </label>
              <button
                type="button"
                className="text-[#6b21d9] font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-[2px]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !identificador || !password}
              className="h-12 w-full rounded-[2px] bg-gradient-to-r from-[#6b21d9] via-[#ff4d94] to-[#ffbf2f] text-white font-semibold text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[.99] transition-all disabled:opacity-50"
            >
              {loading ? "Ingresando…" : "Ingresar"}
              <ArrowRight size={17} />
            </button>

            <p className="text-center text-sm text-gray-400 pt-1">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={onGoRegister}
                className="font-semibold text-[#31138b] hover:underline"
              >
                Regístrate
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}