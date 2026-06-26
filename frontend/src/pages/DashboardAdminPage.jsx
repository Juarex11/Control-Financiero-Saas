import { useOutletContext } from "react-router-dom";
import { Users, GitBranch, ShieldCheck, TrendingUp } from "lucide-react";

export default function DashboardAdminPage() {
  const { onUserUpdate } = useOutletContext() || {};

  // Por ahora tomamos el user del localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="p-6 space-y-6">

      {/* Bienvenida */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium">Panel de Administración</p>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-0.5">
            Bienvenido, {user.name?.split(" ")[0]} 👋
          </h1>
        </div>
        {/* Franja tricolor del logo */}
        <div className="hidden sm:flex gap-1 items-end h-8">
          <div className="w-2 rounded-t-sm" style={{ height: "60%", background: "#31138b" }} />
          <div className="w-2 rounded-t-sm" style={{ height: "80%", background: "#ff4d94" }} />
          <div className="w-2 rounded-t-sm" style={{ height: "100%", background: "#ffbf2f" }} />
        </div>
      </div>

      {/* Separador tricolor */}
      <div className="flex rounded-[3px] overflow-hidden h-1">
        <div className="flex-1" style={{ background: "#31138b" }} />
        <div className="flex-1" style={{ background: "#ff4d94" }} />
        <div className="flex-1" style={{ background: "#ffbf2f" }} />
      </div>

      {/* Cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total usuarios",   Icon: Users,      color: "#31138b", soon: true },
          { label: "Red activa",       Icon: GitBranch,  color: "#ff4d94", soon: true },
          { label: "Administradores",  Icon: ShieldCheck, color: "#ffbf2f", soon: true },
          { label: "Crecimiento",      Icon: TrendingUp, color: "#31138b", soon: true },
        ].map(({ label, Icon, color, soon }) => (
          <div
            key={label}
            className="bg-white rounded-[4px] border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div
              className="w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0"
              style={{ background: `${color}15` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              {soon ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-[3px] mt-1 inline-block"
                  style={{ background: `${color}15`, color }}>
                  Próximamente
                </span>
              ) : (
                <p className="text-2xl font-extrabold text-gray-800 mt-0.5">—</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Área de reportes futura */}
      <div className="bg-white rounded-[4px] border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="flex gap-1 items-end h-10">
          <div className="w-3 rounded-t-sm" style={{ height: "40%", background: "#31138b40" }} />
          <div className="w-3 rounded-t-sm" style={{ height: "65%", background: "#ff4d9440" }} />
          <div className="w-3 rounded-t-sm" style={{ height: "100%", background: "#ffbf2f40" }} />
          <div className="w-3 rounded-t-sm" style={{ height: "80%", background: "#31138b40" }} />
          <div className="w-3 rounded-t-sm" style={{ height: "55%", background: "#ff4d9440" }} />
        </div>
        <p className="text-sm font-bold text-gray-400">Los reportes de administración aparecerán aquí</p>
        <p className="text-xs text-gray-300">Estadísticas de usuarios, red, actividad y más</p>
      </div>

    </div>
  );
}