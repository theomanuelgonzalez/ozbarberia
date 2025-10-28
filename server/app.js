// server/app.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import bcrypt from "bcrypt";

const PORT = 3000;
const SALT_ROUNDS = 10; // Nivel de seguridad básico

async function init() {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(bodyParser.json());
  app.use(
    session({
      secret: "mi_clave_secreta",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "ozbarber",
    port: 3306,
  });

  console.log("✅ Conectado a la base de datos");

  // -------------------- Registro -------------------- //
  app.post("/register", async (req, res) => {
    const { nombre, email, contrasena } = req.body;
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
      const [existing] = await db.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
      if (existing.length > 0)
        return res.status(400).json({ error: "El email ya existe" });

      const hashedPassword = await bcrypt.hash(contrasena, SALT_ROUNDS);

      await db.execute(
        "INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, 'user')",
        [nombre, email, hashedPassword]
      );

      res.json({ mensaje: "Usuario registrado exitosamente" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // -------------------- Login -------------------- //
  app.post("/login", async (req, res) => {
    const { email, contrasena } = req.body;
    try {
      const [rows] = await db.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      const match = await bcrypt.compare(contrasena, rows[0].contrasena);
      if (!match) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      req.session.user = { id: rows[0].id, nombre: rows[0].nombre, rol: rows[0].rol };
      res.json({ mensaje: rows[0].rol });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  // -------------------- Logout -------------------- //
  app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Error al cerrar sesión" });
      res.json({ mensaje: "Sesión cerrada" });
    });
  });

  // -------------------- Turnos -------------------- //
  app.post("/turno", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
    const { nombre, telefono, fecha, hora } = req.body;
    try {
      await db.execute(
        "INSERT INTO turnos (nombre, telefono, fecha, hora, id_usuario) VALUES (?, ?, ?, ?, ?)",
        [nombre, telefono, fecha, hora, req.session.user.id]
      );
      res.json({ mensaje: "Turno reservado exitosamente" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al reservar turno" });
    }
  });

  // -------------------- Carrito -------------------- //
  // Agregar producto
  app.post("/carrito/agregar", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
    const { id_producto, cantidad } = req.body;
    try {
      const [existing] = await db.execute(
        "SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?",
        [req.session.user.id, id_producto]
      );

      if (existing.length > 0) {
        // Si ya existe, actualizar cantidad
        await db.execute(
          "UPDATE carrito SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?",
          [cantidad, req.session.user.id, id_producto]
        );
      } else {
        await db.execute(
          "INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)",
          [req.session.user.id, id_producto, cantidad]
        );
      }
      res.json({ mensaje: "Producto agregado al carrito" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al agregar al carrito" });
    }
  });

  // Obtener carrito
  app.get("/carrito", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
    try {
      const [items] = await db.execute(
        `SELECT c.producto_id AS id, p.nombre, c.cantidad, p.precio
         FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.usuario_id = ?`,
        [req.session.user.id]
      );
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener carrito" });
    }
  });

  // Actualizar cantidad
  app.post("/carrito/actualizar", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
    const { id_producto, cantidad } = req.body;
    try {
      if (cantidad <= 0) {
        await db.execute(
          "DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?",
          [req.session.user.id, id_producto]
        );
      } else {
        await db.execute(
          "UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?",
          [cantidad, req.session.user.id, id_producto]
        );
      }
      res.json({ mensaje: "Carrito actualizado" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar carrito" });
    }
  });

  // Eliminar producto
  app.post("/carrito/eliminar", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
    const { id_producto } = req.body;
    try {
      await db.execute(
        "DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?",
        [req.session.user.id, id_producto]
      );
      res.json({ mensaje: "Producto eliminado del carrito" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al eliminar producto" });
    }
  });

  // -------------------- Iniciar servidor -------------------- //
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

init().catch((err) => {
  console.error("❌ Error iniciando el servidor:", err);
});
