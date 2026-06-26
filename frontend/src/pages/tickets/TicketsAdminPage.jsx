import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send, Paperclip, X, Clock, CheckCircle, RotateCcw,
  MessageSquare, RefreshCw, ChevronDown,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

const ESTADO = {
  pendiente:   { label: "Pendiente",   bg: "#fef9c3", color: "#ca8a04", Icon: Clock       },
  en_revision: { label: "En revisión", bg: "#eff6ff", color: "#2563eb", Icon: RotateCcw   },
  resuelto:    { label: "Resuelto",    bg: "#f0fdf4", color: "#16a34a", Icon: CheckCircle },
};

function Badge({ estado }) {
  const e = ESTADO[estado] ?? ESTADO.pendiente;
  const Icon = e.Icon;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"0.3rem",
      fontSize:"0.65rem", fontWeight:700, padding:"0.25rem 0.7rem",
      background: e.bg, color: e.color,
      border:`1.5px solid ${e.color}50`, borderRadius:999,
    }}>
      <Icon size={11} strokeWidth={2.5} /> {e.label}
    </span>
  );
}

function Avatar({ name, isAdmin }) {
  const initial = isAdmin ? "S" : (name?.[0] ?? "?").toUpperCase();
  return (
    <div style={{
      width:32, height:32, borderRadius:"50%", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:"0.75rem",
      background: isAdmin ? "#31138b" : "#f3f4f6",
      color:      isAdmin ? "#fff"    : "#6b7280",
      border:     isAdmin ? "2px solid #4c1d95" : "2px solid #e5e7eb",
    }}>
      {initial}
    </div>
  );
}

// ── Chat con paginación ───────────────────────────────────────────────────────
const PAGE_SIZE = 15;

