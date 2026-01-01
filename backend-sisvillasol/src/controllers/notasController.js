const pool = require("../config/db");

// OBTENER NOTAS
const obtenerNotas = async (req, res) => {
  try {
    const response = await pool.query(
      "SELECT * FROM sisvillasol.notas ORDER BY fecha_creacion DESC"
    );
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener notas");
  }
};

// CREAR NOTA
const crearNota = async (req, res) => {
  const { contenido } = req.body;
  try {
    await pool.query("INSERT INTO sisvillasol.notas (contenido) VALUES ($1)", [
      contenido,
    ]);
    res.json({ mensaje: "Nota guardada" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al guardar nota");
  }
};

// ELIMINAR NOTA
const eliminarNota = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sisvillasol.notas WHERE id_nota = $1", [id]);
    res.json({ mensaje: "Nota eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar nota");
  }
};

module.exports = { obtenerNotas, crearNota, eliminarNota };
