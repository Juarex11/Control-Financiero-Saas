import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Plus, X, Trash2, Check, AlertTriangle,
  MapPin, Link as LinkIcon, Clock, User,
  Paperclip, MessageSquare, Download, Edit3,
} from "lucide-react";
import AgendaModal from "../components/AgendaModal";

moment.locale("es");
const localizer = momentLocalizer(moment);

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return "—";
  return moment(iso).format("ddd D MMM YYYY, HH:mm");
}
function tipoColor(tipo) {
  return TIPOS.find(t => t.value === tipo)?.color || "#31138b";
}
function estadoColor(estado) {
  return ESTADOS.find(e => e.value === estado)?.color || "#9ca3af";
}
function prioridadColor(p) {
  return PRIORIDADES.find(x => x.value === p)?.color || "#9ca3af";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold"
      style={{ zIndex: 9999, background: type === "ok" ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
      {type === "ok" ? <Check size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>, document.body
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
      style={{ background: color + "18", color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

// ── Componente personalizado para cada evento en el calendario ──────────────
const EventoCalendario = ({ event }) => {
  const horaInicio = moment(event.start).format("HH:mm");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: 11 }}>
      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {event.title}
      </span>
      <span style={{ fontSize: 9, color: "#6b7280", marginLeft: 4, flexShrink: 0 }}>
        {horaInicio}
      </span>
    </div>
  );
};

// ── Modal wrapper (necesario para los modales) ──────────────────────────────
function Modal({ onClose, children, wide = false }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

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

// ── Confirmación eliminar ─────────────────────────────────────────────────────
function ModalConfirmar({ titulo, onConfirm, onClose, loading }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800">¿Eliminar evento?</p>
            <p className="text-xs text-gray-400 truncate max-w-[220px]">{titulo}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 size={14} />Eliminar</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Detalle evento ──────────────────────────────────────────────────────
function ModalDetalle({ evento: ev, onClose, onEditar, onEliminar, onActualizado }) {
  const [nota, setNota] = useState("");
  const [savingNota, setSavingNota] = useState(false);
  const [contacto, setContacto] = useState({ nombre: "", email: "", telefono: "", empresa: "", cargo: "", rol: "participante" });
  const [showContact, setShowContact] = useState(false);
  const [savingCont, setSavingCont] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [delNota, setDelNota] = useState(null);
  const [delCont, setDelCont] = useState(null);
  const fileRef = useRef(null);

  const tipo = TIPOS.find(t => t.value === ev.tipo);
  const estado = ESTADOS.find(e => e.value === ev.estado);
  const prio = PRIORIDADES.find(p => p.value === ev.prioridad);

  // ── Agregar nota ──
  const handleNota = async () => {
    if (!nota.trim()) return;
    setSavingNota(true);
    try {
      const res = await fetch(`${API_URL}/agenda/${ev.id}/notas`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: nota }),
      });
      if (res.ok) { setNota(""); onActualizado(); }
    } finally { setSavingNota(false); }
  };

  const handleDelNota = async (notaId) => {
    await fetch(`${API_URL}/agenda/${ev.id}/notas/${notaId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    setDelNota(null);
    onActualizado();
  };

  // ── Agregar contacto ──
  const handleContacto = async () => {
    if (!contacto.nombre.trim()) return;
    setSavingCont(true);
    try {
      const res = await fetch(`${API_URL}/agenda/${ev.id}/contactos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(contacto),
      });
      if (res.ok) {
        setContacto({ nombre: "", email: "", telefono: "", empresa: "", cargo: "", rol: "participante" });
        setShowContact(false);
        onActualizado();
      }
    } finally { setSavingCont(false); }
  };

  const handleDelContacto = async (contId) => {
    await fetch(`${API_URL}/agenda/${ev.id}/contactos/${contId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    setDelCont(null);
    onActualizado();
  };

  // ── Archivos ──
  const handleArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("archivo", file);
    try {
      const res = await fetch(`${API_URL}/agenda/${ev.id}/archivos`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      if (res.ok) onActualizado();
    } finally { setUploading(false); e.target.value = ""; }
  };

  const handleDelArchivo = async (archId) => {
    await fetch(`${API_URL}/agenda/${ev.id}/archivos/${archId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    onActualizado();
  };

  return (
    <Modal onClose={onClose} wide>
      <ModalHeader title="Detalle del evento" onClose={onClose} />
      <div className="overflow-y-auto flex-1 p-6 space-y-5">

        {/* Cabecera */}
        <div className="flex items-start gap-3">
          <div className="w-3 shrink-0 rounded-full mt-1.5 h-10"
            style={{ background: ev.color || tipoColor(ev.tipo) }} />
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 leading-tight">{ev.titulo}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {tipo && <Badge label={tipo.label} color={tipo.color} />}
              {estado && <Badge label={estado.label} color={estado.color} />}
              {prio && <Badge label={prio.label} color={prio.color} />}
              {ev.vencido && <Badge label="Vencido" color="#ef4444" />}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onEditar}
              className="w-8 h-8 rounded-xl border-2 border-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition">
              <Edit3 size={14} />
            </button>
            <button onClick={onEliminar}
              className="w-8 h-8 rounded-xl border-2 border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 transition">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} className="text-purple-400 shrink-0" />
            <span>{fmtFecha(ev.fecha_inicio)}{ev.fecha_fin ? ` → ${fmtFecha(ev.fecha_fin)}` : ""}</span>
          </div>
          {ev.lugar && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-purple-400 shrink-0" />
              <span>{ev.lugar}</span>
            </div>
          )}
          {ev.link_reunion && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon size={14} className="text-purple-400 shrink-0" />
              <a href={ev.link_reunion} target="_blank" rel="noreferrer"
                className="text-purple-600 hover:underline truncate">{ev.link_reunion}</a>
            </div>
          )}
          {ev.descripcion && (
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{ev.descripcion}</p>
          )}
        </div>

        {/* Separador tricolor */}
        <div className="flex rounded-lg overflow-hidden h-0.5">
          <div className="flex-1" style={{ background: "#31138b" }} />
          <div className="flex-1" style={{ background: "#ff4d94" }} />
          <div className="flex-1" style={{ background: "#ffbf2f" }} />
        </div>

        {/* ── Contactos ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <User size={11} /> Contactos ({ev.contactos?.length || 0})
            </h4>
            <button onClick={() => setShowContact(v => !v)}
              className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition">
              <Plus size={12} /> Agregar
            </button>
          </div>

          {showContact && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={contacto.nombre} onChange={e => setContacto(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre *" className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white" />
                <input value={contacto.email} onChange={e => setContacto(p => ({ ...p, email: e.target.value }))}
                  placeholder="Email" type="email" className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white" />
                <input value={contacto.telefono} onChange={e => setContacto(p => ({ ...p, telefono: e.target.value }))}
                  placeholder="Teléfono" className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white" />
                <input value={contacto.empresa} onChange={e => setContacto(p => ({ ...p, empresa: e.target.value }))}
                  placeholder="Empresa" className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white" />
                <input value={contacto.cargo} onChange={e => setContacto(p => ({ ...p, cargo: e.target.value }))}
                  placeholder="Cargo" className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white" />
                <select value={contacto.rol} onChange={e => setContacto(p => ({ ...p, rol: e.target.value }))}
                  className="px-3 py-2 rounded-xl border-2 border-purple-100 text-sm outline-none bg-white">
                  {["cliente", "participante", "organizador", "invitado"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={handleContacto} disabled={savingCont || !contacto.nombre.trim()}
                className="w-full py-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}>
                {savingCont ? "Guardando..." : "Agregar contacto"}
              </button>
            </div>
          )}

          {ev.contactos?.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                {c.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 truncate">{c.nombre}</p>
                <p className="text-[10px] text-gray-400">{[c.cargo, c.empresa].filter(Boolean).join(" · ") || c.rol}</p>
              </div>
              <button onClick={() => setDelCont(c)} className="text-red-400 hover:text-red-600 transition">
                <X size={14} />
              </button>
            </div>
          ))}
          {!ev.contactos?.length && !showContact && (
            <p className="text-xs text-gray-400 text-center py-2">Sin contactos</p>
          )}
        </section>

        {/* ── Notas ── */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <MessageSquare size={11} /> Notas ({ev.notas?.length || 0})
          </h4>
          <div className="flex gap-2">
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2}
              placeholder="Escribe una nota..."
              className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-100 focus:border-purple-500 text-sm outline-none resize-none" />
            <button onClick={handleNota} disabled={savingNota || !nota.trim()}
              className="px-4 rounded-xl text-white font-bold text-xs transition disabled:opacity-40 shrink-0"
              style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}>
              {savingNota ? "..." : "Agregar"}
            </button>
          </div>
          {ev.notas?.map(n => (
            <div key={n.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 whitespace-pre-line">{n.contenido}</p>
                <p className="text-[10px] text-gray-400 mt-1">{n.autor} · {moment(n.created_at).fromNow()}</p>
              </div>
              <button onClick={() => setDelNota(n)} className="text-red-400 hover:text-red-600 transition shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
          {!ev.notas?.length && <p className="text-xs text-gray-400 text-center py-1">Sin notas</p>}
        </section>

        {/* ── Archivos ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Paperclip size={11} /> Archivos ({ev.archivos?.length || 0})
            </h4>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition disabled:opacity-40">
              {uploading ? <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" /> : <Plus size={12} />}
              Subir
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleArchivo}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt" />
          </div>
          {ev.archivos?.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl p-3">
              <Paperclip size={14} className="text-purple-400 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">{a.nombre_original}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{a.tamanio}</span>
              <a href={a.url} target="_blank" rel="noreferrer"
                className="text-purple-500 hover:text-purple-700 transition shrink-0">
                <Download size={13} />
              </a>
              <button onClick={() => handleDelArchivo(a.id)} className="text-red-400 hover:text-red-600 transition shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
          {!ev.archivos?.length && <p className="text-xs text-gray-400 text-center py-1">Sin archivos</p>}
        </section>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalForm, setModalForm] = useState(null);
  const [modalDet, setModalDet] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [deleting, setDeleting] = useState(false);
const [vista, setVista] = useState(Views.MONTH);
const [fecha, setFecha] = useState(new Date());
  const showToast = (msg, type = "ok") => setToast({ msg, type });

  const cargar = useCallback(async () => {
    try {
      const [resEv, resRes] = await Promise.all([
        fetch(`${API_URL}/agenda`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/agenda/resumen`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const evData = await resEv.json();
      const resData = await resRes.json();
      setEventos(Array.isArray(evData) ? evData : []);
      setResumen(resData);
    } catch {
      setError("Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const recargarYActualizar = async () => {
    if (!modalDet) { await cargar(); return; }
    await cargar();
    try {
      const res = await fetch(`${API_URL}/agenda/${modalDet.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setModalDet(await res.json());
    } catch {}
  };

  const handleEliminar = async () => {
    if (!confirmar) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/agenda/${confirmar.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        showToast("Evento eliminado");
        setConfirmar(null);
        setModalDet(null);
        await cargar();
      }
    } finally { setDeleting(false); }
  };

  // ── Formateo de eventos para el calendario (duración mínima 1h) ──────────
  const calEvents = eventos.map(e => ({
    id: e.id,
    title: e.titulo,
    start: new Date(e.fecha_inicio),
    end: e.fecha_fin ? new Date(e.fecha_fin) : moment(e.fecha_inicio).add(1, "hour").toDate(),
    allDay: e.todo_el_dia,
    resource: e,
  }));

  const STATS = resumen ? [
    { label: "Hoy", value: resumen.hoy, color: "#31138b" },
    { label: "Próximos", value: resumen.proximos, color: "#ff4d94" },
    { label: "Pendientes", value: resumen.pendientes, color: "#f59e0b" },
    { label: "Vencidos", value: resumen.vencidos, color: "#ef4444" },
  ] : [];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)" }}>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Título y botón nuevo */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <p className="text-sm font-medium" style={{ color: "#31138b" }}>Gestión del tiempo</p>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
            Mi agenda <span className="font-normal text-gray-600">y eventos</span>
          </h1>
        </div>
        <button onClick={() => setModalForm("nuevo")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#31138b,#ff4d94)" }}>
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Stats */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-4 text-center">
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

      {/* Calendario */}
      {loading ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100 h-[600px] animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-4">
          <style>{`
            .rbc-calendar { font-family: inherit; }
            .rbc-toolbar button {
              border-radius: 10px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              border-color: #e9d5ff !important;
              color: #31138b !important;
            }
            .rbc-toolbar button.rbc-active {
              background: #31138b !important;
              color: white !important;
              box-shadow: 0 2px 8px rgba(49,19,139,0.25) !important;
            }
            .rbc-toolbar button:hover { background: #faf5ff !important; }
            .rbc-toolbar button.rbc-active:hover { background: #31138b !important; }
            .rbc-header { font-size: 11px !important; font-weight: 700 !important; color: #9ca3af; padding: 8px 0 !important; }
            .rbc-today { background: #faf5ff !important; }
            .rbc-event { border-radius: 6px !important; font-size: 11px !important; font-weight: 600 !important; }
            .rbc-off-range-bg { background: #fafafa !important; }
            .rbc-date-cell { font-size: 12px !important; font-weight: 600 !important; }
            .rbc-show-more { font-size: 11px !important; color: #31138b !important; font-weight: 700 !important; }
            .rbc-month-row { min-height: 80px; }
          `}</style>
    <Calendar
  localizer={localizer}
  events={calEvents}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 580 }}
  view={vista}
  onView={setVista}
  date={fecha}
  onNavigate={setFecha}
  selectable
  onSelectSlot={({ start, end }) => {
    setModalForm({
      _nuevo: true,
      ...FORM_VACIO,
      fecha_inicio: moment(start).format("YYYY-MM-DDTHH:mm"),
      fecha_fin: moment(end).format("YYYY-MM-DDTHH:mm"),
    });
  }}
  onSelectEvent={e => {
    if (!e?.resource?.id) return;
    setModalDet(e.resource);
  }}
  components={{ event: EventoCalendario }}
  messages={{
    today: "Hoy", previous: "←", next: "→",
    month: "Mes", week: "Semana", day: "Día",
    date: "Fecha", time: "Hora", event: "Evento",
    showMore: n => `+${n} más`,
  }}
  eventPropGetter={e => {
    const color = e.resource?.color || tipoColor(e.resource?.tipo);
    return {
      style: {
        backgroundColor: color + "22",
        borderColor: color,
        color: "#1f2937",
        borderLeft: `3px solid ${color}`,
      },
    };
  }}
/>
        </div>
      )}

      {/* Modales */}
      {modalForm && (
        <AgendaModal
          evento={(modalForm === "nuevo" || modalForm?._nuevo) ? null : modalForm}
          onClose={() => setModalForm(null)}
          onGuardado={() => {
            showToast((modalForm === "nuevo" || modalForm?._nuevo) ? "Evento creado" : "Evento actualizado");
            cargar();
          }}
        />
      )}

      {modalDet && (
        <ModalDetalle
          evento={modalDet}
          onClose={() => setModalDet(null)}
          onEditar={() => {
            setModalForm({ ...modalDet, _editar: true });
            setModalDet(null);
          }}
          onEliminar={() => setConfirmar(modalDet)}
          onActualizado={recargarYActualizar}
        />
      )}

      {confirmar && (
        <ModalConfirmar
          titulo={confirmar.titulo}
          onConfirm={handleEliminar}
          onClose={() => setConfirmar(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}