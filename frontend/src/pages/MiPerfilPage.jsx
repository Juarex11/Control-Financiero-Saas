import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  User, Camera, Trash2, Save, Lock, Eye, EyeOff,
  Check, AlertTriangle, X, Globe, Phone, Briefcase,
  Copy, CheckCheck, Shield, Clock, Mail, Hash,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const PAISES = [
  { value: "Argentina",            label: "🇦🇷 Argentina",          tz: "America/Argentina/Buenos_Aires", tel: "+54"  },
  { value: "Bolivia",              label: "🇧🇴 Bolivia",            tz: "America/La_Paz",                 tel: "+591" },
  { value: "Chile",                label: "🇨🇱 Chile",              tz: "America/Santiago",               tel: "+56"  },
  { value: "Colombia",             label: "🇨🇴 Colombia",           tz: "America/Bogota",                 tel: "+57"  },
  { value: "Costa Rica",           label: "🇨🇷 Costa Rica",         tz: "America/Costa_Rica",             tel: "+506" },
  { value: "Cuba",                 label: "🇨🇺 Cuba",               tz: "America/Havana",                 tel: "+53"  },
  { value: "Ecuador",              label: "🇪🇨 Ecuador",            tz: "America/Guayaquil",              tel: "+593" },
  { value: "El Salvador",          label: "🇸🇻 El Salvador",        tz: "America/El_Salvador",            tel: "+503" },
  { value: "España",               label: "🇪🇸 España",             tz: "Europe/Madrid",                  tel: "+34"  },
  { value: "Guatemala",            label: "🇬🇹 Guatemala",          tz: "America/Guatemala",              tel: "+502" },
  { value: "Honduras",             label: "🇭🇳 Honduras",           tz: "America/Tegucigalpa",            tel: "+504" },
  { value: "México",               label: "🇲🇽 México",             tz: "America/Mexico_City",            tel: "+52"  },
  { value: "Nicaragua",            label: "🇳🇮 Nicaragua",          tz: "America/Managua",                tel: "+505" },
  { value: "Panamá",               label: "🇵🇦 Panamá",             tz: "America/Panama",                 tel: "+507" },
  { value: "Paraguay",             label: "🇵🇾 Paraguay",           tz: "America/Asuncion",               tel: "+595" },
  { value: "Perú",                 label: "🇵🇪 Perú",               tz: "America/Lima",                   tel: "+51"  },
  { value: "Puerto Rico",          label: "🇵🇷 Puerto Rico",        tz: "America/Puerto_Rico",            tel: "+1"   },
  { value: "República Dominicana", label: "🇩🇴 Rep. Dominicana",    tz: "America/Santo_Domingo",          tel: "+1"   },
  { value: "Uruguay",              label: "🇺🇾 Uruguay",            tz: "America/Montevideo",             tel: "+598" },
  { value: "Venezuela",            label: "🇻🇪 Venezuela",          tz: "America/Caracas",                tel: "+58"  },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return createPortal(
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold z-[9999] ${type === "ok" ? "bg-emerald-600" : "bg-red-600"}`}>
      {type === "ok" ? <Check size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>,
    document.body
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon size={11} />} {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={10} />{error}
        </p>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", error, disabled, maxLength }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all
        ${disabled
          ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
          : error
            ? "border-red-300 bg-red-50 focus:border-red-400"
            : "border-purple-100 focus:border-purple-500 bg-white"
        }`}
    />
  );
}

