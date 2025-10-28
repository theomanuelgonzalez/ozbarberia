import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";
import Register from "./register";
import Home from "./home";
import Carrito from "./carrito";
import Admin from "./admin";
import Ayuda from "./ayuda";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/carrito" element={<Carrito />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/ayuda" element={<Ayuda />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
