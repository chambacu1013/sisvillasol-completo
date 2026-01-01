// src/config/db.js
const { Pool } = require("pg");
require("dotenv").config(); // Para leer el archivo .env

// Creamos un "Pool" de conexiones.
// Imagina que son 10 líneas telefónicas abiertas listas para llamar a la base de datos.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Evento para saber si nos conectamos bien
pool.on("connect", () => {
  console.log("🔌 Conexión exitosa a PostgreSQL (Base de Datos SISVILLASOL)");
});

module.exports = pool;