// ── Teléfono con prefijo ─────────────────────────────────────────────────────
function TelInput({ value, onChange, pais }) {
  const prefijo = PAISES.find(p => p.value === pais)?.tel || "";

  useEffect(() => {
    if (!prefijo) return;
    if (!value || value === "") {
      onChange(prefijo + " ");
      return;
    }
    const otrosPrefijos = PAISES.map(p => p.tel).filter(t => t && t !== prefijo);
    const tieneOtro = otrosPrefijos.find(p => value.startsWith(p));
    if (tieneOtro) {
      onChange(value.replace(tieneOtro, prefijo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pais]);

  return (
    <div className="flex items-center gap-0 rounded-xl border-2 border-purple-100 focus-within:border-purple-500 bg-white overflow-hidden transition-all">
      {prefijo && (
        <span className="px-3 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 border-r border-purple-100 shrink-0 select-none">
          {prefijo}
        </span>
      )}
      <input
        type="tel"
        value={prefijo ? (value?.replace(prefijo, "").trimStart() ?? "") : (value ?? "")}
        onChange={e => onChange(prefijo ? prefijo + " " + e.target.value : e.target.value)}
        placeholder="999 888 777"
        maxLength={20}
        className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
      />
    </div>
  );
}

// ── Select país ───────────────────────────────────────────────────────────────
function SelectPais({ value, onChange }) {
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-100 focus:border-purple-500 bg-white text-sm outline-none transition-all"
    >
      <option value="">— Sin especificar —</option>
      {PAISES.map(p => (
        <option key={p.value} value={p.value}>{p.label}</option>
      ))}
    </select>
  );
}

// ── Foto de perfil ────────────────────────────────────────────────────────────
function FotoSection({ user, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [localUrl,  setLocalUrl]  = useState(null);
  const fileRef = useRef(null);

const getPhotoUrl = () => {
  if (localUrl) return localUrl;
  if (!user.photo) return null;
  if (user.photo.startsWith("http")) return user.photo;

  const apiUrl = import.meta.env.VITE_API_URL || "";
  // Extrae el origen (protocolo + host) sin el path
  let base = "";
  try {
    const url = new URL(apiUrl);
    base = url.origin; // ej: "https://api.controlfinpro.com"
  } catch {
    // fallback por si la URL no es válida
    base = apiUrl.replace(/\/api\/?$/, "");
  }
  return `${base}/storage/${user.photo}?t=${Date.now()}`;
};

  const photoUrl = getPhotoUrl();
  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    setUploading(true);

    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res  = await fetch(`${API_URL}/profile/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setLocalUrl(null);
        onUpdate({ photo: data.photo, photo_url: data.photo_url });
      } else {
        setLocalUrl(null);
      }
    } catch {
      setLocalUrl(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/profile/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setLocalUrl(null);
        onUpdate({ photo: null, photo_url: null });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        {photoUrl ? (
          <img
            key={photoUrl}
            src={photoUrl}
            alt={user.name}
            className="w-20 h-20 rounded-xl object-cover border-2 border-purple-100 shadow-sm"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}
          >
            {initials}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-50 transition disabled:opacity-50"
        >
          <Camera size={14} />
          {uploading ? "Subiendo..." : "Cambiar foto"}
        </button>
        {user.photo && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-100 text-xs font-bold text-red-500 hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? "Eliminando..." : "Quitar foto"}
          </button>
        )}
        <p className="text-[10px] text-gray-400">JPG, PNG, WEBP — máx. 4 MB</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Modal contraseña ──────────────────────────────────────────────────────────
function ModalPassword({ onClose }) {
  const [form,   setForm]   = useState({ current_password: "", password: "", password_confirmation: "" });
  const [show,   setShow]   = useState({ current: false, nuevo: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [ok,     setOk]     = useState(false);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleShow = k => setShow(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async () => {
    const e = {};
    if (!form.current_password)                         e.current_password = "Ingresa tu contraseña actual";
    if (form.password.length < 8)                       e.password = "Mínimo 8 caracteres";
    if (form.password !== form.password_confirmation)   e.password_confirmation = "Las contraseñas no coinciden";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/profile/password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors || { current_password: data.message }); return; }
      setOk(true);
      setTimeout(onClose, 1500);
    } finally {
      setSaving(false);
    }
  };

  const pwFields = [
    { key: "current_password",      label: "Contraseña actual",    showKey: "current" },
    { key: "password",               label: "Nueva contraseña",     showKey: "nuevo"   },
    { key: "password_confirmation",  label: "Confirmar contraseña", showKey: "confirm" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[9999]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-purple-100">
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-purple-50 rounded-t-xl"
          style={{ background: "linear-gradient(135deg,#31138b08,#ff4d9408)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}>
              <Lock size={16} />
            </div>
            <h2 className="font-bold text-gray-800">Cambiar contraseña</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {ok ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <Check size={26} className="text-green-500" />
              </div>
              <p className="font-bold text-gray-800 text-lg">¡Contraseña actualizada!</p>
            </div>
          ) : (
            <>
              {pwFields.map(({ key, label, showKey }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {label}
                  </label>
                  <div className={`flex items-center rounded-xl border-2 overflow-hidden transition-all bg-white
                    ${errors[key] ? "border-red-300" : "border-purple-100 focus-within:border-purple-500"}`}>
                    <input
                      type={show[showKey] ? "text" : "password"}
                      value={form[key]}
                      onChange={e => setF(key, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                      placeholder="••••••••"
                      autoComplete={key === "current_password" ? "current-password" : "new-password"}
                      className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => toggleShow(showKey)}
                      className="px-3 text-gray-400 hover:text-gray-600 transition"
                    >
                      {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors[key] && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle size={10} />{errors[key]}
                    </p>
                  )}
                </div>
              ))}

              {form.password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all
                        ${form.password.length >= i * 3
                          ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-yellow-400" : "bg-green-500"
                          : "bg-gray-100"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {form.password.length < 4 ? "Muy corta" : form.password.length < 8 ? "Corta" : form.password.length < 12 ? "Buena" : "Excelente"}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-purple-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}
                >
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                    : <><Lock size={14} />Actualizar</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiPerfilPage({ onUserUpdate }) {
  const [profile, setProfile] = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [toast,   setToast]   = useState(null);
  const [modalPw, setModalPw] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const showToast = (msg, type = "ok") => setToast({ msg, type });

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setProfile(data);

      // 🔧 FIX: Si el teléfono parece un email, lo limpiamos
      const telefono = data.telefono && !data.telefono.includes('@') ? data.telefono : '';

      setForm({
        name:     data.name     || "",
        cargo:    data.cargo    || "",
        telefono: telefono, // ← aquí la validación
        pais:     data.pais     || "",
        timezone: data.timezone || "",
      });
    } catch {}
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const setF = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === "pais") {
        const found = PAISES.find(x => x.value === v);
        if (found) {
          next.timezone = found.tz;
          const prefijo = found.tel;
          if (prefijo && (!p.telefono || p.telefono.trim() === "" || PAISES.some(x => p.telefono.startsWith(x.tel)))) {
            next.telefono = prefijo + " ";
          }
        }
      }
      return next;
    });
    setDirty(true);
  };

  const handleSubmit = async () => {
    const e = {};
    if (!form.name?.trim()) e.name = "El nombre es obligatorio";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/profile/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors || {}); showToast("Error al guardar", "err"); return; }
      setProfile(data);
      setDirty(false);
      showToast("Perfil actualizado correctamente");
      const stored  = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...stored, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      onUserUpdate?.(updated);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpdate = partial => {
    setProfile(p => ({ ...p, ...partial }));
    const stored  = JSON.parse(localStorage.getItem("user") || "{}");
    const updated = { ...stored, ...partial };
    localStorage.setItem("user", JSON.stringify(updated));
    onUserUpdate?.(updated);
    showToast(partial.photo ? "Foto actualizada" : "Foto eliminada");
  };

  const copiarCodigo = () => {
    if (!profile?.codigo_acceso) return;
    navigator.clipboard.writeText(profile.codigo_acceso);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) {
    return (
      <div className="p-6 space-y-6 min-h-screen animate-pulse" style={{ background: "linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)" }}>
        <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
        <div className="bg-white rounded-xl border-2 border-purple-100 p-6 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const tz = PAISES.find(p => p.value === form.pais)?.tz || form.timezone || "";

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)" }}>

      {toast   && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {modalPw && <ModalPassword onClose={() => setModalPw(false)} />}

      {/* Título */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium" style={{ color: "#31138b" }}>Cuenta</p>
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Mi perfil <span className="font-normal text-gray-600">y configuración</span>
        </h1>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Grid: 1/3 - 2/3 */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Columna izquierda ── */}
        <div className="space-y-5">

          {/* Foto */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <User size={11} /> Foto de perfil
            </h2>
            <FotoSection user={profile} onUpdate={handlePhotoUpdate} />
          </div>

         {/* Código de acceso */}
<div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6 space-y-3">
  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
    <Hash size={11} /> Código de acceso
  </h2>

  {/* El código */}
  <div className="flex items-center gap-3 bg-purple-50 border-2 border-purple-100 rounded-xl px-4 py-3">
    <p className="flex-1 text-2xl font-extrabold tracking-widest" style={{ color: "#31138b" }}>
      {profile.codigo_acceso}
    </p>
    <button
      onClick={copiarCodigo}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shrink-0"
    >
      {copied
        ? <><CheckCheck size={13} className="text-green-500" /> Copiado</>
        : <><Copy size={13} /> Copiar</>}
    </button>
  </div>

  {/* Botón compartir link */}
  <button
    onClick={() => {
      const link = `${window.location.origin}/register?code=${profile.codigo_acceso}`;
      navigator.clipboard.writeText(link);
      showToast("¡Link de invitación copiado!");
    }}
    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-purple-200 text-xs font-bold text-purple-600 hover:bg-purple-50 transition"
  >
    {/* Puedes importar Share2 de lucide-react */}
    🔗 Copiar link de invitación
  </button>

  <p className="text-[10px] text-gray-400 leading-relaxed">
    Comparte este código o el link para que otros se registren en tu red.
  </p>
</div>

          {/* Información de cuenta */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Mail size={11} /> Cuenta
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Email</p>
                <p className="text-sm text-gray-700 font-medium break-all">{profile.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Rol</p>
                <span className="inline-block text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  {profile.role}
                </span>
              </div>
              {profile.last_login && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Último acceso</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {new Date(profile.last_login).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Datos personales */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <User size={16} className="text-purple-500" />
              Datos personales
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre completo" icon={User} error={errors.name}>
                <Input
                  value={form.name}
                  onChange={v => setF("name", v)}
                  placeholder="Tu nombre completo"
                  error={errors.name}
                  maxLength={100}
                />
              </Field>

              <Field label="Cargo / puesto" icon={Briefcase}>
                <Input
                  value={form.cargo}
                  onChange={v => setF("cargo", v)}
                  placeholder="Ej: Vendedor, Director..."
                  maxLength={100}
                />
              </Field>

              <Field label="País" icon={Globe}>
                <SelectPais value={form.pais} onChange={v => setF("pais", v)} />
              </Field>

              <Field label="Teléfono" icon={Phone}>
                <TelInput
                  value={form.telefono}
                  onChange={v => setF("telefono", v)}
                  pais={form.pais}
                />
              </Field>
            </div>

            {/* Zona horaria */}
            <Field label="Zona horaria" icon={Globe}>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm
                ${tz ? "border-purple-100 bg-purple-50" : "border-gray-100 bg-gray-50"}`}>
                <Globe size={14} className={tz ? "text-purple-400" : "text-gray-300"} />
                <span className={tz ? "text-gray-700 font-medium" : "text-gray-400"}>
                  {tz || "Se autocompleta al elegir el país"}
                </span>
                {form.pais && (
                  <span className="ml-auto text-[10px] text-purple-400 font-bold bg-purple-100 px-2 py-0.5 rounded-lg">
                    Auto
                  </span>
                )}
              </div>
              {!form.pais && (
                <Input
                  value={form.timezone}
                  onChange={v => setF("timezone", v)}
                  placeholder="Ej: America/Lima"
                  maxLength={60}
                />
              )}
            </Field>

            {/* Botón guardar */}
            <div className="flex items-center gap-3 pt-2 border-t border-purple-50">
              {dirty && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle size={11} /> Cambios sin guardar
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving || !dirty}
                className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                  : <><Save size={15} />Guardar cambios</>}
              </button>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Shield size={16} className="text-purple-500" />
              Seguridad
            </h2>
            <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-200 rounded-xl gap-4">
              <div>
                <p className="text-sm font-bold text-gray-700">Contraseña</p>
                <p className="text-xs text-gray-400">Actualiza tu contraseña periódicamente para mayor seguridad</p>
              </div>
              <button
                onClick={() => setModalPw(true)}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#31138b]/20 text-xs font-bold text-[#31138b] hover:bg-[#31138b]/5 transition"
              >
                <Lock size={13} /> Cambiar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}