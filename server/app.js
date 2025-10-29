// server/app.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import bcrypt from "bcrypt";

const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "12345",
  database: "ozbarber",
  port: 3306,
};

let db;

async function init() {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173", // tu frontend
      credentials: true,
    })
  );

  app.use(bodyParser.json());

  app.use(
    session({
      secret: "mi_clave_secreta",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  db = await mysql.createConnection(dbConfig);
  console.log("✅ Conectado a la base de datos");

  // Middleware de autenticación
  const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "No autorizado" });
    }
    next();
  };

  // Middleware para verificar si es admin
  const requireAdmin = (req, res, next) => {
    if (!req.session?.user || req.session.user.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };

  // ---------------- Registro ----------------
  app.post("/register", async (req, res) => {
    const { nombre, email, contrasena } = req.body;
    if (!nombre || !email || !contrasena)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

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
      console.error("❌ Error en registro:", err);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // ---------------- Login ----------------
  app.post("/login", async (req, res) => {
    const { email, contrasena } = req.body;

    try {
      const [rows] = await db.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
      if (rows.length === 0)
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      const user = rows[0];
      const match = await bcrypt.compare(contrasena, user.contrasena);

      if (!match)
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

      req.session.user = { id: user.id, nombre: user.nombre, rol: user.rol };

      console.log("🔐 Usuario logeado:", req.session.user);
      res.json({ mensaje: user.rol });
    } catch (err) {
      console.error("❌ Error al iniciar sesión:", err);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  // ---------------- Logout ----------------
  app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Error al cerrar sesión" });
      res.clearCookie("connect.sid");
      res.json({ mensaje: "Sesión cerrada" });
    });
  });

  // ---------------- Obtener usuarios para admin ----------------
  app.get("/admin/usuarios", requireLogin, requireAdmin, async (req, res) => {
  try {
    // Traer los usuarios básicos
    const [usuarios] = await db.execute("SELECT id, nombre, email FROM usuarios");
    console.log("Usuarios encontrados:", usuarios);

    // Para cada usuario, traer sus turnos y carrito
    const usuariosConDatos = await Promise.all(
      usuarios.map(async (u) => {
        try {
          const [turnos] = await db.execute(
            "SELECT telefono, fecha, hora FROM turnos WHERE id_usuario = ?",
            [u.id]
          );

          const [carrito] = await db.execute(
            `SELECT p.nombre AS producto, c.cantidad
             FROM carrito c
             JOIN productos p ON c.producto_id = p.id
             WHERE c.usuario_id = ?`,
            [u.id]
          );

          return { ...u, turnos, carrito };
        } catch (innerErr) {
          console.error(`Error cargando datos de usuario ${u.id}:`, innerErr);
          return { ...u, turnos: [], carrito: [] };
        }
      })
    );

    console.log("Usuarios con datos:", usuariosConDatos);

    res.json(usuariosConDatos);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ error: err.message });
  }
});


  // ---------------- Turnos ----------------
  app.post("/turno", requireLogin, async (req, res) => {
    const { nombre, telefono, fecha, hora } = req.body;

    try {
      await db.execute(
        "INSERT INTO turnos (nombre, telefono, fecha, hora, id_usuario) VALUES (?, ?, ?, ?, ?)",
        [nombre, telefono, fecha, hora, req.session.user.id]
      );
      res.json({ mensaje: "Turno reservado exitosamente" });
    } catch (err) {
      console.error("❌ Error al reservar turno:", err.message);
      res.status(500).json({ error: "Error al reservar turno" });
    }
  });

  // ---------------- Carrito ----------------
  app.post("/carrito/agregar", requireLogin, async (req, res) => {
    const { id_producto, cantidad } = req.body;
    try {
      const [existing] = await db.execute(
        "SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?",
        [req.session.user.id, id_producto]
      );

      if (existing.length > 0) {
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
      console.error("❌ Error al agregar producto:", err);
      res.status(500).json({ error: "Error al agregar al carrito" });
    }
  });

  app.get("/carrito", requireLogin, async (req, res) => {
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
      console.error("❌ Error al obtener carrito:", err);
      res.status(500).json({ error: "Error al obtener carrito" });
    }
  });

  app.post("/carrito/actualizar", requireLogin, async (req, res) => {
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
      console.error("❌ Error al actualizar carrito:", err);
      res.status(500).json({ error: "Error al actualizar carrito" });
    }
  });

  app.post("/carrito/eliminar", requireLogin, async (req, res) => {
    const { id_producto } = req.body;
    try {
      await db.execute(
        "DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?",
        [req.session.user.id, id_producto]
      );
      res.json({ mensaje: "Producto eliminado del carrito" });
    } catch (err) {
      console.error("❌ Error al eliminar producto:", err);
      res.status(500).json({ error: "Error al eliminar producto" });
    }
  });

  // ---------------- Iniciar servidor ----------------
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

init().catch((err) => {
  console.error("❌ Error iniciando el servidor:", err);
});
