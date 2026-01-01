const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// 1. OBTENER USUARIOS (CON JOIN A ROLES)
const obtenerUsuarios = async (req, res) => {
  try {
    // Seleccionamos nombre y apellido y los unimos para mostrar "Nombre Completo"
    // Traemos r.nombre para saber si es ADMIN o AGRICULTOR
    const response = await pool.query(`
            SELECT 
                u.id_usuario, 
                u.nombre, 
                u.apellido, 
                u.documento, 
                u.telefono, 
                u.estado, 
                r.nombre as nombre_rol,
                r.id_rol
            FROM sisvillasol.usuarios u
            JOIN sisvillasol.roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_rol ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando usuarios");
  }
};

// 2. CREAR USUARIO (Mapeando campos de la BD)
const crearUsuario = async (req, res) => {
  // Recibimos "nombreCompleto" del frontend y lo separamos
  const { nombre, apellido, documento, telefono, id_rol, password, estado } =
    req.body;

  // Truco: Separar Nombre y Apellido
  //const partesNombre = nombreCompleto.split(" ");
  //const nombre = partesNombre[0];
  //const apellido = partesNombre.slice(1).join(" ") || "Pendiente"; // Si no pone apellido, ponemos algo por defecto

  try {
    // A. Validar que la contraseña venga
    if (!password) {
      return res.status(400).json({ mensaje: "La contraseña es obligatoria" });
    }
    // B. Verificar si ya existe el documento
    const usuarioExistente = await pool.query(
      "SELECT * FROM sisvillasol.usuarios WHERE documento = $1",
      [documento]
    );
    if (usuarioExistente.rows.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "El documento ya está registrado" });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // OJO: Usamos las columnas exactas de tu imagen: id_rol, password_hash, estado
    const response = await pool.query(
      `INSERT INTO sisvillasol.usuarios 
            (nombre, apellido, documento, telefono, id_rol, password_hash, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
      [
        nombre,
        apellido,
        documento,
        telefono,
        id_rol || 2,
        passwordHash,
        estado !== undefined ? estado : true,
      ]
    );

    res.json({ mensaje: "¡Usuario creado! 👤", usuario: response.rows[0] });
  } catch (error) {
    console.error("Error en crearUsuario:", error);
    res.status(500).send("Error interno al crear usuario");
  }
};

// 3. ACTUALIZAR USUARIO
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, documento, telefono, id_rol, password, estado } =
    req.body;

  try {
    let query, values;

    if (password && password.trim() !== "") {
      // Si hay cambio de contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      query = `UPDATE sisvillasol.usuarios 
                     SET nombre=$1, apellido=$2, documento=$3, telefono=$4, id_rol=$5, estado=$6, password_hash=$7 
                     WHERE id_usuario=$8`;
      values = [
        nombre,
        apellido,
        documento,
        telefono,
        id_rol,
        estado,
        passwordHash,
        id,
      ];
    } else {
      // Sin cambio de contraseña
      query = `UPDATE sisvillasol.usuarios 
                     SET nombre=$1, apellido=$2, documento=$3, telefono=$4, id_rol=$5, estado=$6 
                     WHERE id_usuario=$7`;
      values = [nombre, apellido, documento, telefono, id_rol, estado, id];
    }

    await pool.query(query, values);
    res.json({ mensaje: "¡Usuario actualizado!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando");
  }
};

// 4. ELIMINAR (O DESACTIVAR)
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  // --- PROTECCIÓN CONTRA ELIMINACIÓN DEL ADMIN PRINCIPAL ---
  if (id == "1") {
    return res.status(403).json({
      mensaje:
        "⛔ ACCIÓN DENEGADA: No se puede eliminar al Administrador Principal del sistema.",
    });
  }
  // ---------------------------------------------------------
  try {
    await pool.query("DELETE FROM sisvillasol.usuarios WHERE id_usuario = $1", [
      id,
    ]);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).send("No se puede eliminar (tiene registros asociados)");
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
