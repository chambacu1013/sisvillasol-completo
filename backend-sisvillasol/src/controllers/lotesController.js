const pool = require("../config/db");

// 1. OBTENER TODOS LOS LOTES (ACTUALIZADO CON EL CATÁLOGO AGRONÓMICO 🌱)
const obtenerLotes = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT 
                l.id_lote, 
                l.nombre_lote, 
                l.area_hectareas, 
                ce.clasificacion as estado_sanitario, -- Mantenemos este nombre para que React sepa si es Verde o Rojo
                ce.nombre_estado,
                ce.categoria,
                ce.descripcion as descripcion_estado,
                c.nombre_variedad,
                l.ubicacion as coordenadas
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            LEFT JOIN sisvillasol.catalogo_estados_lote ce ON l.id_estado_actual = ce.id_estado
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error buscando los lotes 🌍");
  }
};

// 2. OBTENER CATÁLOGO DE ESTADOS (NUEVO) 📋
const obtenerCatalogoEstados = async (req, res) => {
  try {
    const response = await pool.query(
      "SELECT * FROM sisvillasol.catalogo_estados_lote ORDER BY id_estado ASC",
    );
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando catálogo");
  }
};

// 3. ACTUALIZAR ESTADO DEL LOTE (NUEVO) 🔄
const actualizarEstadoLote = async (req, res) => {
  const { id_lote } = req.params;
  const { id_estado_actual } = req.body;
  try {
    await pool.query(
      "UPDATE sisvillasol.lotes SET id_estado_actual = $1 WHERE id_lote = $2",
      [id_estado_actual, id_lote],
    );
    res.json({ mensaje: "¡Estado del lote actualizado con éxito! 🌿" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando estado");
  }
};

module.exports = { obtenerLotes, obtenerCatalogoEstados, actualizarEstadoLote };
