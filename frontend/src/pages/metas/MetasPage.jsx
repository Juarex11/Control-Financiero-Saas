import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Target, Plus, X, Wallet, Calendar, Trash2, TrendingUp, CheckCircle2,
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
function diasRestantes(deadline) {
  if (!deadline) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const d = new Date(deadline + "T00:00:00");
  const dias = Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
  return dias;
}

// ── Modal: crear meta ──────────────────────────────────────────────────────────
function ModalCrearMeta({ onClose, onCreado }) {
  const [name, setName]     = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const submit = async () => {
    if (!name.trim() || !target || Number(target) <= 0) {
      setError("Completa el nombre y un monto objetivo válido.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name, target_amount: Number(target), deadline: deadline || null, note: note || null }),
      });
      if (!res.ok) throw new Error();
      onCreado();
      onClose();
    } catch {
      setError("No se pudo crear la meta.");
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-purple-900">Nueva meta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Viaje a Cusco"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Monto objetivo</label>
            <input type="number" min="0.01" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha límite (opcional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nota (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Detalle adicional"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? "Creando..." : "Crear meta"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Modal: abonar ────────────────────────────────────────────────────────────
function ModalAbonar({ goal, accounts, onClose, onAbonado }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount]       = useState("");
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const cuenta = accounts.find(a => a.id === Number(accountId));

  const submit = async () => {
    if (!accountId || !amount || Number(amount) <= 0) {
      setError("Selecciona una cuenta y un monto válido.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/goals/${goal.id}/abonar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ account_id: Number(accountId), amount: Number(amount), date, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "No se pudo registrar el abono."); return; }
      onAbonado();
      onClose();
    } catch {
      setError("No se pudo registrar el abono.");
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-purple-900">Abonar a "{goal.name}"</h3>
            <p className="text-xs text-gray-400">Faltan {formatMoney(goal.target_amount - goal.current_amount)}</p>
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
            <label className="text-xs font-bold text-gray-500 mb-1 block">Monto a abonar</label>
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
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Ahorro de la quincena"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition" />
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? "Registrando..." : "Confirmar abono"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Tarjeta de meta ───────────────────────────────────────────────────────────
function GoalCard({ goal, onAbonar, onDelete, deleting }) {
  const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  const completada = goal.status === "completada";
  const dias = diasRestantes(goal.deadline);

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-5 relative overflow-hidden">
      {completada && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
          <CheckCircle2 size={12} /> Completada
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${goal.color}18` }}>
          <Target size={22} style={{ color: goal.color }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{goal.name}</h3>
          {goal.deadline && (
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Calendar size={10} />
              {dias >= 0 ? `${dias} días restantes` : "Fecha vencida"}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xl font-extrabold text-gray-800">{formatMoney(goal.current_amount)}</span>
        <span className="text-xs text-gray-400 font-semibold">de {formatMoney(goal.target_amount)}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: goal.color }} />
      </div>

      <div className="flex gap-2">
        {!completada && (
          <button onClick={() => onAbonar(goal)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition">
            <TrendingUp size={14} /> Abonar
          </button>
        )}
        <button onClick={() => onDelete(goal.id)} disabled={deleting === goal.id}
          className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition shrink-0">
          {deleting === goal.id
            ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function MetasPage() {
  const [goals, setGoals]       = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCrear, setShowCrear]   = useState(false);
  const [abonarGoal, setAbonarGoal] = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rG, rA] = await Promise.all([
        fetch(`${API_URL}/goals`,    { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [dG, dA] = await Promise.all([rG.json(), rA.json()]);
      setGoals(Array.isArray(dG) ? dG : []);
      setAccounts(Array.isArray(dA) ? dA : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta meta? Los abonos se devolverán a sus cuentas de origen.")) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      cargar();
    } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#31138b" }}>Ahorro</p>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Tus Metas</h1>
        </div>
        <button onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition shadow-lg">
          <Plus size={16} /> Nueva meta
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

      {!loading && goals.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-12 text-center">
          <Target size={48} className="mx-auto text-purple-200 mb-3" />
          <p className="text-gray-500 font-semibold mb-1">Aún no tienes metas</p>
          <p className="text-sm text-gray-400">Crea tu primera meta de ahorro para empezar a trackear tu progreso.</p>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onAbonar={setAbonarGoal} onDelete={handleDelete} deleting={deleting} />
          ))}
        </div>
      )}

      {showCrear && <ModalCrearMeta onClose={() => setShowCrear(false)} onCreado={cargar} />}
      {abonarGoal && accounts.length > 0 && (
        <ModalAbonar goal={abonarGoal} accounts={accounts} onClose={() => setAbonarGoal(null)} onAbonado={cargar} />
      )}
    </div>
  );
}