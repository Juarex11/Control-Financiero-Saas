import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Pencil, Trash2, X, Check, ChevronRight,
  Wallet, Building2, CreditCard, PiggyBank, TrendingUp,
  Smartphone, Briefcase, Globe, Home, Star,
  ArrowLeft, MoreVertical, Layers, Award, DollarSign,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("token");
}

// ── Íconos disponibles ────────────────────────────────────────────────────────

const ICONS = [
  { key: "wallet",      Icon: Wallet,      label: "Billetera"   },
  { key: "building",    Icon: Building2,   label: "Banco"       },
  { key: "credit-card", Icon: CreditCard,  label: "Tarjeta"     },
  { key: "piggy-bank",  Icon: PiggyBank,   label: "Ahorros"     },
  { key: "trending-up", Icon: TrendingUp,  label: "Inversión"   },
  { key: "smartphone",  Icon: Smartphone,  label: "Digital"     },
  { key: "briefcase",   Icon: Briefcase,   label: "Negocio"     },
  { key: "globe",       Icon: Globe,       label: "Extranjera"  },
  { key: "home",        Icon: Home,        label: "Hogar"       },
  { key: "star",        Icon: Star,        label: "Especial"    },
];

// ── Monedas ───────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "PEN", symbol: "S/",  label: "Sol peruano"       },
  { code: "USD", symbol: "$",   label: "Dólar americano"   },
  { code: "EUR", symbol: "€",   label: "Euro"              },
  { code: "GBP", symbol: "£",   label: "Libra esterlina"   },
  { code: "BRL", symbol: "R$",  label: "Real brasileño"    },
  { code: "CLP", symbol: "$",   label: "Peso chileno"      },
  { code: "COP", symbol: "$",   label: "Peso colombiano"   },
  { code: "MXN", symbol: "$",   label: "Peso mexicano"     },
  { code: "ARS", symbol: "$",   label: "Peso argentino"    },
  { code: "BOB", symbol: "Bs",  label: "Boliviano"         },
];

// ── Colores predefinidos ──────────────────────────────────────────────────────

