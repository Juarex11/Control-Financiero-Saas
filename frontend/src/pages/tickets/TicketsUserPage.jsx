import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus, X, AlertCircle, MessageSquare, ChevronRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const ESTADO = {
  pendiente:   { label: "Pendiente",   bg: "#fef9c3", color: "#ca8a04" },
  en_revision: { label: "En revisión", bg: "#eff6ff", color: "#2563eb" },
  resuelto:    { label: "Resuelto",    bg: "#f0fdf4", color: "#16a34a" },
};

function Badge({ estado }) {
  const e = ESTADO[estado] ?? ESTADO.pendiente;
  return (
    <span style={{
      fontSize: "0.65rem",
      fontWeight: 700,
      padding: "0.15rem 0.6rem",
      background: e.bg,
      color: e.color,
      border: `1px solid ${e.color}40`,
      whiteSpace: "nowrap",
      borderRadius: "4px",
    }}>
      {e.label}
    </span>
  );
}

// ── Modal crear ticket ────────────────────────────────────────────────────────
function ModalNuevo({ onClose, onCreado }) {
  const [asunto,  setAsunto]  = useState("");
  const [mensaje, setMensaje] = useState("");
  const [foto,    setFoto]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const enviar = async () => {
    if (!asunto.trim())  return setError("El asunto es obligatorio.");
    if (!mensaje.trim()) return setError("El mensaje es obligatorio.");
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("asunto",  asunto);
      fd.append("mensaje", mensaje);
      if (foto) fd.append("foto", foto);

      const res = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear el ticket.");
      onCreado(data.ticket);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#fff", width: "100%", maxWidth: 500, boxShadow: "0 25px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ background: "#31138b", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* White ticket icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M21 7.5V6a2 2 0 0 0-2-2h-1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 16.5V18a2 2 0 0 0 2 2h1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 14h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Nuevo ticket de soporte</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.375rem" }}>Asunto</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="¿En qué podemos ayudarte?"
              style={{ width: "100%", height: 40, border: "2px solid #e5e7eb", padding: "0 0.75rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.375rem" }}>Describe tu consulta</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Explica con el mayor detalle posible…"
              rows={4}
              style={{ width: "100%", border: "2px solid #e5e7eb", padding: "0.5rem 0.75rem", fontSize: "0.875rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.375rem" }}>Adjuntar imagen (opcional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", border: "2px dashed #e5e7eb", cursor: "pointer", fontSize: "0.75rem", color: "#6b7280", background: "#f9fafb" }}>
                <Plus size={14} />
                {foto ? foto.name : "Seleccionar imagen"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setFoto(e.target.files[0] || null)} />
              </label>
              {foto && (
                <button onClick={() => setFoto(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", fontSize: "0.75rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.5rem 0.75rem" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            onClick={enviar}
            disabled={loading}
            style={{ height: 44, background: "#31138b", color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Enviando…" : "Crear ticket"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Página principal de tickets ─────────────────────────────────────────────
export default function TicketsUserPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filtro,  setFiltro]  = useState("all");
  const [modalNuevo, setModalNuevo] = useState(false);

  const cargarLista = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar los tickets.");
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const handleCreado = () => {
    cargarLista();
  };

  const handleVerTicket = (id) => {
    navigate(`/tickets/${id}/chat`);
  };

  const filtrados = tickets.filter((t) => filtro === "all" || t.estado === filtro);

  return (
    <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={24} style={{ color: "#31138b" }} />
            Tickets de soporte
          </h1>
          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "#31138b", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 6px rgba(49, 19, 139, 0.2)" }}
        >
          <Plus size={18} /> Nuevo ticket
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { k: "all", l: "Todos" },
          { k: "pendiente", l: "Pendientes" },
          { k: "en_revision", l: "En revisión" },
          { k: "resuelto", l: "Resueltos" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: filtro === f.k ? "#31138b" : "#f3f4f6",
              color: filtro === f.k ? "#fff" : "#6b7280",
              borderRadius: "4px",
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={16} /> {error}
          <button onClick={cargarLista} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#ef4444", textDecoration: "underline", cursor: "pointer" }}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div style={{ width: 32, height: 32, border: "4px solid #31138b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#fff", border: "2px solid #f3f4f6" }}>
          <MessageSquare size={48} style={{ color: "#e5e7eb", margin: "0 auto 0.75rem" }} />
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0 }}>
            {tickets.length === 0 ? "Aún no has creado ningún ticket." : "No hay tickets con este filtro."}
          </p>
          {tickets.length === 0 && (
            <button
              onClick={() => setModalNuevo(true)}
              style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", background: "#31138b", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
            >
              Crear mi primer ticket
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "2px solid #f3f4f6", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>ID</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Asunto</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Estado</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Fecha</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Mensajes</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f3ff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => handleVerTicket(t.id)}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#31138b" }}>#{t.id}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500, color: "#111827" }}>{t.asunto}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><Badge estado={t.estado} /></td>
                  <td style={{ padding: "0.75rem 1rem", color: "#6b7280", fontSize: "0.8rem" }}>
                    {new Date(t.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280" }}>
                    {t.mensajes_count ?? 0}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVerTicket(t.id); }}
                      style={{ background: "transparent", border: "none", color: "#31138b", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      Ver <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalNuevo && <ModalNuevo onClose={() => setModalNuevo(false)} onCreado={handleCreado} />}
    </div>
  );
}