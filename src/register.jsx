import { useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "./translations";
import "./styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [lang, setLang] = useState("es");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nombre || !email || !contrasena) {
      alert("Todos los campos son obligatorios");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, contrasena }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Registro exitoso ✅");
        navigate("/");
      } else alert(data.error || "Error al registrar usuario");
    } catch (err) {
      console.error("Error en registro:", err);
      alert("Error al registrar usuario");
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>
        {/* Selector idioma */}
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ marginBottom: "15px" }}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <h2>{translations[lang].registerTitle}</h2>
        <input
          type="text"
          placeholder={translations[lang].nombrePlaceholder}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={translations[lang].emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={translations[lang].passwordPlaceholder}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />
        <button type="submit">{translations[lang].registerButton}</button>
        <p className="register-link">
          <span onClick={() => navigate("/")}>{translations[lang].registerLinkLogin}</span>
        </p>
      </form>
    </div>
  );
}
