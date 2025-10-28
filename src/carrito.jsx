import React, { useEffect, useState } from "react";
import "./styles/carrito.css";

export default function Carrito() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    try {
      const res = await fetch("http://localhost:3000/carrito", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar el carrito");
      const data = await res.json();
      setItems(data);
      calcularTotal(data);
    } catch (err) {
      console.error(err);
      alert("Error al cargar el carrito");
    }
  };

  const calcularTotal = (carrito) => {
    const suma = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    setTotal(suma);
  };

  const actualizarCantidad = async (id_producto, nuevaCantidad) => {
    if (nuevaCantidad < 0) return;
    try {
      const res = await fetch("http://localhost:3000/carrito/actualizar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_producto, cantidad: nuevaCantidad }),
      });
      if (!res.ok) throw new Error("Error al actualizar carrito");

      const updatedItems = items.map(item =>
        item.id === id_producto ? { ...item, cantidad: nuevaCantidad } : item
      ).filter(item => item.cantidad > 0);

      setItems(updatedItems);
      calcularTotal(updatedItems);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar carrito");
    }
  };

  const eliminarProducto = async (id_producto) => {
    try {
      const res = await fetch("http://localhost:3000/carrito/eliminar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_producto }),
      });
      if (!res.ok) throw new Error("Error al eliminar producto");

      const updatedItems = items.filter(item => item.id !== id_producto);
      setItems(updatedItems);
      calcularTotal(updatedItems);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar producto");
    }
  };

  return (
    <div>
      <header>
        <h1>OZ BARBER</h1>
      </header>
      <nav>
        <a href="/home">Home</a>
        <a href="/carrito">Carrito</a>
      </nav>

      <div className="container">
        <h1>Carrito de compras</h1>
        {items.length === 0 ? (
          <p>Tu carrito está vacío.</p>
        ) : (
          <ul id="lista-carrito">
            {items.map((item) => (
              <li key={item.id}>
                <span className="nombre-producto">{item.nombre}</span>
                <div className="cantidad-controls">
                  <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}>-</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}>+</button>
                  <button onClick={() => eliminarProducto(item.id)} className="eliminar-btn">
                    Eliminar
                  </button>
                </div>
                <span className="precio">${item.precio * item.cantidad}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="total-container">
          <h2>Total: ${total}</h2>
        </div>
      </div>

      <footer>
        <p>&copy; 2025 OZ BARBER - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
