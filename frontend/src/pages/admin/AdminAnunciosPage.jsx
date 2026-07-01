import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, Plus, Pin, PinOff, Trash2, Edit3, Image as ImageIcon,
  Clock, X, Upload, Check, ChevronDown, AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const DURACIONES = [
  { value: "1d", label: "1 día"    },
  { value: "1w", label: "1 semana" },
  { value: "1m", label: "1 mes"    },
];

const EXPIRA_OPS = [
  { value: "1d", label: "1 día"    },
  { value: "1w", label: "1 semana" },
  { value: "1m", label: "1 mes"    },
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
  if (diff <= 0) return "Expirado";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

// ── Portal helper ─────────────────────────────────────────────────────────────
function Portal({ children }) {
  return createPortal(children, document.body);
}

// ── Select custom ─────────────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all
          ${disabled ? "opacity-40 cursor-not-allowed bg-gray-50" : "bg-white hover:border-purple-300 cursor-pointer"}
          ${open ? "border-purple-500" : "border-purple-100"}`}
      >
        <span className={selected ? "text-gray-800 font-medium" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-purple-100 rounded-xl shadow-xl overflow-hidden">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-purple-50
                ${value === o.value ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-700"}`}
            >
              {o.value === value && <Check size={12} className="inline mr-2 text-purple-600" />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal crear / editar ──────────────────────────────────────────────────────
function ModalAnuncio({ anuncio, onClose, onGuardado }) {
  const editando = !!anuncio;
  const [form, setForm] = useState({
    titulo:           anuncio?.titulo           || "",
    contenido:        anuncio?.contenido        || "",
    anclado:          anuncio?.anclado          || false,
    duracion_anclado: anuncio?.duracion_anclado || "",
    expira_en:        "1m",
  });
  const [imagen,   setImagen]   = useState(null);
  const [preview,  setPreview]  = useState(anuncio?.imagen || null);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const fileRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    if (form.anclado && !form.duracion_anclado) e.duracion_anclado = "Elige la duración del anclado";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo",    form.titulo.trim());
      fd.append("contenido", form.contenido.trim());
      fd.append("anclado",   form.anclado ? "1" : "0");
      if (form.anclado) fd.append("duracion_anclado", form.duracion_anclado);
      if (!editando)    fd.append("expira_en", form.expira_en);
      if (imagen)       fd.append("imagen", imagen);

      const url = editando
        ? `${API_URL}/admin/anuncios/${anuncio.id}/update`
        : `${API_URL}/admin/anuncios`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors || { general: data.message });
        return;
      }
      onGuardado();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9999 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-100">

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-purple-50 sticky top-0 bg-white z-10"
            style={{ background: "linear-gradient(135deg, #31138b08, #ff4d9408)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #31138b, #ff4d94)" }}
              >
                <Megaphone size={18} />
              </div>
              <h2 className="font-bold text-gray-800">{editando ? "Editar anuncio" : "Nuevo anuncio"}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5">

            {errors.general && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle size={14} /> {errors.general}
              </div>
            )}

            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Título *</label>
              <input
                value={form.titulo}
                onChange={e => set("titulo", e.target.value)}
                placeholder="Escribe el título del anuncio"
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all
                  ${errors.titulo ? "border-red-300 bg-red-50" : "border-purple-100 focus:border-purple-500"}`}
              />
              {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
            </div>

            {/* Contenido */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contenido</label>
              <textarea
                value={form.contenido}
                onChange={e => set("contenido", e.target.value)}
                rows={4}
                placeholder="Describe el anuncio (opcional)..."
                className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-100 focus:border-purple-500 text-sm outline-none transition-all resize-none"
              />
            </div>

            {/* Imagen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Imagen</label>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-purple-100 h-40">
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagen(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center gap-2 text-purple-400 hover:border-purple-400 hover:bg-purple-50 transition"
                >
                  <Upload size={22} />
                  <span className="text-xs font-medium">Subir imagen (jpg, png, gif, webp — máx. 4 MB)</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            {/* Expiración (solo en creación) */}
            {!editando && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Visible durante</label>
                <Select
                  value={form.expira_en}
                  onChange={v => set("expira_en", v)}
                  options={EXPIRA_OPS}
                  placeholder="Elige cuánto tiempo..."
                />
              </div>
            )}

            {/* Anclado */}
            <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set("anclado", !form.anclado)}
                  className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                    ${form.anclado ? "bg-[#31138b]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                    ${form.anclado ? "left-5" : "left-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Pin size={13} /> Anclar anuncio
                  </p>
                  <p className="text-xs text-gray-400">Aparece primero para todos los usuarios</p>
                </div>
              </label>

              {form.anclado && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Duración del anclado (máx. 1 mes)
                  </label>
                  <Select
                    value={form.duracion_anclado}
                    onChange={v => set("duracion_anclado", v)}
                    options={DURACIONES}
                    placeholder="Elige duración..."
                  />
                  {errors.duracion_anclado && (
                    <p className="text-xs text-red-500">{errors.duracion_anclado}</p>
                  )}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-purple-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #31138b, #ff4d94)" }}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                  : <><Check size={15} /> {editando ? "Guardar cambios" : "Publicar"}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Confirmar eliminar ────────────────────────────────────────────────────────
function ModalConfirmar({ titulo, onConfirm, onClose, loading }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9999 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-100 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800">¿Eliminar anuncio?</p>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{titulo}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Trash2 size={14} /> Eliminar</>
              }
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Card admin ────────────────────────────────────────────────────────────────
function AnuncioAdminCard({ anuncio, onEditar, onEliminar, onToggleAnclado, onSubirImagen }) {
  const [toggling,  setToggling]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch(`${API_URL}/admin/anuncios/${anuncio.id}/toggle-anclado`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onToggleAnclado();
    } finally {
      setToggling(false);
    }
  };

  const handleImagen = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("imagen", file);
    try {
      const res = await fetch(`${API_URL}/admin/anuncios/${anuncio.id}/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) onSubirImagen();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const expirado  = anuncio.expirado;
  const ancladoAct = anuncio.anclado;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-lg overflow-hidden transition-all
      ${expirado ? "opacity-60 border-gray-200" : ancladoAct ? "border-[#31138b]/30" : "border-purple-100"}`}>

      {ancladoAct && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white"
          style={{ background: "linear-gradient(90deg, #31138b, #ff4d94)" }}
        >
          <Pin size={11} /> Anclado
          {anuncio.anclado_hasta && (
            <span className="ml-auto opacity-80">hasta en {timeLeft(anuncio.anclado_hasta)}</span>
          )}
        </div>
      )}

      {anuncio.imagen && (
        <div className="h-36 overflow-hidden bg-gray-50">
          <img src={anuncio.imagen} alt={anuncio.titulo} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{anuncio.titulo}</h3>
            {anuncio.contenido && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{anuncio.contenido}</p>
            )}
          </div>
          {expirado && (
            <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 border border-gray-200 rounded-lg px-2 py-0.5 font-bold">
              Expirado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Clock size={10} />
          <span>{timeAgo(anuncio.created_at)}</span>
          {!expirado && anuncio.expira_at && (
            <><span>·</span><span>Expira en {timeLeft(anuncio.expira_at)}</span></>
          )}
          {Object.values(anuncio.reacciones || {}).reduce((s, n) => s + n, 0) > 0 && (
            <><span>·</span><span>{Object.values(anuncio.reacciones).reduce((s, n) => s + n, 0)} reacciones</span></>
          )}
        </div>

        <div className="flex rounded-lg overflow-hidden h-0.5">
          <div className="flex-1" style={{ background: "#31138b" }} />
          <div className="flex-1" style={{ background: "#ff4d94" }} />
          <div className="flex-1" style={{ background: "#ffbf2f" }} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEditar(anuncio)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-purple-100 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
          >
            <Edit3 size={12} /> Editar
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling || expirado}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition
              ${ancladoAct
                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                : "border-[#31138b]/20 text-[#31138b] hover:bg-purple-50"
              } disabled:opacity-40`}
          >
            {toggling
              ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : ancladoAct ? <PinOff size={12} /> : <Pin size={12} />
            }
            {ancladoAct ? "Desanclar" : "Anclar"}
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition disabled:opacity-40"
          >
            {uploading
              ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <ImageIcon size={12} />
            }
            Imagen
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />

          <button
            onClick={() => onEliminar(anuncio)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-red-100 text-xs font-bold text-red-500 hover:bg-red-50 transition ml-auto"
          >
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-2 pt-1">
        <div className="h-7 bg-gray-100 rounded-xl w-16" />
        <div className="h-7 bg-gray-100 rounded-xl w-16" />
        <div className="h-7 bg-gray-100 rounded-xl w-16" />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AdminAnunciosPage() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [modal,    setModal]    = useState(null);
  const [eliminar, setEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/admin/anuncios`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setAnuncios(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleEliminar = async () => {
    if (!eliminar) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/admin/anuncios/${eliminar.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setEliminar(null);
      cargar();
    } finally {
      setDeleting(false);
    }
  };

  const anclados  = anuncios.filter(a =>  a.anclado && !a.expirado);
  const activos   = anuncios.filter(a => !a.anclado && !a.expirado);
  const expirados = anuncios.filter(a =>  a.expirado);

  const totalReacciones = anuncios.reduce(
    (s, a) => s + Object.values(a.reacciones || {}).reduce((x, n) => x + n, 0), 0
  );

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>

      {/* Título + botón */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <p className="text-sm font-medium" style={{ color: "#31138b" }}>Panel admin</p>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
            Anuncios <span className="font-normal text-gray-600">y comunicados</span>
          </h1>
        </div>
        <button
          onClick={() => setModal("crear")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #31138b, #ff4d94)" }}
        >
          <Plus size={16} /> Nuevo anuncio
        </button>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Stats */}
      {!loading && anuncios.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",      value: anuncios.length,  color: "#31138b" },
            { label: "Activos",    value: activos.length,   color: "#10b981" },
            { label: "Anclados",   value: anclados.length,  color: "#ff4d94" },
            { label: "Reacciones", value: totalReacciones,  color: "#ffbf2f" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border-2 border-purple-100 p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
          {error} — <button onClick={cargar} className="underline font-bold">reintentar</button>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && anuncios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center">
            <Megaphone size={36} className="text-purple-300" />
          </div>
          <p className="text-gray-500 font-medium">Aún no hay anuncios</p>
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #31138b, #ff4d94)" }}
          >
            <Plus size={15} /> Crear el primero
          </button>
        </div>
      )}

      {/* Anclados */}
      {!loading && anclados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
            <Pin size={12} /> Anclados ({anclados.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {anclados.map(a => (
              <AnuncioAdminCard key={a.id} anuncio={a}
                onEditar={setModal} onEliminar={setEliminar}
                onToggleAnclado={cargar} onSubirImagen={cargar} />
            ))}
          </div>
        </section>
      )}

      {/* Activos */}
      {!loading && activos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Activos ({activos.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activos.map(a => (
              <AnuncioAdminCard key={a.id} anuncio={a}
                onEditar={setModal} onEliminar={setEliminar}
                onToggleAnclado={cargar} onSubirImagen={cargar} />
            ))}
          </div>
        </section>
      )}

      {/* Expirados */}
      {!loading && expirados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-300">
            Expirados ({expirados.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {expirados.map(a => (
              <AnuncioAdminCard key={a.id} anuncio={a}
                onEditar={setModal} onEliminar={setEliminar}
                onToggleAnclado={cargar} onSubirImagen={cargar} />
            ))}
          </div>
        </section>
      )}

      {modal && (
        <ModalAnuncio
          anuncio={modal === "crear" ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={cargar}
        />
      )}

      {eliminar && (
        <ModalConfirmar
          titulo={eliminar.titulo}
          onConfirm={handleEliminar}
          onClose={() => setEliminar(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}