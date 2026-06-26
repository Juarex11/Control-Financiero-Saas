import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Paperclip, X, AlertCircle, ArrowLeft, Clock, CheckCircle, RotateCcw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const ESTADO = {
  pendiente:   { label: "Pendiente",   bg: "#fef9c3", color: "#ca8a04", Icon: Clock         },
  en_revision: { label: "En revisión", bg: "#eff6ff", color: "#2563eb", Icon: RotateCcw     },
  resuelto:    { label: "Resuelto",    bg: "#f0fdf4", color: "#16a34a", Icon: CheckCircle   },
};

function Badge({ estado }) {
  const e = ESTADO[estado] ?? ESTADO.pendiente;
  const Icon = e.Icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.75rem",
      background: e.bg, color: e.color,
      border: `1.5px solid ${e.color}50`,
      borderRadius: "999px",
    }}>
      <Icon size={11} strokeWidth={2.5} />
      {e.label}
    </span>
  );
}

// Avatar inicial
function Avatar({ name, isSupport }) {
  const initial = isSupport ? "S" : (name?.[0] ?? "?").toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.75rem",
      background: isSupport ? "#31138b" : "#f3f4f6",
      color: isSupport ? "#fff" : "#6b7280",
      border: isSupport ? "2px solid #4c1d95" : "2px solid #e5e7eb",
    }}>
      {initial}
    </div>
  );
}

