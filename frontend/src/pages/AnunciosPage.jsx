import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, Pin, Clock, Smile, Heart, Laugh, Frown,
  Zap, PartyPopper, ThumbsUp, ChevronDown,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const PAGE_SIZE = 4;

const REACCIONES = [
  { tipo: "like",        Icon: ThumbsUp,     label: "Me gusta",   color: "#3b82f6" },
  { tipo: "corazon",     Icon: Heart,        label: "Me encanta", color: "#ef4444" },
  { tipo: "risa",        Icon: Laugh,        label: "Jaja",       color: "#f59e0b" },
  { tipo: "tristeza",    Icon: Frown,        label: "Triste",     color: "#6366f1" },
  { tipo: "asombro",     Icon: Zap,          label: "Asombro",    color: "#8b5cf6" },
  { tipo: "celebracion", Icon: PartyPopper,  label: "¡Genial!",   color: "#10b981" },
];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "hace un momento";
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function timeLeft(dateStr) {
  const diff = Math.floor((new Date(dateStr) - Date.now()) / 1000);
  if (diff <= 0) return null;
  if (diff < 3600)  return `Expira en ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Expira en ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  return `Expira en ${days} día${days !== 1 ? "s" : ""}`;
}

// ── Picker de reacciones ──────────────────────────────────────────────────────
function ReaccionPicker({ onSelect, miReaccion, loading }) {
  const [open,    setOpen]  = useState(false);
  const [coords,  setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const actual = REACCIONES.find(r => r.tipo === miReaccion);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Popup de ~260px ancho, aparece encima del botón
      const popupW = 268;
      const popupH = 52;
      let left = rect.left;
      // Si se sale por la derecha, ajustar
      if (left + popupW > window.innerWidth - 8) {
        left = window.innerWidth - popupW - 8;
      }
      setCoords({
        top:  rect.top - popupH - 8 + window.scrollY,
        left: Math.max(8, left),
      });
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
          ${actual
            ? "border-transparent text-white shadow-md"
            : "border-purple-100 text-gray-500 bg-white hover:border-purple-300 hover:text-purple-700"
          }`}
        style={actual ? { background: actual.color } : {}}
      >
        {loading
          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : actual ? <actual.Icon size={13} /> : <Smile size={13} />
        }
        <span>{actual ? actual.label : "Reaccionar"}</span>
      </button>

      {open && createPortal(
        <>
          {/* Capa de cierre */}
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          {/* Popup posicionado */}
          <div
            className="fixed flex gap-1 bg-white border border-purple-100 rounded-2xl p-2 shadow-2xl"
            style={{ zIndex: 9999, top: coords.top, left: coords.left }}
          >
            {REACCIONES.map(({ tipo, Icon, label, color }) => (
              <button
                key={tipo}
                onClick={() => { onSelect(tipo); setOpen(false); }}
                title={label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-125
                  ${miReaccion === tipo ? "shadow-lg scale-110" : "hover:bg-gray-50"}`}
                style={miReaccion === tipo ? { background: `${color}20` } : {}}
              >
                <Icon size={18} style={{ color }} />
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── Resumen reacciones ────────────────────────────────────────────────────────
function ResumenReacciones({ reacciones }) {
  const total = Object.values(reacciones).reduce((s, n) => s + n, 0);
  if (total === 0) return null;
  const top = Object.entries(reacciones).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {top.map(([tipo]) => {
          const r = REACCIONES.find(x => x.tipo === tipo);
          if (!r) return null;
          return (
            <span key={tipo} className="w-5 h-5 rounded-full flex items-center justify-center border border-white"
              style={{ background: `${r.color}20` }}>
              <r.Icon size={10} style={{ color: r.color }} />
            </span>
          );
        })}
      </div>
      <span className="text-xs text-gray-400 font-medium">{total}</span>
    </div>
  );
}

// ── Card de anuncio ───────────────────────────────────────────────────────────
function AnuncioCard({ anuncio }) {
  const [loadingReaccion, setLoadingReaccion] = useState(false);
  const [reacciones, setReacciones] = useState(anuncio.reacciones || {});
  const [miReaccion, setMiReaccion] = useState(anuncio.mi_reaccion || null);

  const handleReaccion = async (tipo) => {
    setLoadingReaccion(true);
    try {
      const res = await fetch(`${API_URL}/anuncios/${anuncio.id}/reaccionar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo }),
      });
      if (res.ok) {
        const data = await res.json();
        setReacciones(data.reacciones);
        setMiReaccion(data.mi_reaccion);
      }
    } finally {
      setLoadingReaccion(false);
    }
  };

  const expira   = timeLeft(anuncio.expira_at);
  const anclado  = anuncio.anclado;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-lg overflow-hidden transition-all hover:shadow-xl
      ${anclado ? "border-[#31138b]/30" : "border-purple-100"}`}>

      {anclado && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white"
          style={{ background: "linear-gradient(90deg, #31138b, #ff4d94)" }}>
          <Pin size={12} className="shrink-0" /> Anuncio destacado
        </div>
      )}

      {anuncio.imagen && (
        <div className="h-48 overflow-hidden bg-gray-50">
          <img src={anuncio.imagen} alt={anuncio.titulo} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={anuncio.autor_foto || "/perfil.png"}
            alt={anuncio.autor}
            className="w-9 h-9 rounded-full object-cover border-2 border-purple-100"
            onError={e => { e.target.src = "/perfil.png"; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{anuncio.autor}</p>
            <p className="text-xs text-gray-400">{timeAgo(anuncio.created_at)}</p>
          </div>
          {expira && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 shrink-0">
              <Clock size={10} /> {expira}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{anuncio.titulo}</h3>
          {anuncio.contenido && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{anuncio.contenido}</p>
          )}
        </div>

        <div className="flex rounded-lg overflow-hidden h-0.5">
          <div className="flex-1" style={{ background: "#31138b" }} />
          <div className="flex-1" style={{ background: "#ff4d94" }} />
          <div className="flex-1" style={{ background: "#ffbf2f" }} />
        </div>

        <div className="flex items-center justify-between">
          <ResumenReacciones reacciones={reacciones} />
          <ReaccionPicker
            miReaccion={miReaccion}
            onSelect={handleReaccion}
            loading={loadingReaccion}
          />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-2 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  );
}

// ── Botón "Ver más" ───────────────────────────────────────────────────────────
function VerMasBtn({ onClick, loading, remaining }) {
  return (
    <div className="flex justify-center pt-2">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-purple-200 text-sm font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50"
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          : <ChevronDown size={16} />
        }
        Ver más ({remaining} restantes)
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AnunciosPage() {
  const [anuncios,      setAnuncios]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  // Cuántos normales se muestran actualmente
  const [visiblesNorm,  setVisiblesNorm]  = useState(PAGE_SIZE);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/anuncios`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Error al cargar anuncios");
      const data = await res.json();
      setAnuncios(Array.isArray(data) ? data : []);
      setVisiblesNorm(PAGE_SIZE); // reset al recargar
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const anclados = anuncios.filter(a =>  a.anclado);
  const normales = anuncios.filter(a => !a.anclado);
  const normalesVisibles  = normales.slice(0, visiblesNorm);
  const normalesRestantes = normales.length - visiblesNorm;

  const handleVerMas = () => {
    setLoadingMore(true);
    // Simula un pequeño delay para que se note la carga
    setTimeout(() => {
      setVisiblesNorm(v => v + PAGE_SIZE);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>

      {/* Título */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium" style={{ color: "#31138b" }}>Comunidad</p>
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Anuncios <span className="font-normal text-gray-600">y novedades</span>
        </h1>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
          {error} — <button onClick={cargar} className="underline font-bold">reintentar</button>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && anuncios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center">
            <Megaphone size={36} className="text-purple-300" />
          </div>
          <p className="text-gray-500 font-medium">No hay anuncios por el momento</p>
          <p className="text-sm text-gray-400">Cuando el administrador publique algo, aparecerá aquí.</p>
        </div>
      )}

      {/* Anclados — siempre todos visibles */}
      {!loading && anclados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
            <Pin size={12} /> Destacados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {anclados.map(a => <AnuncioCard key={a.id} anuncio={a} />)}
          </div>
        </section>
      )}

      {/* Normales — paginados de 4 en 4 */}
      {!loading && normalesVisibles.length > 0 && (
        <section className="space-y-3">
          {anclados.length > 0 && (
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Recientes
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {normalesVisibles.map(a => <AnuncioCard key={a.id} anuncio={a} />)}
          </div>

          {normalesRestantes > 0 && (
            <VerMasBtn
              onClick={handleVerMas}
              loading={loadingMore}
              remaining={normalesRestantes}
            />
          )}
        </section>
      )}
    </div>
  );
}