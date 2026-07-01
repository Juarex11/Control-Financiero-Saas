import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertTriangle } from "lucide-react";
import moment from "moment";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: "cita",          label: "Cita",          color: "#3b82f6" },
  { value: "reunion",       label: "Reunión",       color: "#8b5cf6" },
  { value: "evento",        label: "Evento",        color: "#31138b" },
  { value: "recordatorio",  label: "Recordatorio",  color: "#f59e0b" },
  { value: "tarea",         label: "Tarea",         color: "#10b981" },
];
const ESTADOS = [
  { value: "pendiente",    label: "Pendiente",   color: "#f59e0b" },
  { value: "confirmada",   label: "Confirmada",  color: "#3b82f6" },
  { value: "en_proceso",   label: "En proceso",  color: "#8b5cf6" },
  { value: "finalizada",   label: "Finalizada",  color: "#10b981" },
  { value: "cancelada",    label: "Cancelada",   color: "#ef4444" },
];
const PRIORIDADES = [
  { value: "baja",  label: "Baja",  color: "#10b981" },
  { value: "media", label: "Media", color: "#f59e0b" },
  { value: "alta",  label: "Alta",  color: "#ef4444" },
];
const REPETICIONES = [
  { value: "ninguna",  label: "Sin repetición" },
  { value: "diaria",   label: "Diaria"  },
  { value: "semanal",  label: "Semanal" },
  { value: "mensual",  label: "Mensual" },
  { value: "anual",    label: "Anual"   },
];
const RECORDATORIOS = [
  { value: 0,    label: "Sin recordatorio" },
  { value: 15,   label: "15 min antes" },
  { value: 30,   label: "30 min antes" },
  { value: 60,   label: "1 hora antes" },
  { value: 120,  label: "2 horas antes" },
  { value: 1440, label: "1 día antes" },
];
const FORM_VACIO = {
  tipo: "evento", titulo: "", descripcion: "", lugar: "", link_reunion: "",
  fecha_inicio: "", fecha_fin: "", todo_el_dia: false,
  recordatorio_minutos: 0, estado: "pendiente", color: "#31138b",
  prioridad: "media", repeticion: "ninguna", repeticion_hasta: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const esUrl = (str) => {
  if (!str) return false;
  try { new URL(str); return true; } catch { return false; }
};

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
function Inp({ value, onChange, placeholder, type = "text", disabled, className = "" }) {
  return (
    <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className={`w-full px-3 py-2 rounded-xl border-2 border-purple-100 focus:border-purple-500 text-sm outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400 ${className}`} />
  );
}
function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border-2 border-purple-100 focus:border-purple-500 text-sm outline-none bg-white">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ onClose, children, wide = false }) {
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col
        ${wide ? "w-full max-w-3xl" : "w-full max-w-lg"} max-h-[92vh] overflow-hidden`}>
        {children}
      </div>
    </div>, document.body
  );
}
function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 shrink-0"
      style={{ background: "linear-gradient(135deg,#31138b08,#ff4d9408)" }}>
      <h2 className="font-bold text-gray-800">{title}</h2>
      <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
        <X size={15} />
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AgendaModal({ evento, onClose, onGuardado }) {
  const editando = evento?.id && !evento?._nuevo;
  const [form, setForm] = useState(editando ? {
    tipo: evento.tipo, titulo: evento.titulo, descripcion: evento.descripcion || "",
    lugar: evento.lugar || "", link_reunion: evento.link_reunion || "",
    fecha_inicio: moment(evento.fecha_inicio).format("YYYY-MM-DDTHH:mm"),
    fecha_fin:    evento.fecha_fin ? moment(evento.fecha_fin).format("YYYY-MM-DDTHH:mm") : "",
    todo_el_dia:  evento.todo_el_dia || false,
    recordatorio_minutos: evento.recordatorio_minutos || 0,
    estado: evento.estado, color: evento.color || "#31138b",
    prioridad: evento.prioridad, repeticion: evento.repeticion || "ninguna",
    repeticion_hasta: evento.repeticion_hasta || "",
  } : { ...FORM_VACIO, fecha_inicio: moment().format("YYYY-MM-DDTHH:mm"), fecha_fin: moment().add(1,"hour").format("YYYY-MM-DDTHH:mm") });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    if (!form.fecha_inicio)  e.fecha_inicio = "La fecha de inicio es obligatoria";
    // La URL se valida pero no se bloquea, solo se limpiará al enviar
    if (form.link_reunion?.trim() && !esUrl(form.link_reunion.trim())) {
      e.link_reunion = "La URL no es válida, se enviará vacía si no la corriges";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editando ? `${API_URL}/agenda/${evento.id}/update` : `${API_URL}/agenda`;

      // 🧹 Limpieza de campos:
      const payload = {
        ...form,
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin:    form.fecha_fin ? new Date(form.fecha_fin).toISOString() : null,
        repeticion_hasta: form.repeticion_hasta || null,
        link_reunion: form.link_reunion?.trim() && esUrl(form.link_reunion.trim()) ? form.link_reunion.trim() : null,
        lugar:        form.lugar?.trim() || null,
        descripcion:  form.descripcion?.trim() || null,
      };

      console.log("PAYLOAD ENVIADO:", JSON.stringify(payload, null, 2)); // puedes eliminar después de pruebas

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrors(d.errors || { titulo: d.message });
        return;
      }
      onGuardado();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} wide>
      <ModalHeader title={editando ? "Editar evento" : "Nuevo evento"} onClose={onClose} />
      <div className="overflow-y-auto flex-1 p-6 space-y-4">

        {/* Título */}
        <Field label="Título *" error={errors.titulo}>
          <Inp value={form.titulo} onChange={v => set("titulo", v)} placeholder="Ej: Reunión con cliente" />
        </Field>

        {/* Tipo + Estado */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo">
            <Sel value={form.tipo} onChange={v => set("tipo", v)} options={TIPOS} />
          </Field>
          <Field label="Estado">
            <Sel value={form.estado} onChange={v => set("estado", v)} options={ESTADOS} />
          </Field>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio *" error={errors.fecha_inicio}>
            <Inp type="datetime-local" value={form.fecha_inicio} onChange={v => set("fecha_inicio", v)} />
          </Field>
          <Field label="Fin">
            <Inp type="datetime-local" value={form.fecha_fin} onChange={v => set("fecha_fin", v)} />
          </Field>
        </div>

        {/* Todo el día */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => set("todo_el_dia", !form.todo_el_dia)}
            className={`relative w-9 h-5 rounded-full transition-all cursor-pointer ${form.todo_el_dia ? "bg-[#31138b]" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.todo_el_dia ? "left-4" : "left-0.5"}`} />
          </div>
          <span className="text-sm text-gray-600 font-medium">Día completo</span>
        </label>

        {/* Lugar + Link */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Lugar">
            <Inp value={form.lugar} onChange={v => set("lugar", v)} placeholder="Oficina, Zoom..." />
          </Field>
          <Field label="Link reunión" error={errors.link_reunion}>
            <Inp type="url" value={form.link_reunion} onChange={v => set("link_reunion", v)} placeholder="https://meet.google.com/..." />
          </Field>
        </div>

        {/* Descripción */}
        <Field label="Descripción">
          <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
            rows={3} placeholder="Detalles del evento..."
            className="w-full px-3 py-2 rounded-xl border-2 border-purple-100 focus:border-purple-500 text-sm outline-none resize-none" />
        </Field>

        {/* Prioridad + Recordatorio */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prioridad">
            <Sel value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} />
          </Field>
          <Field label="Recordatorio">
            <Sel value={form.recordatorio_minutos} onChange={v => set("recordatorio_minutos", parseInt(v))} options={RECORDATORIOS} />
          </Field>
        </div>

        {/* Repetición */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Repetición">
            <Sel value={form.repeticion} onChange={v => set("repeticion", v)} options={REPETICIONES} />
          </Field>
          {form.repeticion !== "ninguna" && (
            <Field label="Repetir hasta">
              <Inp type="date" value={form.repeticion_hasta} onChange={v => set("repeticion_hasta", v)} />
            </Field>
          )}
        </div>

        {/* Color */}
        <Field label="Color del evento">
          <div className="flex items-center gap-3">
            <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
              className="w-10 h-10 rounded-xl border-2 border-purple-100 cursor-pointer" />
            <div className="flex gap-2 flex-wrap">
              {["#31138b","#ff4d94","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6"].map(c => (
                <button key={c} type="button" onClick={() => set("color", c)}
                  className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${form.color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </Field>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-purple-50 flex gap-3 shrink-0">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-purple-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}>
          {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : <><Check size={14} />{editando ? "Actualizar" : "Crear evento"}</>}
        </button>
      </div>
    </Modal>
  );
}