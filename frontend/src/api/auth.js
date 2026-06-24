const API_URL = import.meta.env.VITE_API_URL;

export async function login(identificador, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al iniciar sesión.");
  return data;
}

export async function logout(token) {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}