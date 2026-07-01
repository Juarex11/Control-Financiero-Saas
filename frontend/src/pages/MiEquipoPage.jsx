import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Crown,
  User as UserIcon,
  Copy,
  CheckCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const NIVEL_CONFIG = [
  { label: "Nivel 1", color: "#31138b", bg: "#31138b15", border: "#31138b30" },
  { label: "Nivel 2", color: "#ff4d94", bg: "#ff4d9415", border: "#ff4d9430" },
  { label: "Nivel 3", color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  { label: "Nivel 4", color: "#10b981", bg: "#10b98115", border: "#10b98130" },
];

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
        onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm`}
      style={{ background: "linear-gradient(135deg, #31138b, #ff4d94)" }}>
      {initials}
    </div>
  );
}

// ── CodigoBadge ──────────────────────────────────────────────────────────────
function CodigoBadge({ codigo }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCodigo = () => {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?code=${codigo}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Copiar código */}
      <button onClick={copyCodigo}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition">
        {copied
          ? <><CheckCheck size={13} className="text-green-500" /> Copiado</>
          : <><Copy size={13} /> Copiar código</>}
      </button>

      {/* Copiar link */}
      <button onClick={copyLink}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition
          ${copiedLink
            ? "border-green-200 bg-green-50 text-green-600"
            : "border-purple-200 text-purple-700 hover:bg-purple-100"}`}>
        {copiedLink
          ? <><CheckCheck size={13} /> Link copiado</>
          : <>🔗 Copiar link</>}
      </button>
    </div>
  );
}

// ── Tarjeta de miembro ────────────────────────────────────────────────────────
function MemberCard({ user, nivel, expanded, onToggle, hasHijos }) {
  const cfg = NIVEL_CONFIG[nivel - 1] || NIVEL_CONFIG[3];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white transition-all
        ${hasHijos ? "cursor-pointer hover:shadow-md hover:scale-[1.01]" : ""}
        ${expanded ? "shadow-md" : "shadow-sm"}`}
      style={{ borderColor: expanded ? cfg.color : cfg.border }}
      onClick={hasHijos ? onToggle : undefined}
    >
      <Avatar photo={user.photo} name={user.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
        {user.cargo && <p className="text-xs text-gray-400 truncate">{user.cargo}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Badge nivel */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          N{nivel}
        </span>
        {/* Indicador hijos */}
        {hasHijos && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
            style={{ background: cfg.bg, color: cfg.color }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
        {!hasHijos && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-30"
            style={{ background: cfg.bg }}>
            <UserIcon size={12} style={{ color: cfg.color }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rama recursiva ────────────────────────────────────────────────────────────
function Rama({ users, nivel }) {
  const [expanded, setExpanded] = useState({});
  if (!users || users.length === 0) return null;

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-2">
      {users.map(u => {
        const hasHijos = u.hijos && u.hijos.length > 0;
        const isOpen   = !!expanded[u.id];
        return (
          <div key={u.id}>
            <MemberCard
              user={u}
              nivel={nivel}
              expanded={isOpen}
              onToggle={() => toggle(u.id)}
              hasHijos={hasHijos}
            />
            {hasHijos && isOpen && (
              <div className="mt-2 ml-6 pl-4 border-l-2 space-y-2"
                style={{ borderColor: NIVEL_CONFIG[nivel - 1]?.border || "#e5e7eb" }}>
                <Rama users={u.hijos} nivel={nivel + 1} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tarjeta resumen de nivel ──────────────────────────────────────────────────
function NivelStat({ nivel, count }) {
  const cfg = NIVEL_CONFIG[nivel - 1];
  return (
    <div className="bg-white rounded-2xl border-2 p-4 text-center shadow-sm transition-all hover:shadow-md"
      style={{ borderColor: cfg.border }}>
      <p className="text-2xl font-extrabold" style={{ color: cfg.color }}>{count}</p>
      <p className="text-xs font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{count === 1 ? "persona" : "personas"}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-purple-100 bg-white">
          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-2 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiEquipoPage() {
  const yo        = JSON.parse(localStorage.getItem("user") || "{}");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/mi-equipo`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar el equipo");
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const totalEquipo = data ? Object.values(data.resumen).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>

      {/* Título */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium" style={{ color: "#31138b" }}>Red de referidos</p>
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Mi equipo <span className="font-normal text-gray-600">hasta 4 niveles</span>
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

      {loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border-2 border-purple-100 p-4 h-20" />
            ))}
          </div>
          <Skeleton />
        </>
      )}

      {!loading && data && (
        <>
          {/* Stats niveles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(n => (
              <NivelStat key={n} nivel={n} count={data.resumen[n] ?? 0} />
            ))}
          </div>

          {/* Card "Yo" */}
          <div className="bg-white rounded-2xl border-2 shadow-lg p-5 space-y-1"
            style={{ borderColor: "#31138b30" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Tú eres la cabeza del equipo
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar photo={data.yo.photo} name={data.yo.name} size="lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#ffbf2f" }}>
                  <Crown size={11} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{data.yo.name}</p>
                {data.yo.cargo && <p className="text-sm text-gray-400">{data.yo.cargo}</p>}
                <p className="text-xs font-semibold mt-1" style={{ color: "#31138b" }}>
                  {totalEquipo} {totalEquipo === 1 ? "persona" : "personas"} en tu equipo
                </p>
              </div>
            </div>
          </div>

          {/* Árbol */}
          {data.arbol && data.arbol.length > 0 ? (
            <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-purple-500" />
                  Estructura del equipo
                </h2>
                <span className="text-xs text-gray-400">
                  Toca una persona para ver su rama
                </span>
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-2">
                {NIVEL_CONFIG.map((cfg, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>

              <div className="flex rounded-lg overflow-hidden h-0.5">
                <div className="flex-1" style={{ background: "#31138b" }} />
                <div className="flex-1" style={{ background: "#ff4d94" }} />
                <div className="flex-1" style={{ background: "#ffbf2f" }} />
              </div>

              <Rama users={data.arbol} nivel={1} />
            </div>
          ) : (
            /* Equipo vacío */
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-2xl border-2 border-purple-100 shadow-lg">
              <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center">
                <Users size={36} className="text-purple-300" />
              </div>
              <div className="space-y-1">
                <p className="text-gray-600 font-bold">Aún no tienes equipo</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Cuando alguien se registre con tu código de acceso aparecerá aquí como tu nivel 1.
                </p>
              </div>
              {/* Código de acceso con CodigoBadge */}
              {yo.codigo_acceso && (
                <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl px-6 py-3 text-center space-y-3">
                  <p className="text-xs text-gray-400">Tu código de acceso</p>
                  <p className="text-2xl font-extrabold tracking-widest" style={{ color: "#31138b" }}>
                    {yo.codigo_acceso}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <CodigoBadge codigo={yo.codigo_acceso} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}