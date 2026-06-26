import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Trash2, Pencil, Copy, Check,
  Shield, User, Search, X, Camera, ChevronDown, Clock,
  GitBranch, ArrowLeft, Users as UsersIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || "";

function getToken() {
  return localStorage.getItem("token");
}

function initials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = 8 }) {
  const [err, setErr] = useState(false);
  const [perfilErr, setPerfilErr] = useState(false);
  const cls = `w-${size} h-${size} rounded-[2px] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden`;

  const src = user.photo_url || (user.photo ? `${STORAGE_URL}/${user.photo}` : null);

  if (src && !err) {
    return (
      <div className={cls}>
        <img src={src} alt={user.name} className="w-full h-full object-cover" loading="lazy" onError={() => setErr(true)} />
      </div>
    );
  }

  if (!perfilErr) {
    return (
      <div className={cls}>
        <img src="/perfil.png" alt="Perfil" className="w-full h-full object-cover" loading="lazy" onError={() => setPerfilErr(true)} />
      </div>
    );
  }

  return (
    <div className={`${cls} ${user.role === "admin" ? "bg-[#31138b]" : "bg-[#ff4d94]"}`}>
      {initials(user.name)}
    </div>
  );
}

// ── Badge código ────────────────────────────────────────────────────────────

const CodigoBadge = ({ codigo }) => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [codigo]);

  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-gray-50 border border-gray-200 text-gray-600 font-mono text-xs font-bold hover:bg-gray-100 transition">
      {codigo}
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="opacity-50" />}
    </button>
  );
};