function ChatAdmin({ ticket, onActualizado }) {
  const [texto,      setTexto]      = useState("");
  const [foto,       setFoto]       = useState(null);
  const [sending,    setSending]    = useState(false);
  const [cambiando,  setCambiando]  = useState(null);
  const [page,       setPage]       = useState(1);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  // Reset página cuando cambia el ticket
  useEffect(() => { setPage(1); }, [ticket?.id]);

  // Scroll al fondo solo en primera carga o mensaje nuevo
  useEffect(() => {
    if (page === 1) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.mensajes?.length, page]);

  const todos   = ticket?.mensajes ?? [];
  const total   = todos.length;
  const inicio  = Math.max(0, total - page * PAGE_SIZE);
  const visibles = todos.slice(inicio);
  const hayMas   = inicio > 0;

  const enviar = async () => {
    if (!texto.trim() && !foto) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("mensaje", texto);
      if (foto) fd.append("foto", foto);
      const res = await fetch(`${API_URL}/admin/tickets/${ticket.id}/responder`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      if (!res.ok) throw new Error();
      setTexto(""); setFoto(null);
      onActualizado();
    } catch {} finally { setSending(false); }
  };

  const cambiarEstado = async (estado) => {
    setCambiando(estado);
    try {
      await fetch(`${API_URL}/admin/tickets/${ticket.id}/estado`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
        body: JSON.stringify({ estado }),
      });
      onActualizado();
    } catch {} finally { setCambiando(null); }
  };

  if (!ticket) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
      <MessageSquare size={52} style={{ color:"#e5e7eb", marginBottom:"0.75rem" }} />
      <p style={{ color:"#9ca3af", fontSize:"0.875rem", margin:0 }}>Selecciona un ticket para gestionar</p>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"0.875rem 1.5rem", borderBottom:"1px solid #e5e7eb", background:"#fff", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:"0.95rem", color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {ticket.asunto}
            </p>
            <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af" }}>
              #{ticket.id} · {ticket.user?.name} · {ticket.user?.email}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", flexWrap:"wrap", flexShrink:0 }}>
            <Badge estado={ticket.estado} />
            {ticket.estado !== "pendiente" && (
              <button onClick={() => cambiarEstado("pendiente")} disabled={!!cambiando}
                style={{ fontSize:"0.65rem", fontWeight:700, padding:"0.25rem 0.7rem", cursor:"pointer", borderRadius:999,
                  background:"#fef9c3", color:"#ca8a04", border:"1.5px solid #fde047", opacity: cambiando==="pendiente"?.5:1 }}>
                Pendiente
              </button>
            )}
            {ticket.estado !== "en_revision" && (
              <button onClick={() => cambiarEstado("en_revision")} disabled={!!cambiando}
                style={{ fontSize:"0.65rem", fontWeight:700, padding:"0.25rem 0.7rem", cursor:"pointer", borderRadius:999,
                  background:"#eff6ff", color:"#2563eb", border:"1.5px solid #93c5fd", opacity: cambiando==="en_revision"?.5:1 }}>
                En revisión
              </button>
            )}
            {ticket.estado !== "resuelto" && (
              <button onClick={() => cambiarEstado("resuelto")} disabled={!!cambiando}
                style={{ fontSize:"0.65rem", fontWeight:700, padding:"0.25rem 0.7rem", cursor:"pointer", borderRadius:999,
                  background:"#f0fdf4", color:"#16a34a", border:"1.5px solid #86efac", opacity: cambiando==="resuelto"?.5:1 }}>
                ✓ Resuelto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"0.875rem", background:"#f8fafc" }}>

        {/* Cargar más */}
        {hayMas && (
          <div style={{ textAlign:"center" }}>
            <button onClick={() => setPage(p => p + 1)}
              style={{ display:"inline-flex", alignItems:"center", gap:"0.375rem", fontSize:"0.7rem", fontWeight:700, color:"#6b7280",
                background:"#fff", border:"1px solid #e5e7eb", borderRadius:999, padding:"0.3rem 0.875rem", cursor:"pointer" }}>
              <ChevronDown size={13} /> Cargar mensajes anteriores ({inicio} más)
            </button>
          </div>
        )}

        {/* Separador fecha */}
        {visibles.length > 0 && (
          <div style={{ textAlign:"center" }}>
            <span style={{ fontSize:"0.65rem", color:"#9ca3af", background:"#eef2f7", padding:"0.2rem 0.875rem", borderRadius:999 }}>
              {new Date(ticket.created_at).toLocaleDateString("es-PE", { weekday:"long", day:"2-digit", month:"long" })}
            </span>
          </div>
        )}

        {visibles.length === 0 && (
          <p style={{ textAlign:"center", color:"#d1d5db", fontSize:"0.85rem", margin:"auto 0" }}>Sin mensajes aún.</p>
        )}

        {visibles.map((m, idx) => {
          const esAdmin   = m.user?.role === "admin";
          const prev      = visibles[idx - 1];
          const mismoUser = prev && prev.user_id === m.user_id;

          return (
            <div key={m.id} style={{ display:"flex", flexDirection: esAdmin ? "row-reverse" : "row", gap:"0.625rem", alignItems:"flex-end" }}>
              {!mismoUser
                ? <Avatar name={m.user?.name} isAdmin={esAdmin} />
                : <div style={{ width:32, flexShrink:0 }} />}

              <div style={{ maxWidth:"70%", display:"flex", flexDirection:"column", alignItems: esAdmin ? "flex-end" : "flex-start", gap:"0.2rem" }}>
                {!mismoUser && (
                  <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700,
                    color: esAdmin ? "#31138b" : "#6b7280",
                    paddingLeft: esAdmin ? 0 : "0.25rem",
                    paddingRight: esAdmin ? "0.25rem" : 0 }}>
                    {esAdmin ? "Soporte" : m.user?.name ?? "Usuario"}
                  </p>
                )}
                <div style={{
                  padding:"0.625rem 0.925rem",
                  background: esAdmin ? "#31138b" : "#fff",
                  color:      esAdmin ? "#fff"    : "#1f2937",
                  border:     esAdmin ? "none"    : "1px solid #e5e7eb",
                  borderRadius: esAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  boxShadow: esAdmin ? "0 2px 8px rgba(49,19,139,0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
                  fontSize:"0.875rem", lineHeight:1.6,
                }}>
                  <p style={{ margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{m.mensaje}</p>
                  {m.foto_url && (
                    <img src={m.foto_url} alt="adjunto"
                      style={{ marginTop:"0.625rem", maxWidth:220, maxHeight:180, width:"100%", objectFit:"cover",
                        borderRadius:8, display:"block", border: esAdmin ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb" }} />
                  )}
                </div>
                <p style={{ margin:0, fontSize:"0.6rem", color:"#9ca3af",
                  paddingLeft: esAdmin ? 0 : "0.25rem",
                  paddingRight: esAdmin ? "0.25rem" : 0 }}>
                  {new Date(m.created_at).toLocaleString("es-PE", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                  {esAdmin && " · Soporte"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"0.75rem 1rem 1rem", background:"#fff", borderTop:"1px solid #f1f5f9", flexShrink:0 }}>
        {foto && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem", padding:"0.375rem 0.625rem", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:6, fontSize:"0.75rem", color:"#6b7280" }}>
            <Paperclip size={12} />
            <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{foto.name}</span>
            <button onClick={() => setFoto(null)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#ef4444", padding:0, display:"flex" }}><X size={12} /></button>
          </div>
        )}
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"flex-end" }}>
          <label style={{ width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", border:"1.5px solid #e5e7eb", borderRadius:8, cursor:"pointer", color:"#9ca3af", flexShrink:0, background:"#f8fafc" }}>
            <Paperclip size={16} />
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => setFoto(e.target.files[0]||null)} />
          </label>
          <textarea value={texto} onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();} }}
            placeholder="Responder al usuario… (Enter envía)" rows={2}
            style={{ flex:1, border:"1.5px solid #e5e7eb", borderRadius:8, padding:"0.6rem 0.875rem", fontSize:"0.875rem", outline:"none", resize:"none", fontFamily:"inherit", boxSizing:"border-box", lineHeight:1.5, background:"#f8fafc" }}
            onFocus={e => e.target.style.borderColor="#31138b"}
            onBlur={e  => e.target.style.borderColor="#e5e7eb"} />
          <button onClick={enviar} disabled={sending||(!texto.trim()&&!foto)}
            style={{ width:40, height:40, background:"#31138b", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0, opacity:(sending||(!texto.trim()&&!foto))?.4:1, transition:"opacity .15s" }}>
            {sending
              ? <div style={{ width:16, height:16, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
              : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página admin ──────────────────────────────────────────────────────────────
export default function TicketsAdminPage() {
  const [tickets,  setTickets]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState("all");

  const cargarLista = useCallback(async () => {
    try {
      const url  = filtro==="all" ? `${API_URL}/admin/tickets` : `${API_URL}/admin/tickets?estado=${filtro}`;
      const res  = await fetch(url, { headers:{ Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [filtro]);

  const cargarDetalle = useCallback(async (id) => {
    try {
      const res  = await fetch(`${API_URL}/admin/tickets/${id}`, { headers:{ Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      setSelected(data);
      setTickets(prev => prev.map(t => t.id===id ? { ...t, estado:data.estado, mensajes_count:data.mensajes?.length??t.mensajes_count } : t));
    } catch {}
  }, []);

  useEffect(() => { cargarLista(); }, [cargarLista]);

  const stats = {
    pendiente:   tickets.filter(t=>t.estado==="pendiente").length,
    en_revision: tickets.filter(t=>t.estado==="en_revision").length,
    resuelto:    tickets.filter(t=>t.estado==="resuelto").length,
  };

  return (
    <div style={{ display:"flex", height:"calc(100vh - 56px)", background:"#f8fafc", overflow:"hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Lista ───────────────────────────────────────────────── */}
      <div style={{ width:340, flexShrink:0, display:"flex", flexDirection:"column", background:"#fff", borderRight:"1px solid #e5e7eb" }}>

        {/* Header lista */}
        <div style={{ padding:"1.25rem 1rem 0.875rem", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.875rem" }}>
            <div>
              <h2 style={{ margin:0, fontSize:"1.05rem", fontWeight:800, color:"#111827" }}>Soporte</h2>
              <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af" }}>{tickets.length} tickets</p>
            </div>
            <button onClick={cargarLista} title="Refrescar"
              style={{ width:32, height:32, background:"#f3f4f6", border:"none", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6b7280" }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.375rem", marginBottom:"0.875rem" }}>
            {[
              { k:"pendiente",   l:"Pendientes",  v:stats.pendiente,   c:"#ca8a04", bg:"#fef9c3" },
              { k:"en_revision", l:"En revisión", v:stats.en_revision, c:"#2563eb", bg:"#eff6ff" },
              { k:"resuelto",    l:"Resueltos",   v:stats.resuelto,    c:"#16a34a", bg:"#f0fdf4" },
            ].map(s => (
              <button key={s.k} onClick={() => setFiltro(filtro===s.k?"all":s.k)}
                style={{ padding:"0.5rem 0.25rem", textAlign:"center", cursor:"pointer", borderRadius:6, transition:"all .15s",
                  background: filtro===s.k ? s.c : s.bg,
                  border:`1px solid ${s.c}30`,
                  color: filtro===s.k ? "#fff" : s.c }}>
                <p style={{ margin:0, fontSize:"1.1rem", fontWeight:800, lineHeight:1 }}>{s.v}</p>
                <p style={{ margin:"0.15rem 0 0", fontSize:"0.6rem", fontWeight:600 }}>{s.l}</p>
              </button>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display:"flex", gap:"0.25rem", flexWrap:"wrap" }}>
            {[{k:"all",l:"Todos"},{k:"pendiente",l:"Pendientes"},{k:"en_revision",l:"Revisión"},{k:"resuelto",l:"Resueltos"}].map(f => (
              <button key={f.k} onClick={() => setFiltro(f.k)}
                style={{ padding:"0.3rem 0.6rem", fontSize:"0.65rem", fontWeight:700, cursor:"pointer", border:"none", borderRadius:4, transition:"all .15s",
                  background: filtro===f.k ? "#31138b" : "#f3f4f6",
                  color:      filtro===f.k ? "#fff"    : "#6b7280" }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}>
              <div style={{ width:24, height:24, border:"3px solid #31138b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
              <MessageSquare size={36} style={{ color:"#e5e7eb", margin:"0 auto 0.75rem" }} />
              <p style={{ color:"#9ca3af", fontSize:"0.8rem", margin:0 }}>Sin tickets con este filtro.</p>
            </div>
          ) : tickets.map(t => {
            const activo = selected?.id === t.id;
            return (
              <button key={t.id} onClick={() => cargarDetalle(t.id)}
                style={{ width:"100%", textAlign:"left", padding:"0.875rem 1rem", display:"block",
                  background: activo ? "#f5f3ff" : "#fff", border:"none",
                  borderLeft:`3px solid ${activo?"#31138b":"transparent"}`,
                  borderBottom:"1px solid #f9fafb", cursor:"pointer", transition:"all .15s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem", marginBottom:"0.3rem" }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:"0.85rem", color:"#111827", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {t.asunto}
                  </p>
                  <Badge estado={t.estado} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"0.65rem", color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                    {t.user?.name ?? "—"} · {new Date(t.created_at).toLocaleDateString("es-PE",{day:"2-digit",month:"short"})}
                  </span>
                  <span style={{ fontSize:"0.65rem", color:"#9ca3af", flexShrink:0, marginLeft:"0.5rem" }}>
                    {t.mensajes_count??0} msg
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat ────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <ChatAdmin
          ticket={selected}
          onActualizado={() => { if(selected) cargarDetalle(selected.id); cargarLista(); }}
        />
      </div>
    </div>
  );
}