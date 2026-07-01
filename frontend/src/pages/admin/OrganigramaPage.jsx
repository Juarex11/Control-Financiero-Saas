import { useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Users, Shield, User, Mail, Hash, Briefcase, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function buildNodesAndEdges(users, parentId = null, level = 0, xOffset = { val: 0 }) {
  const nodes = [];
  const edges = [];

  users.forEach((user) => {
    const x = xOffset.val * 280;
    const y = level * 200;
    xOffset.val++;

    const isAdmin = user.role === "admin";

    nodes.push({
      id: String(user.id),
      position: { x, y },
      data: {
        label: (
          <div className="flex flex-col items-center gap-2 p-3">
            <div
              className={`w-12 h-12 rounded-[2px] flex items-center justify-center text-white text-lg font-bold shadow-md
                ${isAdmin ? "bg-[#31138b]" : "bg-[#ff4d94]"}`}
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <p className="text-sm font-bold text-gray-800 text-center leading-tight">
              {user.name}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Mail size={10} />
              <span className="truncate max-w-[140px]">{user.email}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold
                ${isAdmin ? "bg-[#31138b] text-white" : "bg-[#ff4d94]/10 text-[#ff4d94]"}`}
            >
              {isAdmin ? <Shield size={10} /> : <User size={10} />}
              {user.role}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-gray-50 border border-gray-200 text-gray-500 font-mono text-[10px] font-bold">
              <Hash size={9} />
              {user.codigo_acceso}
            </span>
            {user.cargo && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                <Briefcase size={9} />
                {user.cargo}
              </span>
            )}
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: isAdmin ? "2px solid #31138b" : "2px solid #e5e7eb",
        borderRadius: "2px",
        padding: "4px",
        width: 200,
        boxShadow: isAdmin
          ? "0 4px 16px rgba(49,19,139,0.12)"
          : "0 2px 8px rgba(0,0,0,0.06)",
      },
    });

    if (parentId) {
      edges.push({
        id: `e${parentId}-${user.id}`,
        source: String(parentId),
        target: String(user.id),
        type: "smoothstep",
        style: {
          stroke: isAdmin ? "#31138b" : "#d1d5db",
          strokeWidth: isAdmin ? 2 : 1.5,
        },
      });
    }

    const hijos = user.hijos ?? user.descendientes ?? [];
    if (hijos.length > 0) {
      const { nodes: n, edges: e } = buildNodesAndEdges(hijos, user.id, level + 1, xOffset);
      nodes.push(...n);
      edges.push(...e);
    }
  });

  return { nodes, edges };
}

// ─── Aplana el árbol recursivamente ──────────────────────────────────────────
function flattenTree(users) {
  let result = [];
  users.forEach((user) => {
    result.push(user);
    const children = user.hijos || user.descendientes || [];
    if (children.length) {
      result = result.concat(flattenTree(children));
    }
  });
  return result;
}

export default function OrganigramaPage() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ total: 0, admins: 0, users: 0 });

  useEffect(() => {
    fetch(`${API_URL}/users/arbol`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject("Error al cargar")))
      .then((data) => {
        const usersList = Array.isArray(data) ? data : [];
        
        // Aplanar todo el árbol para contar todos los nodos
        const allUsers = flattenTree(usersList);
        const admins = allUsers.filter((u) => u.role === "admin").length;
        
        setStats({
          total: allUsers.length,
          admins,
          users: allUsers.length - admins,
        });
        
        const { nodes: n, edges: e } = buildNodesAndEdges(usersList);
        setNodes(n);
        setEdges(e);
      })
      .catch(() => setError("No se pudo cargar el organigrama."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-[#31138b] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400">Cargando organigrama…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[#31138b] font-semibold hover:underline"
        >
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organigrama</h1>
          <p className="text-sm text-gray-400 mt-0.5">Árbol jerárquico de usuarios</p>
        </div>
        <button
          onClick={() => navigate("/usuarios")}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-[2px] hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} /> Volver a usuarios
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total miembros", value: stats.total, color: "border-l-[#31138b]", Icon: Users },
          { label: "Administradores", value: stats.admins, color: "border-l-[#ff4d94]", Icon: Shield },
          { label: "Usuarios", value: stats.users, color: "border-l-[#ffbf2f]", Icon: User },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-[2px] border border-gray-100 px-4 py-3 shadow-sm border-l-[3px] ${s.color}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <s.Icon size={16} className="text-gray-300" />
            </div>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Árbol */}
      <div
        className="flex-1 bg-white rounded-[2px] border border-gray-100 shadow-sm overflow-hidden"
        style={{ minHeight: "500px" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#f3f4f6" gap={24} size={1.5} />
          <Controls
            className="!rounded-[2px] !border !border-gray-200 !shadow-sm !bg-white"
            position="bottom-right"
          />
          <MiniMap
            nodeColor={(n) => {
              const border = n.style?.border || "";
              return border.includes("31138b") ? "#31138b" : "#ff4d94";
            }}
            maskColor="rgba(0,0,0,0.03)"
            className="!rounded-[2px] !border !border-gray-200"
            style={{ width: 140, height: 90 }}
          />
        </ReactFlow>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 text-xs text-gray-400 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-[#31138b]"></div>
          Administrador
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-[#ff4d94]"></div>
          Usuario
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] border-2 border-[#31138b] bg-white"></div>
          Conexión admin
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] border-2 border-gray-300 bg-white"></div>
          Conexión usuario
        </div>
      </div>
    </div>
  );
}