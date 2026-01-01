const pool = require("../config/db");

// 1. REGISTRAR UNA VENTA
const registrarVenta = async (req, res) => {
  // Recibimos los datos exactos de tu tabla
  const { id_lote, fecha_venta, cliente, kilos_vendidos, precio_total } =
    req.body;

  try {
    const response = await pool.query(
      `INSERT INTO sisvillasol.ventas (id_lote, fecha_venta, cliente, kilos_vendidos, precio_total)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [id_lote, fecha_venta, cliente, kilos_vendidos, precio_total]
    );

    res.json({
      mensaje: "¡Venta registrada exitosamente! 💰📈",
      venta: response.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registrando la venta");
  }
};

// 2. CONSULTAR EL HISTORIAL DE VENTAS
const obtenerVentas = async (req, res) => {
  try {
    // Hacemos un JOIN con Lotes para saber de dónde salió la fruta
    const response = await pool.query(`
            SELECT 
                l.id_lote, 
                l.nombre_lote, 
                c.nombre_variedad 
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            ORDER BY l.nombre_lote ASC
        `);
    // 2. Usuarios (Solo los agricultores y admins activos)
    const usuarios = await pool.query(`
            SELECT id_usuario, nombre, apellido 
            FROM sisvillasol.usuarios 
            WHERE estado = true 
            ORDER BY nombre ASC
        `);

    // 3. Tipos de Actividad
    const tipos = await pool.query(`
            SELECT * FROM sisvillasol.tipos_actividad 
            ORDER BY nombre_tipo_actividad ASC
        `);

    res.json({
      lotes: lotes.rows,
      usuarios: usuarios.rows,
      tipos: tipos.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando las ventas");
  }
};

module.exports = { registrarVenta, obtenerVentas };
