const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();
app.use(cors({
  origin: 'http://localhost:5500', // o el puerto donde corre tu frontend
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'claveSecreta123',
  resave: false,
  saveUninitialized: false
}));

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '45686876',
  database: 'ozbarber'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err);
  } else {
    console.log('Conectado a la base de datos');
  }
});

// Registro
app.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;
  const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
  db.query(sql, [nombre, email, password], (err, result) => {
    if (err) {
      console.error('Error en el registro:', err);
      res.status(500).send('Error al registrar');
    } else {
      res.send('Usuario registrado correctamente');
    }
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Error al iniciar sesión:', err);
      res.status(500).send('Error');
    } else if (results.length > 0) {
      req.session.userId = results[0].id;
      res.send('Inicio de sesión exitoso');
    } else {
      res.status(401).send('Credenciales incorrectas');
    }
  });
});

// Ruta protegida para guardar turnos
app.post('/turno', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send('No autorizado');
  }

  const { nombre, telefono, fecha, hora } = req.body;
  const sql = 'INSERT INTO turnos (user_id, nombre, telefono, fecha, hora) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [userId, nombre, telefono, fecha, hora], (err, result) => {
    if (err) {
      console.error('Error al guardar el turno:', err);
      res.status(500).send('Error al guardar el turno');
    } else {
      res.send('Turno reservado correctamente');
    }
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
