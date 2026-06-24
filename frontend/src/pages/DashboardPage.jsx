export default function DashboardPage({ user }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-400 mt-1">Bienvenido, {user?.name}</p>
    </div>
  );
}