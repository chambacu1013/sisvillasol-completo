const pool = require("../config/db");

// 1. OBTENER DATOS (GET)
const obtenerIdentidad = async (req, res) => {
  try {
    // Siempre pedimos el ID 1 porque es la única finca
    const response = await pool.query(
      "SELECT * FROM sisvillasol.identidad_corporativa WHERE id_identidad = 1"
    );
    res.json(response.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error obteniendo información de la empresa");
  }
};

// 2. ACTUALIZAR DATOS (PUT)
const actualizarIdentidad = async (req, res) => {
  const { nombre_empresa, mision, vision, objetivos } = req.body;

  try {
    // Actualizamos SIEMPRE la fila ID 1
    const response = await pool.query(
      `UPDATE sisvillasol.identidad_corporativa 
             SET nombre_empresa = $1, mision = $2, vision = $3, objetivos = $4, ultimo_cambio = NOW()
             WHERE id_identidad = 1
             RETURNING *`,
      [nombre_empresa, mision, vision, objetivos]
    );

    res.json({
      mensaje: "¡Identidad corporativa actualizada! 🏛️✅",
      datos: response.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando la empresa");
  }
};

module.exports = { obtenerIdentidad, actualizarIdentidad };
