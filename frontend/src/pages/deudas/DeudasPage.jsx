import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard, Plus, X, Calendar, Trash2, TrendingDown, CheckCircle2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
function getToken() { return localStorage.getItem("token"); }

function getCurrencySymbol(code) {
  const map = { PEN: "S/", USD: "$", EUR: "€", CRC: "₡", BOB: "Bs" };
  return map[code] ?? code;
}
function formatMoney(amount, currency = "PEN") {
  return `${getCurrencySymbol(currency)} ${Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}
function diasRestantes(dueDate) {
  if (!dueDate) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const d = new Date(dueDate + "T00:00:00");
  return Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
}

// ── Modal: crear deuda ─────────────────────────────────────────────────────────
function ModalCrearDeuda({ onClose, onCreado }) {
  const [name, setName]           = useState("");
  const [total, setTotal]         = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate]     = useState("");
  const [note, setNote]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const submit = async () => {
    if (!name.trim() || !total || Number(total) <= 0) {
      setError("Completa el nombre y un monto total válido.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name, total_amount: Number(total),
          start_date: startDate || null, due_date: dueDate || null,
          note: note || null,
        }),
      });
      if (!res.ok) throw new Error();
      onCreado();
      onClose();
    } catch {
      setError("No se pudo crear la deuda.");
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-purple-900">Nueva deuda</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Préstamo del carro"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Monto total de la deuda</label>
            <input type="number" min="0.01" step="0.01" value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha inicio (opcional)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha límite (opcional)</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nota (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Detalle adicional"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? "Creando..." : "Crear deuda"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Modal: pagar ────────────────────────────────────────────────────────────
function ModalPagar({ debt, accounts, onClose, onPagado }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount]       = useState("");
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const cuenta    = accounts.find(a => a.id === Number(accountId));
  const restante  = debt.total_amount - debt.paid_amount;

  const submit = async () => {
    if (!accountId || !amount || Number(amount) <= 0) {
      setError("Selecciona una cuenta y un monto válido.");
      return;
    }
    if (Number(amount) > restante) {
      setError(`El monto no puede superar lo que falta pagar (${formatMoney(restante)}).`);
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/debts/${debt.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ account_id: Number(accountId), amount: Number(amount), date, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "No se pudo registrar el pago."); return; }
      onPagado();
      onClose();
    } catch {
      setError("No se pudo registrar el pago.");
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-purple-900">Pagar "{debt.name}"</h3>
            <p className="text-xs text-gray-400">Falta {formatMoney(restante)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Cuenta de origen</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition">
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {formatMoney(a.balance, a.currency)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Monto a pagar</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
            {cuenta && Number(amount) > cuenta.balance && (
              <p className="text-xs text-red-500 font-semibold mt-1">Supera el saldo disponible de esa cuenta.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nota (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Cuota de julio"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? "Registrando..." : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Tarjeta de deuda ──────────────────────────────────────────────────────────
function DebtCard({ debt, onPagar, onDelete, deleting }) {
  const progress  = Math.min(100, (debt.paid_amount / debt.total_amount) * 100);
  const restante  = debt.total_amount - debt.paid_amount;
  const pagada    = debt.status === "pagada";
  const dias      = diasRestantes(debt.due_date);
  const vencida   = dias !== null && dias < 0 && !pagada;

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-5 relative overflow-hidden">
      {pagada && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
          <CheckCircle2 size={12} /> Pagada
        </div>
      )}
      {vencida && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
          Vencida
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${debt.color}18` }}>
          <CreditCard size={22} style={{ color: debt.color }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{debt.name}</h3>
          {debt.due_date && !pagada && (
            <p className={`text-[10px] flex items-center gap-1 ${vencida ? "text-red-500 font-bold" : "text-gray-400"}`}>
              <Calendar size={10} />
              {vencida ? `Vencida hace ${Math.abs(dias)} días` : `${dias} días restantes`}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xl font-extrabold text-gray-800">{formatMoney(restante)}</span>
        <span className="text-xs text-gray-400 font-semibold">restante de {formatMoney(debt.total_amount)}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: debt.color }} />
      </div>
      <p className="text-[10px] text-gray-400 font-semibold mb-4">
        {formatMoney(debt.paid_amount)} pagado ({progress.toFixed(0)}%)
      </p>

      <div className="flex gap-2">
        {!pagada && (
          <button onClick={() => onPagar(debt)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition">
            <TrendingDown size={14} /> Pagar
          </button>
        )}
        <button onClick={() => onDelete(debt.id)} disabled={deleting === debt.id}
          className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition shrink-0">
          {deleting === debt.id
            ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function DeudasPage() {
  const [debts, setDebts]       = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [pagarDebt, setPagarDebt] = useState(null);
  const [deleting, setDeleting]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rD, rA] = await Promise.all([
        fetch(`${API_URL}/debts`,    { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [dD, dA] = await Promise.all([rD.json(), rA.json()]);
      setDebts(Array.isArray(dD) ? dD : []);
      setAccounts(Array.isArray(dA) ? dA : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta deuda? Los pagos se devolverán a sus cuentas de origen.")) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/debts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      cargar();
    } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#31138b" }}>Control de pagos</p>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Tus Deudas</h1>
        </div>
        <button onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition shadow-lg">
          <Plus size={16} /> Nueva deuda
        </button>
      </div>

      <div className="flex rounded-xl overflow-hidden h-1.5 shadow-sm">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && debts.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-12 text-center">
          <CreditCard size={48} className="mx-auto text-purple-200 mb-3" />
          <p className="text-gray-500 font-semibold mb-1">Aún no tienes deudas registradas</p>
          <p className="text-sm text-gray-400">Registra una deuda para llevar el control de tus pagos.</p>
        </div>
      )}

      {!loading && debts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {debts.map(d => (
            <DebtCard key={d.id} debt={d} onPagar={setPagarDebt} onDelete={handleDelete} deleting={deleting} />
          ))}
        </div>
      )}

      {showCrear && <ModalCrearDeuda onClose={() => setShowCrear(false)} onCreado={cargar} />}
      {pagarDebt && accounts.length > 0 && (
        <ModalPagar debt={pagarDebt} accounts={accounts} onClose={() => setPagarDebt(null)} onPagado={cargar} />
      )}
    </div>
  );
}