export default function TicketChatPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || "{}");

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [texto,   setTexto]   = useState("");
  const [foto,    setFoto]    = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const cargar = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/tickets/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar.");
      setTicket(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.mensajes?.length]);

  const enviar = async () => {
    if (!texto.trim() && !foto) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("mensaje", texto);
      if (foto) fd.append("foto", foto);
      const res = await fetch(`${API_URL}/tickets/${id}/responder`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      if (!res.ok) throw new Error("Error al enviar.");
      setTexto(""); setFoto(null);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#f8fafc" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 1rem" }} />
        <p style={{ color:"#9ca3af", fontSize:"0.85rem", margin:0 }}>Cargando conversación…</p>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !ticket) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#f8fafc", padding:"2rem" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
        <AlertCircle size={32} color="#ef4444" />
      </div>
      <p style={{ color:"#374151", fontWeight:700, fontSize:"1rem", margin:"0 0 0.25rem" }}>No se pudo cargar</p>
      <p style={{ color:"#9ca3af", fontSize:"0.85rem", margin:"0 0 1.5rem" }}>{error || "Ticket no encontrado"}</p>
      <button onClick={() => navigate("/tickets")}
        style={{ padding:"0.6rem 1.5rem", background:"#31138b", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:"0.875rem" }}>
        ← Volver a tickets
      </button>
    </div>
  );

  const resuelto = ticket.estado === "resuelto";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 56px)", background:"#f8fafc", overflow:"hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0.875rem 1.5rem", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
          {/* Izquierda */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", minWidth:0 }}>
            <button onClick={() => navigate("/tickets")}
              style={{ display:"flex", alignItems:"center", gap:"0.375rem", background:"#f3f4f6", border:"none", borderRadius:6, padding:"0.4rem 0.75rem", cursor:"pointer", color:"#374151", fontWeight:600, fontSize:"0.8rem", flexShrink:0 }}>
              <ArrowLeft size={15} /> Volver
            </button>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontWeight:800, fontSize:"0.95rem", color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {ticket.asunto}
              </p>
              <p style={{ margin:0, fontSize:"0.65rem", color:"#9ca3af" }}>Ticket #{ticket.id}</p>
            </div>
          </div>
          {/* Badge estado */}
          <Badge estado={ticket.estado} />
        </div>
      </div>

      {/* ── MENSAJES ──────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

        {/* Fecha de inicio */}
        <div style={{ textAlign:"center", marginBottom:"0.5rem" }}>
          <span style={{ fontSize:"0.65rem", color:"#9ca3af", background:"#f1f5f9", padding:"0.25rem 0.875rem", borderRadius:999 }}>
            {new Date(ticket.created_at).toLocaleDateString("es-PE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
          </span>
        </div>

        {(ticket.mensajes ?? []).length === 0 && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:"#d1d5db" }}>
            <p style={{ margin:0, fontSize:"0.875rem" }}>Aún no hay mensajes en este ticket.</p>
          </div>
        )}

        {(ticket.mensajes ?? []).map((m, idx) => {
          const esMio     = m.user_id === user.id;
          const isSupport = m.user?.role === "admin";
          const prevMsg   = (ticket.mensajes ?? [])[idx - 1];
          const mismoUser = prevMsg && prevMsg.user_id === m.user_id;

          return (
            <div key={m.id}
              style={{ display:"flex", flexDirection: esMio ? "row-reverse" : "row", gap:"0.625rem", alignItems:"flex-end", animation:"fadeUp .2s ease" }}>

              {/* Avatar — solo si cambia de emisor */}
              {!mismoUser
                ? <Avatar name={m.user?.name} isSupport={isSupport} />
                : <div style={{ width:32, flexShrink:0 }} />
              }

              <div style={{ maxWidth:"68%", display:"flex", flexDirection:"column", gap:"0.2rem", alignItems: esMio ? "flex-end" : "flex-start" }}>
                {/* Nombre — solo si cambia de emisor */}
                {!mismoUser && (
                  <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700, color: isSupport ? "#31138b" : "#6b7280", paddingLeft:esMio ? 0 : "0.25rem", paddingRight:esMio ? "0.25rem" : 0 }}>
                    {esMio ? "Tú" : isSupport ? "Soporte" : m.user?.name}
                  </p>
                )}

                {/* Burbuja */}
                <div style={{
                  padding:"0.625rem 0.925rem",
                  background: esMio ? "#31138b" : "#fff",
                  color:      esMio ? "#fff"    : "#1f2937",
                  border:     esMio ? "none"    : "1px solid #e5e7eb",
                  borderRadius: esMio ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  boxShadow: esMio ? "0 2px 8px rgba(49,19,139,0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
                  fontSize:"0.875rem", lineHeight:1.6,
                }}>
                  <p style={{ margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{m.mensaje}</p>
                  {m.foto_url && (
                    <img src={m.foto_url} alt="adjunto"
                      style={{ marginTop:"0.625rem", maxWidth:240, maxHeight:200, width:"100%", objectFit:"cover", borderRadius:8, display:"block",
                        border: esMio ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb" }} />
                  )}
                </div>

                {/* Timestamp */}
                <p style={{ margin:0, fontSize:"0.6rem", color:"#9ca3af", paddingLeft:esMio ? 0 : "0.25rem", paddingRight:esMio ? "0.25rem" : 0 }}>
                  {new Date(m.created_at).toLocaleString("es-PE", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT / BANNER RESUELTO ────────────────────────────────── */}
      {resuelto ? (
        <div style={{ padding:"1rem 1.5rem", background:"#f0fdf4", borderTop:"1px solid #bbf7d0", flexShrink:0, textAlign:"center" }}>
          <p style={{ margin:0, fontSize:"0.85rem", color:"#15803d", fontWeight:700 }}>✓ Ticket resuelto</p>
          <p style={{ margin:"0.2rem 0 0", fontSize:"0.75rem", color:"#4ade80" }}>Si necesitas más ayuda, abre un nuevo ticket.</p>
        </div>
      ) : (
        <div style={{ padding:"0.75rem 1rem 1rem", background:"#fff", borderTop:"1px solid #f1f5f9", flexShrink:0 }}>
          {/* Preview foto adjunta */}
          {foto && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.625rem", padding:"0.4rem 0.75rem", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:6, fontSize:"0.75rem", color:"#6b7280" }}>
              <Paperclip size={13} />
              <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{foto.name}</span>
              <button onClick={() => setFoto(null)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#ef4444", padding:0, display:"flex", alignItems:"center" }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{ display:"flex", gap:"0.5rem", alignItems:"flex-end" }}>
            {/* Adjuntar */}
            <label title="Adjuntar imagen"
              style={{ width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", border:"1.5px solid #e5e7eb", borderRadius:8, cursor:"pointer", color:"#9ca3af", flexShrink:0, background:"#f8fafc", transition:"all .15s" }}>
              <Paperclip size={17} />
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => setFoto(e.target.files[0] || null)} />
            </label>

            {/* Textarea */}
            <textarea value={texto} onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escribe tu mensaje… (Enter para enviar)"
              rows={2}
              style={{ flex:1, border:"1.5px solid #e5e7eb", borderRadius:8, padding:"0.6rem 0.875rem", fontSize:"0.875rem", outline:"none", resize:"none", fontFamily:"inherit", boxSizing:"border-box", lineHeight:1.5, background:"#f8fafc", transition:"border .15s" }}
              onFocus={e => e.target.style.borderColor = "#31138b"}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
            />

            {/* Enviar */}
            <button onClick={enviar} disabled={sending || (!texto.trim() && !foto)}
              style={{ width:40, height:40, background:"#31138b", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0,
                opacity: (sending || (!texto.trim() && !foto)) ? 0.4 : 1, transition:"opacity .15s, transform .1s",
                transform: "scale(1)" }}>
              {sending
                ? <div style={{ width:16, height:16, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
                : <Send size={17} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}