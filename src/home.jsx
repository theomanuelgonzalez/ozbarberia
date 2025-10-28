// src/Home.jsx
import React, { useState } from "react";
import translations from "./translations";
import Cookies from "js-cookie";
import "./styles/home.css";

export default function Home() {
  const [formData, setFormData] = useState({ nombre: "", telefono: "", fecha: "", hora: "" });
  const [lang, setLang] = useState("es");

  // ---- LOGOUT ----
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
      if (res.ok) window.location.href = "/";
      else alert("No se pudo cerrar sesión");
    } catch (err) {
      console.error(err);
      alert("Error al cerrar sesión");
    }
  };

  // ---- FORM TURNOS ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/turno", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.mensaje);
        setFormData({ nombre: "", telefono: "", fecha: "", hora: "" });
      } else if (res.status === 401) {
        alert(lang === "es" ? "Iniciá sesión para reservar un turno" : "Log in to book an appointment");
        window.location.href = "/";
      } else alert(result.error || (lang === "es" ? "Error al reservar turno" : "Error reserving appointment"));
    } catch (err) {
      console.error(err);
      alert(lang === "es" ? "Error al reservar turno" : "Error reserving appointment");
    }
  };

  // ---- CARRITO ----
  const handleAgregarCarrito = async (id_producto) => {
    try {
      const res = await fetch("http://localhost:3000/carrito/agregar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_producto, cantidad: 1 }),
      });
      const data = await res.json();
      if (res.ok) alert(data.mensaje || (lang === "es" ? "Producto agregado al carrito" : "Product added to cart"));
      else if (res.status === 401) {
        alert(lang === "es" ? "Iniciá sesión para agregar productos al carrito" : "Log in to add products to cart");
        window.location.href = "/";
      } else alert(data.error || (lang === "es" ? "No se pudo agregar al carrito" : "Could not add product"));
    } catch (err) {
      console.error(err);
      alert(lang === "es" ? "Error al agregar al carrito" : "Error adding product");
    }
  };

  // ---- PRODUCTOS ----
  const productos = [
    { id: 1, img: "img/productos/cera.jpg" },
    { id: 2, img: "img/productos/gel.jpg" },
    { id: 3, img: "img/productos/rociador.jpg" },
    { id: 4, img: "img/productos/wahl.jpg" },
    { id: 5, img: "img/productos/navaja.jpg" },
  ];

  return (
    <div className="home-container">
      <header>
        {/* NAVBAR FIJA */}
        <nav className="navbar-fixed">
          <div className="nav-left">
            <a href="#turnos" className="nav-btn">{translations[lang].turnosTitle}</a>
            <a href="#productos" className="nav-btn">{translations[lang].productosTitle}</a>
            <a href="/carrito" className="nav-btn">{translations[lang].carritoTitle}</a>
          </div>

          <div className="nav-right">
            <button onClick={handleLogout} className="nav-btn">
              {translations[lang].logoutButton}
            </button>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="nav-btn nav-select"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </nav>

        {/* HERO IMAGE */}
        <div className="hero-image">
          <div className="overlay">
            <h1>{translations[lang].homeTitle}</h1>
          </div>
        </div>
      </header>

      <main className="content">
        {/* FORM TURNOS */}
        <section id="turnos" className="turnos">
          <h2>{translations[lang].turnosTitle}</h2>
          <form id="form-turno" onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder={translations[lang].nombrePlaceholder}
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <input
              type="tel"
              name="telefono"
              placeholder={translations[lang].telefonoPlaceholder}
              required
              maxLength={10}
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
            <input
              type="date"
              name="fecha"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
            <input
              type="time"
              name="hora"
              required
              min="06:00"
              max="22:00"
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            />
            <button type="submit" className="nav-btn">
              {translations[lang].reservarButton}
            </button>
          </form>
        </section>

        {/* PRODUCTOS */}
        <section id="productos" className="productos">
          <h2>{translations[lang].productosTitle}</h2>
          <div className="grid">
            {productos.map((p, index) => (
              <div key={p.id} className="producto">
                <img src={p.img} alt={translations[lang].productos[index].nombre} />
                <h3>{translations[lang].productos[index].nombre}</h3>
                <p>{translations[lang].productos[index].desc}</p>
                <button className="nav-btn" onClick={() => handleAgregarCarrito(p.id)}>
                  {translations[lang].comprarButton}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 OZ BARBER - Todos los derechos reservados.</p>
        <button onClick={() => (window.location.href = "/ayuda")} className="btn-ayuda">
          Ayuda
        </button>
      </footer>
    </div>
  );
}
