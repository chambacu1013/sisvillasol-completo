const pool = require("../config/db");

// 1. OBTENER TODOS LOS LOTES
const obtenerLotes = async (req, res) => {
  try {
    // Seleccionamos los datos y convertimos la geometría rara a texto legible (GeoJSON)
    // para que el mapa del Frontend lo entienda fácil.
    const response = await pool.query(`
            SELECT 
                l.id_lote, 
                l.nombre_lote, 
                l.area_hectareas, 
                l.estado_sanitario,
                c.nombre_variedad as cultivo,
                l.ubicacion as coordenadas
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error buscando los lotes 🌍");
  }
};

// 2. CREAR UN LOTE NUEVO
const crearLote = async (req, res) => {
  const { id_cultivo, nombre_lote, area, coordenadas } = req.body;

  // Coordenadas viene como un string: "POLYGON((...))"

  try {
    const response = await pool.query(
      `INSERT INTO sisvillasol.lotes (id_cultivo_actual, nombre_lote, area_hectareas, ubicacion)
             VALUES ($1, $2, $3, $4) 
             RETURNING id_lote, nombre_lote`,
      [id_cultivo, nombre_lote, area, coordenadas]
    );

    res.json({
      mensaje: "¡Lote registrado! 🌱",
      lote: response.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error guardando el lote (Revisa las coordenadas)");
  }
};

module.exports = { obtenerLotes, crearLote };