const COLORS = [
  "#31138b", "#ff4d94", "#ffbf2f",
  "#10b981", "#3b82f6", "#f97316",
  "#8b5cf6", "#ef4444", "#06b6d4",
  "#64748b",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIcon(key, size = 20) {
  const found = ICONS.find(i => i.key === key);
  if (!found) return <Wallet size={size} />;
  const { Icon } = found;
  return <Icon size={size} />;
}

function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

function formatBalance(balance, currency) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${Number(balance).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

// ── Card de cuenta (con borde izquierdo) ─────────────────────────────────────

function AccountCard({ account, onClick, onEdit, onDelete }) {
  return (
    <div
      onClick={onClick}
      className="rounded-[4px] border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      style={{ background: `linear-gradient(135deg, ${account.color} 0%, ${account.color}dd 100%)` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          {/* Ícono + nombre */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[4px] bg-white/20 flex items-center justify-center text-white shrink-0">
              {getIcon(account.icon, 20)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">{account.name}</p>
                {account.is_primary && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-white/30 text-white">
                    Principal
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 mt-0.5">{account.currency}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onEdit(account); }}
              className="w-7 h-7 flex items-center justify-center rounded-[2px] text-white/60 hover:bg-white/20 hover:text-white transition"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(account); }}
              className="w-7 h-7 flex items-center justify-center rounded-[2px] text-white/60 hover:bg-red-500/30 hover:text-white transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-1">Saldo</p>
          <p className="text-2xl font-extrabold text-white">
            {formatBalance(account.balance, account.currency)}
          </p>
        </div>

        {/* Nota */}
        {account.note && (
          <p className="text-xs text-white/60 mt-2 truncate">{account.note}</p>
        )}
      </div>

      {/* Ver detalle */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-black/10 border-t border-white/10">
        <span className="text-xs font-semibold text-white/80">Ver detalle</span>
        <ChevronRight size={13} className="text-white/60" />
      </div>
    </div>
  );
}

// ── Panel crear / editar ──────────────────────────────────────────────────────

function AccountPanel({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:     editing?.name     ?? "",
    icon:     editing?.icon     ?? "wallet",
    color:    editing?.color    ?? "#31138b",
    currency: editing?.currency ?? "PEN",
    balance:  editing?.balance  ?? "",
    note:     editing?.note     ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setError("El nombre es requerido."); return; }

    setSaving(true);
    try {
      const url = editing
        ? `${API_URL}/accounts/${editing.id}/update`
        : `${API_URL}/accounts`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name:     form.name,
          icon:     form.icon,
          color:    form.color,
          currency: form.currency,
          balance:  form.balance === "" ? 0 : parseFloat(form.balance),
          note:     form.note || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al guardar."); return; }

      onSaved();
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-[420px] bg-white border-l border-gray-100 shadow-xl flex flex-col z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-lg">
          {editing ? "Editar cuenta" : "Nueva cuenta"}
        </h3>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-[2px] hover:bg-gray-100 text-gray-400 transition">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Preview */}
        <div
          className="rounded-[4px] p-4 flex items-center gap-3"
          style={{ background: `${form.color}15`, border: `1.5px solid ${form.color}40` }}
        >
          <div
            className="w-12 h-12 rounded-[4px] flex items-center justify-center text-white shrink-0"
            style={{ background: form.color }}
          >
            {getIcon(form.icon, 22)}
          </div>
          <div>
            <p className="font-bold text-gray-800">{form.name || "Nombre de cuenta"}</p>
            <p className="text-xs mt-0.5" style={{ color: form.color }}>
              {getCurrencySymbol(form.currency)} {form.balance || "0.00"} · {form.currency}
            </p>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="Ej: Cuenta BCP, Efectivo..."
            className="w-full border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition"
          />
        </div>

        {/* Ícono */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ícono</label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => set("icon", key)}
                title={label}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-[4px] border-2 transition
                  ${form.icon === key
                    ? "border-[#31138b] bg-[#31138b]/5"
                    : "border-gray-200 hover:border-gray-300"}`}
              >
                <Icon size={18} className={form.icon === key ? "text-[#31138b]" : "text-gray-400"} />
                <span className={`text-[9px] font-semibold ${form.icon === key ? "text-[#31138b]" : "text-gray-400"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => set("color", c)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ background: c }}
              >
                {form.color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Moneda</label>
          <select
            value={form.currency}
            onChange={e => set("currency", e.target.value)}
            className="w-full border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] bg-white"
          >
            {CURRENCIES.map(({ code, symbol, label }) => (
              <option key={code} value={code}>
                {symbol} — {label} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* Saldo inicial */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            {editing ? "Saldo actual" : "Saldo inicial"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
              {getCurrencySymbol(form.currency)}
            </span>
            <input
              type="number"
              value={form.balance}
              onChange={e => set("balance", e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border border-gray-200 rounded-[4px] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition"
            />
          </div>
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nota (opcional)</label>
          <textarea
            value={form.note}
            onChange={e => set("note", e.target.value)}
            placeholder="Ej: Cuenta para ahorros de emergencia..."
            rows={2}
            className="w-full border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm outline-none focus:border-[#ff4d94] transition resize-none"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-[4px]">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-[4px] border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-[4px] text-white text-sm font-bold disabled:opacity-50 transition"
          style={{ background: "linear-gradient(135deg, #31138b 0%, #ff4d94 100%)" }}
        >
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}

// ── Detalle de cuenta ─────────────────────────────────────────────────────────

function AccountDetail({ account, onBack, onEdit }) {
  return (
    <div className="space-y-5">
      {/* Header detalle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-[2px] hover:bg-gray-100 text-gray-400 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{account.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{account.currency}</p>
        </div>
        <button
          onClick={() => onEdit(account)}
          className="ml-auto flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-[4px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <Pencil size={14} /> Editar
        </button>
      </div>

      {/* Card saldo */}
      <div
        className="rounded-[4px] p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${account.color} 0%, ${account.color}cc 100%)` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[4px] bg-white/20 flex items-center justify-center">
            {getIcon(account.icon, 22)}
          </div>
          <div>
            <p className="font-bold text-white/80 text-sm">{account.name}</p>
            {account.is_primary && (
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-[3px]">
                Cuenta principal
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-1">Saldo actual</p>
        <p className="text-4xl font-extrabold">
          {formatBalance(account.balance, account.currency)}
        </p>
        {account.note && (
          <p className="text-xs text-white/60 mt-3">{account.note}</p>
        )}
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Ingresos del mes",  color: "#10b981" },
          { label: "Gastos del mes",    color: "#ef4444" },
        ].map(({ label, color }) => (
          <div key={label} className="bg-white rounded-[4px] border border-gray-100 shadow-sm px-5 py-4"
            style={{ borderLeft: `3px solid ${color}` }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-[3px] mt-2 inline-block"
              style={{ background: `${color}15`, color }}>
              Próximamente
            </span>
          </div>
        ))}
      </div>

      {/* Últimas transacciones placeholder */}
      <div className="bg-white rounded-[4px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Últimas transacciones</h3>
          <span className="text-xs text-gray-400">Próximamente</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <div className="flex gap-1 items-end h-8">
            <div className="w-2.5 rounded-t-sm" style={{ height: "40%", background: "#31138b40" }} />
            <div className="w-2.5 rounded-t-sm" style={{ height: "70%", background: "#ff4d9440" }} />
            <div className="w-2.5 rounded-t-sm" style={{ height: "100%", background: "#ffbf2f40" }} />
            <div className="w-2.5 rounded-t-sm" style={{ height: "55%", background: "#31138b40" }} />
            <div className="w-2.5 rounded-t-sm" style={{ height: "80%", background: "#ff4d9440" }} />
          </div>
          <p className="text-sm font-bold text-gray-400">Aún no hay transacciones</p>
          <p className="text-xs text-gray-300">Aquí verás tus ingresos y gastos</p>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CuentasPage() {
  const [accounts,    setAccounts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [panel,       setPanel]       = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [detalle,     setDetalle]     = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = useCallback(async (account) => {
    if (!confirm(`¿Eliminar la cuenta "${account.name}"?`)) return;
    try {
      await fetch(`${API_URL}/accounts/${account.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (detalle?.id === account.id) setDetalle(null);
      cargar();
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }, [cargar, detalle]);

  const abrirPanel = useCallback((account = null) => {
    setEditing(account);
    setPanel(true);
  }, []);

  const cerrarPanel = useCallback(() => {
    setPanel(false);
    setEditing(null);
  }, []);

  const handleSaved = useCallback(async () => {
    await cargar();
    cerrarPanel();
  }, [cargar, cerrarPanel]);

  const totalSaldo = useMemo(() =>
    accounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [accounts]
  );

  const cuentaPrincipal = accounts.find(a => a.is_primary);

  return (
    <div className="relative flex h-full">
      <div className={`flex-1 p-6 space-y-5 transition-all duration-300 overflow-y-auto ${panel ? "mr-[420px]" : ""}`}>

        {/* Vista detalle */}
        {detalle ? (
          <AccountDetail
            account={detalle}
            onBack={() => setDetalle(null)}
            onEdit={(a) => { abrirPanel(a); }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis cuentas</h1>
                <p className="text-sm text-gray-400 mt-0.5">Gestiona tus cuentas financieras</p>
              </div>
              <button
                onClick={() => abrirPanel(null)}
                className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-[4px] hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg, #31138b 0%, #ff4d94 100%)" }}
              >
                <Plus size={16} /> Nueva cuenta
              </button>
            </div>

            {/* Separador tricolor */}
            <div className="flex rounded-[3px] overflow-hidden h-1">
              <div className="flex-1" style={{ background: "#31138b" }} />
              <div className="flex-1" style={{ background: "#ff4d94" }} />
              <div className="flex-1" style={{ background: "#ffbf2f" }} />
            </div>

            {/* Stats — Mismo diseño que en la imagen */}
           {/* Stats — Mismo diseño que en la imagen */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* Total cuentas */}
  <div className="rounded-[4px] border border-gray-100 shadow-sm px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, #31138b 0%, #4c1d95 100%)" }}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Layers size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Total cuentas</p>
        <p className="text-2xl font-extrabold">{accounts.length}</p>
      </div>
    </div>
  </div>

  {/* Cuenta principal */}
  <div className="rounded-[4px] border border-gray-100 shadow-sm px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, #ff4d94 0%, #d63384 100%)" }}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Award size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Cuenta principal</p>
        <p className="text-2xl font-extrabold truncate">{cuentaPrincipal?.name || "..."}</p>
      </div>
    </div>
  </div>

  {/* Saldo total */}
  <div className="rounded-[4px] border border-gray-100 shadow-sm px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, #ffbf2f 0%, #f59e0b 100%)" }}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <DollarSign size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Saldo total</p>
        <p className="text-2xl font-extrabold">
          S/ {totalSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  </div>
</div>

            {/* Cards cuentas */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin mr-2" />
                Cargando cuentas…
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-full bg-[#31138b]/10 flex items-center justify-center">
                  <Wallet size={24} className="text-[#31138b]" />
                </div>
                <p className="text-sm font-bold text-gray-500">No tienes cuentas aún</p>
                <p className="text-xs text-gray-400">Crea tu primera cuenta para empezar</p>
                <button
                  onClick={() => abrirPanel(null)}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-[4px]"
                  style={{ background: "linear-gradient(135deg, #31138b 0%, #ff4d94 100%)" }}
                >
                  <Plus size={15} /> Nueva cuenta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onClick={() => setDetalle(account)}
                    onEdit={abrirPanel}
                    onDelete={eliminar}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel lateral */}
      {panel && (
        <AccountPanel
          editing={editing}
          onClose={cerrarPanel}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}