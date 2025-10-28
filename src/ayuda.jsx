import React, { useState } from "react";
import "./styles/ayuda.css";

export default function Ayuda() {
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    { pregunta: "¿Cómo puedo reservar un turno?", respuesta: "Tenés que iniciar sesión, ir a la sección de turnos, completar el formulario con tus datos y confirmar." },
    { pregunta: "¿Necesito cuenta para comprar productos?", respuesta: "Sí, debés registrarte o iniciar sesión antes de agregar productos al carrito." },
    { pregunta: "¿Qué hago si olvidé mi contraseña?", respuesta: "Actualmente debés contactar al administrador para recuperar tu cuenta." },
    { pregunta: "¿Dónde están ubicados?", respuesta: "Este es un servicio a domicilio o tambien estan invitados a venir estamos ubicados en san martin dorrego 3481." },
  ];

  return (
    <div className="ayuda-container">
      <h1>Preguntas Frecuentes (FAQ)</h1>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className="faq-item">
            <h3 onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
              {faq.pregunta}
            </h3>
            {faqOpen === i && <p>{faq.respuesta}</p>}
          </div>
        ))}
      </div>
      <button onClick={() => (window.location.href = "/home")} className="btn-volver">
        Volver al Home
      </button>
    </div>
  );
}
