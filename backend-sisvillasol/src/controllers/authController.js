const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // <--- ¡LA LLAVE MAESTRA!

const login = async (req, res) => {
  const { documento, password } = req.body;

  try {
    // 1. Buscar al usuario por su documento
    // OJO: Traemos también el ROL haciendo JOIN
    const response = await pool.query(
      `
            SELECT u.*, r.nombre as nombre_rol 
            FROM sisvillasol.usuarios u
            JOIN sisvillasol.roles r ON u.id_rol = r.id_rol
            WHERE u.documento = $1
        `,
      [documento]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const user = response.rows[0];

    // 2. Verificar si el usuario está ACTIVO (El Switch que creamos antes)
    if (!user.estado) {
      return res.status(403).json({
        mensaje:
          "⛔ Acceso denegado: Usuario Inactivo. Contacte al Administrador.",
      });
    }

    // 3. COMPARAR CONTRASEÑAS (La Magia) 🔐
    // Compara lo que escribió Rosa (texto plano) contra la encriptación en la BD
    const esCorrecta = await bcrypt.compare(password, user.password_hash);

    if (!esCorrecta) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta ❌" });
    }

    // 4. GENERAR EL TOKEN (Si todo salió bien) 🎟️
    const token = jwt.sign(
      { id: user.id_usuario, rol: user.nombre_rol },
      "secreto_super_seguro", // (En producción esto va en .env)
      { expiresIn: "1h" } // El token dura 1 hora
    );

    // 5. RESPONDER AL FRONTEND
    res.json({
      mensaje: `¡Bienvenido/a ${user.nombre}! 👋`,
      token: token,
      usuario: {
        id: user.id_usuario,
        id_rol: user.id_rol,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.nombre_rol, // "ADMIN"
        estado: user.estado,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
};

module.exports = { login };
