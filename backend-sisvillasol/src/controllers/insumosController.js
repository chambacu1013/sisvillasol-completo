const pool = require("../config/db");

// 1. OBTENER INSUMOS (CON JOIN A CATEGORIAS Y UNIDADES)
const obtenerInsumos = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT 
                i.id_insumo,
                i.nombre,
                i.cantidad_stock,
                i.stock_minimo,
                i.costo_unitario_promedio,
                i.id_categoria_insumo,
                i.id_unidad,
                c.nombre_categoria, -- Traemos el nombre para mostrar en tabla
                u.nombre_unidad     -- Traemos el nombre para mostrar en tabla
            FROM sisvillasol.insumos i
            JOIN sisvillasol.categorias c ON i.id_categoria_insumo = c.id_categoria
            JOIN sisvillasol.unidades u ON i.id_unidad = u.id_unidad
            ORDER BY i.nombre ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener inventario");
  }
};

// 2. CREAR INSUMO (Usando IDs)
const crearInsumo = async (req, res) => {
  // Nota: Ahora recibimos id_categoria_insumo y id_unidad
  const {
    nombre,
    id_categoria_insumo,
    id_unidad,
    cantidad_stock,
    stock_minimo,
    costo_unitario_promedio,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO sisvillasol.insumos 
            (nombre, id_categoria_insumo, id_unidad, cantidad_stock, stock_minimo, costo_unitario_promedio)
            VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        nombre,
        id_categoria_insumo,
        id_unidad,
        cantidad_stock,
        stock_minimo,
        costo_unitario_promedio,
      ]
    );
    res.json({ mensaje: "Insumo creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear insumo");
  }
};

// 3. ACTUALIZAR INSUMO
const actualizarInsumo = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    id_categoria_insumo,
    id_unidad,
    cantidad_stock,
    stock_minimo,
    costo_unitario_promedio,
  } = req.body;

  try {
    await pool.query(
      `UPDATE sisvillasol.insumos
            SET nombre = $1, id_categoria_insumo = $2, id_unidad = $3, 
                cantidad_stock = $4, stock_minimo = $5, costo_unitario_promedio = $6
            WHERE id_insumo = $7`,
      [
        nombre,
        id_categoria_insumo,
        id_unidad,
        cantidad_stock,
        stock_minimo,
        costo_unitario_promedio,
        id,
      ]
    );
    res.json({ mensaje: "Insumo actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar insumo");
  }
};

// 4. ELIMINAR INSUMO
const eliminarInsumo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sisvillasol.insumos WHERE id_insumo = $1", [
      id,
    ]);
    res.json({ mensaje: "Insumo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar insumo");
  }
};

// 5. OBTENER LISTAS PARA LOS DROPDOWNS (Nuevo Endpoint)
const obtenerDatosFormulario = async (req, res) => {
  try {
    const categorias = await pool.query(
      "SELECT * FROM sisvillasol.categorias ORDER BY nombre_categoria ASC"
    );
    const unidades = await pool.query(
      "SELECT * FROM sisvillasol.unidades ORDER BY nombre_unidad ASC"
    );

    res.json({
      categorias: categorias.rows,
      unidades: unidades.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando listas del formulario");
  }
};

module.exports = {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  obtenerDatosFormulario, // <--- No olvides exportar esto
};
