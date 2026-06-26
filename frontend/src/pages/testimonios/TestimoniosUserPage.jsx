import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, Send, Trash2, Clock, CheckCircle, XCircle,
  AlertCircle, MessageSquare, Pencil, ArrowLeft,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const ESTADO = {
  pendiente: { label: "Pendiente de aprobación", bg: "#fef9c3", color: "#ca8a04", Icon: Clock       },
  aprobado:  { label: "Aprobado y publicado",    bg: "#f0fdf4", color: "#16a34a", Icon: CheckCircle },
  rechazado: { label: "No aprobado",             bg: "#fef2f2", color: "#dc2626", Icon: XCircle     },
};

function Badge({ estado }) {
  const e = ESTADO[estado] ?? ESTADO.pendiente;
  const Icon = e.Icon;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      fontSize: "0.7rem",
      fontWeight: 700,
      padding: "0.3rem 0.8rem",
      background: e.bg,
      color: e.color,
      border: `1.5px solid ${e.color}40`,
      borderRadius: "9999px", // pill shape
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <Icon size={13} strokeWidth={2.5} /> {e.label}
    </span>
  );
}

function Estrellas({ value, onChange, readonly = false, size = 26 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.3rem" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            background: "transparent",
            border: "none",
            cursor: readonly ? "default" : "pointer",
            padding: "0.1rem",
            transition: "transform 0.15s",
            transform: (hover || value) >= n ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Star
            size={size}
            strokeWidth={1.5}
            fill={(hover || value) >= n ? "#ffbf2f" : "none"}
            color={(hover || value) >= n ? "#ffbf2f" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  );
}

export default function TestimoniosUserPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [miTestimonio, setMiTestimonio] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [form,         setForm]         = useState({ contenido: "", estrellas: 5 });
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [editando,     setEditando]     = useState(false);

  const cargarMiTestimonio = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/testimonios/mio`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data && data.id) {
        setMiTestimonio(data);
        setForm({ contenido: data.contenido, estrellas: Number(data.estrellas) });
      } else {
        setMiTestimonio(null);
        setForm({ contenido: "", estrellas: 5 });
      }
    } catch (err) {
      console.error("Error al cargar testimonio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMiTestimonio();
  }, []);

  const handleGuardar = async () => {
    if (!form.contenido.trim() || form.contenido.length < 10)
      return setError("El testimonio debe tener al menos 10 caracteres.");
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/testimonios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar.");
      setSuccess(data.message);
      setEditando(false);
      setTimeout(() => navigate("/testimonios"), 800);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm("¿Eliminar tu testimonio?")) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/testimonios/mio`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      navigate("/testimonios");
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header con gradiente sutil */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate("/testimonios")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#31138b] hover:text-[#ff4d94] transition-colors duration-200 rounded-lg hover:bg-purple-50/50"
        >
          <ArrowLeft size={18} />
          <span>Volver a la comunidad</span>
        </button>
        <div className="flex-1 min-w-[150px]">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tu opinión</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Mi testimonio</h1>
        </div>
      </div>

      {/* Separador tricolor mejorado */}
      <div className="flex rounded-lg overflow-hidden h-1.5 shadow-inner">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-10 h-10 border-4 border-[#31138b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Editando */}
          {editando && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-6 md:p-8 space-y-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Pencil size={20} className="text-[#31138b]" />
                Editar testimonio
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Calificación</label>
                <Estrellas value={form.estrellas} onChange={v => setForm(f => ({ ...f, estrellas: v }))} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Tu experiencia <span className="text-gray-400 font-normal">({form.contenido.length}/500)</span>
                </label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  placeholder="Cuéntanos cómo ha sido tu experiencia…"
                  maxLength={500}
                  rows={5}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#31138b] focus:ring-2 focus:ring-[#31138b]/20 transition-all resize-none bg-gray-50/50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#31138b] to-[#4c1d95] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Actualizar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditando(false);
                    setError("");
                    setForm({ contenido: miTestimonio.contenido, estrellas: Number(miTestimonio.estrellas) });
                  }}
                  className="px-5 h-11 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tiene testimonio y no editando */}
          {!editando && miTestimonio && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#31138b] flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">{user.name}</p>
                    {user.cargo && <p className="text-sm text-gray-400">{user.cargo}</p>}
                  </div>
                </div>
                <Badge estado={miTestimonio.estado} />
              </div>

              <div>
                <Estrellas value={Number(miTestimonio.estrellas)} readonly size={22} />
              </div>

              <p className="text-gray-700 leading-relaxed text-base italic border-l-4 border-[#31138b] pl-4 py-1 bg-gray-50/50 rounded-r-lg">
                "{miTestimonio.contenido}"
              </p>

              {miTestimonio.destacado && (
                <div className="text-sm font-bold text-amber-600 flex items-center gap-1">
                  ⭐ Destacado
                </div>
              )}

              {miTestimonio.estado === "rechazado" && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  Tu testimonio no fue aprobado. Puedes editarlo y volver a enviarlo.
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setEditando(true)}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl bg-purple-50 text-[#31138b] font-semibold text-sm border border-purple-200 hover:bg-purple-100 transition-colors duration-200"
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  onClick={handleEliminar}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-red-500 font-semibold text-sm border border-red-200 hover:bg-red-50 transition-colors duration-200 disabled:opacity-60"
                >
                  <Trash2 size={15} /> {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          )}

          {/* Sin testimonio y no editando */}
          {!editando && !miTestimonio && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-6 md:p-8 space-y-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#31138b]" />
                Comparte tu experiencia
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Calificación</label>
                <Estrellas value={form.estrellas} onChange={v => setForm(f => ({ ...f, estrellas: v }))} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Tu experiencia <span className="text-gray-400 font-normal">({form.contenido.length}/500)</span>
                </label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  placeholder="Cuéntanos cómo ha sido tu experiencia con Control Financiero…"
                  maxLength={500}
                  rows={5}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#31138b] focus:ring-2 focus:ring-[#31138b]/20 transition-all resize-none bg-gray-50/50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-[#31138b] to-[#4c1d95] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Send size={16} /> Enviar testimonio
                  </>
                )}
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mt-4">
              <CheckCircle size={16} /> {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}