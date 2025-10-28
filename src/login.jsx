import { useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "./translations";
import "./styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [lang, setLang] = useState("es"); // idioma por defecto
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.mensaje === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        alert(result.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al iniciar sesión");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        {/* Selector de idioma */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{ marginBottom: "15px" }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <h2>{translations[lang].loginTitle}</h2>

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
        <button type="submit">{translations[lang].loginButton}</button>
        <p className="login-link">
          <span onClick={() => navigate("/register")}>
            {translations[lang].registerLink}
          </span>
        </p>
      </form>
    </div>
  );
}
