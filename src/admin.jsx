import React, { useEffect, useState } from "react";
import "./styles/admin.css";

export default function Admin() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch("http://localhost:3000/admin/usuarios", { credentials: "include" });
        if (!res.ok) {
          alert("Error al cargar los datos de usuarios");
          return;
        }
        const data = await res.json();
        console.log("Usuarios recibidos:", data); // 🔹 Debug: qué llega desde el backend

        // Aseguramos que turnos y carrito sean arrays
        const usuariosConArrays = data.map(u => ({
          ...u,
          turnos: u.turnos || [],
          carrito: u.carrito || [],
        }));

        setUsuarios(usuariosConArrays);
      } catch (err) {
        console.error(err);
        alert("Error al cargar usuarios");
      }
    };

    cargarDatos();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Error al cerrar sesión");
    }
  };

  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>
      <button id="logoutBtn" onClick={handleLogout}>Cerrar Sesión</button>

      {usuarios.length === 0 ? (
        <p>No hay usuarios disponibles</p>
      ) : (
        usuarios.map((u) => (
          <div key={u.id} className="usuario-card">
            <h2>👤 Usuario: {u.nombre} ({u.email})</h2>

            <h3>📅 Turnos reservados</h3>
            {u.turnos.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Teléfono</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {u.turnos.map((t, i) => (
                    <tr key={i}>
                      <td>{t.telefono}</td>
                      <td>{t.fecha}</td>
                      <td>{t.hora}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="vacio">Sin turnos reservados</p>
            )}

            <h3>🛒 Carrito</h3>
            {u.carrito.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {u.carrito.map((c, i) => (
                    <tr key={i}>
                      <td>{c.producto}</td>
                      <td>{c.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="vacio">Carrito vacío</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