// ── Select buscable ─────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() =>
    options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm text-left outline-none focus:border-[#ff4d94] transition bg-white flex items-center justify-between"
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[2px] shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-[2px] outline-none focus:border-[#ff4d94]"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              {placeholder}
            </button>
            {filtered.length === 0 ? (
              <p className="px-4 py-2 text-xs text-gray-400">Sin resultados</p>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setIsOpen(false); setSearchTerm(""); }}
                  className={`w-full text-left px-4 py-2 text-sm transition flex items-center justify-between ${
                    o.value === value ? "bg-pink-50 text-[#ff4d94] font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {o.label}
                  {o.value === value && <Check size={14} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Formatear fecha ─────────────────────────────────────────────────────────

function formatLastLogin(date) {
  if (!date) return "—";
  const now = new Date();
  const last = new Date(date);
  const diffMins = Math.floor((now - last) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return last.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [orgUser, setOrgUser] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", password: "", cargo: "", telefono: "", padre_id: "", role: "user",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = useCallback(async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      cargar();
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }, [cargar]);

  const abrirPanel = useCallback((user = null) => {
    setError("");
    setPhotoFile(null);
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        password: "",
        cargo: user.cargo ?? "",
        telefono: user.telefono ?? "",
        padre_id: user.padre_id ?? "",
        role: user.role ?? "user",
      });
      setPhotoPreview(user.photo_url || (user.photo ? `${STORAGE_URL}/${user.photo}` : null));
      setEditing(user);
    } else {
      setForm({ name: "", email: "", password: "", cargo: "", telefono: "", padre_id: "", role: "user" });
      setPhotoPreview(null);
      setEditing(null);
    }
    setPanel(true);
  }, []);

  const cerrarPanel = useCallback(() => {
    setPanel(false);
    setEditing(null);
    setForm({ name: "", email: "", password: "", cargo: "", telefono: "", padre_id: "", role: "user" });
    setPhotoPreview(null);
    setPhotoFile(null);
    setError("");
  }, []);

  const handlePhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name || !form.email) { setError("Nombre y email son requeridos."); return; }
    if (!editing && !form.password) { setError("La contraseña es requerida."); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("role", form.role);
      if (form.password) fd.append("password", form.password);
      if (form.cargo) fd.append("cargo", form.cargo);
      if (form.telefono) fd.append("telefono", form.telefono);
      if (form.padre_id) fd.append("padre_id", form.padre_id);
      if (photoFile) fd.append("photo", photoFile);

      const url = editing
        ? `${API_URL}/users/${editing.id}/update`
        : `${API_URL}/users`;

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al guardar."); return; }

      await cargar();
      cerrarPanel();
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setSaving(false);
    }
  }, [form, editing, photoFile, cargar, cerrarPanel]);

  const filtered = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.codigo_acceso ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const padreOptions = useMemo(() =>
    users
      .filter(u => u.id !== editing?.id)
      .map(u => ({ value: u.id, label: `${u.name} — ${u.codigo_acceso || "Sin código"}` })),
    [users, editing?.id]
  );

  return (
    <div className="relative flex h-full">
      <div className={`flex-1 p-6 space-y-5 transition-all duration-300 overflow-y-auto ${panel ? "mr-[420px]" : ""}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestión del árbol de usuarios</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/organigrama")}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#31138b] text-[#31138b] text-sm font-semibold rounded-[2px] hover:bg-[#31138b]/5 transition"
            >
              <GitBranch size={16} /> Organigrama
            </button>
            <button
              onClick={() => abrirPanel(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#31138b] text-white text-sm font-semibold rounded-[2px] hover:bg-[#4c1d95] transition shadow-sm"
            >
              <Plus size={16} /> Nuevo usuario
            </button>
          </div>
        </div>

        {/* Stats - NUEVO DISEÑO CON CÍRCULOS GRANDES Y COLORES */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { 
              label: "Total miembros",           
              value: users.length,                              
              color: "#31138b",
              bgGradient: "from-[#31138b] to-[#6b21d9]",
              icon: UsersIcon,
              iconBg: "bg-[#31138b]",
            },
            { 
              label: "Administradores", 
              value: users.filter(u => u.role === "admin").length, 
              color: "#ff4d94",
              bgGradient: "from-[#ff4d94] to-[#ff3377]",
              icon: Shield,
              iconBg: "bg-[#ff4d94]",
            },
            { 
              label: "Usuarios",        
              value: users.filter(u => u.role === "user").length,  
              color: "#ffbf2f",
              bgGradient: "from-[#ffbf2f] to-[#ffa500]",
              icon: User,
              iconBg: "bg-[#ffbf2f]",
            },
          ].map(s => (
            <div 
              key={s.label} 
              className={`bg-gradient-to-br ${s.bgGradient} rounded-[2px] shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div className="px-5 py-5 flex items-center justify-between relative overflow-hidden">
                {/* Círculo decorativo de fondo */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/5"></div>
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">{s.label}</p>
                  <p className="text-4xl font-extrabold text-white">{s.value}</p>
                </div>
                
                {/* Círculo del icono */}
                <div className={`relative z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300`}>
                  <s.icon size={26} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[2px] px-4 py-2.5 max-w-sm shadow-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o código…"
            className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-300 bg-transparent" autoComplete="off" />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-[2px] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin mr-2" />
              Cargando usuarios…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <User size={40} strokeWidth={1} className="mb-3" />
              <p className="text-sm text-gray-400">Sin usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Usuario", "Rol", "Código", "Padre", "Cargo", "Último acceso", "Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const padre = users.find(p => p.id === u.padre_id);
                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar user={u} size={8} />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                            ${u.role === "admin" ? "bg-[#31138b]/10 text-[#31138b]" : "bg-[#ff4d94]/10 text-[#ff4d94]"}`}>
                            {u.role === "admin" ? <Shield size={10} /> : <User size={10} />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3"><CodigoBadge codigo={u.codigo_acceso} /></td>
                        <td className="px-4 py-3">
                          {padre ? <span className="text-xs text-gray-600">{padre.name}</span> : <span className="text-xs text-gray-300">Raíz</span>}
                        </td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-500">{u.cargo || "—"}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock size={11} className="text-gray-400 shrink-0" />{formatLastLogin(u.last_login)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setOrgUser(u)} className="w-7 h-7 flex items-center justify-center rounded-[2px] text-gray-400 hover:text-[#31138b] hover:bg-purple-50 transition" title="Ver organigrama"><GitBranch size={13} /></button>
                            <button onClick={() => abrirPanel(u)} className="w-7 h-7 flex items-center justify-center rounded-[2px] text-gray-400 hover:text-[#31138b] hover:bg-purple-50 transition"><Pencil size={13} /></button>
                            <button onClick={() => eliminar(u.id)} className="w-7 h-7 flex items-center justify-center rounded-[2px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral */}
      {panel && (
        <div className="absolute top-0 right-0 h-full w-full max-w-[420px] bg-white border-l border-gray-100 shadow-xl flex flex-col z-10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg">{editing ? "Editar usuario" : "Nuevo usuario"}</h3>
            <button onClick={cerrarPanel} className="w-8 h-8 flex items-center justify-center rounded-[2px] hover:bg-gray-100 text-gray-400 transition"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-[2px] overflow-hidden bg-gray-100 flex items-center justify-center">
                  {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" /> : <img src="/perfil.png" alt="Perfil" className="w-full h-full object-cover" />}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#31138b] rounded-[2px] flex items-center justify-center cursor-pointer hover:bg-[#4c1d95] transition shadow-lg">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              </div>
              <p className="text-xs text-gray-400">Haz clic en la cámara para subir foto</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre completo *</label>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Juan Pérez"
                  className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="juan@correo.com"
                  className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{editing ? "Nueva contraseña (opcional)" : "Contraseña *"}</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition" autoComplete="new-password" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
                  <input type="text" value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="Ej: Analista"
                    className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="999 999 999"
                    className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition" autoComplete="off" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
                <select value={form.role} onChange={e => set("role", e.target.value)}
                  className="w-full border border-gray-200 rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] bg-white">
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario padre</label>
                <SearchableSelect value={form.padre_id} onChange={v => set("padre_id", v)} options={padreOptions} placeholder="Sin padre (raíz)" />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-[2px]">{error}</div>}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
            <button onClick={cerrarPanel} className="flex-1 py-2.5 rounded-[2px] border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-white transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-[2px] bg-[#31138b] text-white text-sm font-semibold hover:bg-[#4c1d95] disabled:opacity-50 transition shadow-sm">
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </div>
      )}

      {/* Mini Organigrama Modal */}
      {orgUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setOrgUser(null)} className="w-8 h-8 flex items-center justify-center rounded-[2px] hover:bg-gray-100 text-gray-400 transition"><ArrowLeft size={18} /></button>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Organigrama de {orgUser.name}</h3>
                  <p className="text-xs text-gray-400">{orgUser.email} · {orgUser.role}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <p className="text-sm text-gray-400 text-center py-10">Mini organigrama (versión simplificada)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}