const pool = require("../config/db");

// --- FUNCIÓN AUXILIAR (El Cerebro de la Lógica) ---
// Esta función decide el estado basándose en los números.
const calcularEstado = (cantidad, minimo) => {
  const cant = parseFloat(cantidad);
  const min = parseFloat(minimo);
  // REGLA 1: Si el admin puso Stock Mínimo en 0, es porque el producto
  // ya no se usa ni se compra. Es "FUERA DE MERCADO".
  if (min === 0) {
    return "FUERA DE MERCADO";
  }
  // REGLA 2: Si el stock actual es menor o igual al mínimo (y el mínimo no es 0)
  // entonces estamos en alerta. (Ej: Tengo 0.5 y el mínimo es 1 -> BAJO STOCK)
  if (cant <= min) {
    return "BAJO STOCK";
  }
  // REGLA 3: Si tengo más del mínimo, todo está bien.
  return "NORMAL";
};
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
                i.nivel_toxicidad,
                i.estado_insumo,
                i.id_categoria_insumo,
                i.id_unidad,
                c.nombre_categoria, 
                u.nombre_unidad     
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
  const {
    nombre,
    id_categoria_insumo,
    id_unidad,
    cantidad_stock,
    stock_minimo,
    costo_unitario_promedio,
    nivel_toxicidad,
  } = req.body;
  // LÓGICA DE NEGOCIO: Calculamos el estado antes de guardar
  const estadoCalculado = calcularEstado(cantidad_stock, stock_minimo);
  try {
    await pool.query(
      `INSERT INTO sisvillasol.insumos 
            (nombre, id_categoria_insumo, id_unidad, cantidad_stock, stock_minimo, costo_unitario_promedio, nivel_toxicidad, estado_insumo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        nombre,
        id_categoria_insumo,
        id_unidad,
        cantidad_stock,
        stock_minimo,
        costo_unitario_promedio,
        nivel_toxicidad || "III", // Si no envían nada, por defecto es III (Ligeramente peligroso)
        estadoCalculado, // Guardamos el estado que calculó Node.js
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
    nivel_toxicidad,
  } = req.body;
  // LÓGICA DE NEGOCIO: Recalculamos el estado al editar
  // (Por si el usuario cambió el stock mínimo o la cantidad)
  const estadoCalculado = calcularEstado(cantidad_stock, stock_minimo);
  try {
    await pool.query(
      `UPDATE sisvillasol.insumos
            SET nombre = $1, 
                id_categoria_insumo = $2, 
                id_unidad = $3, 
                cantidad_stock = $4, 
                stock_minimo = $5, 
                costo_unitario_promedio = $6,
                nivel_toxicidad = $7,
                estado_insumo = $8
            WHERE id_insumo = $9`,
      [
        nombre,
        id_categoria_insumo,
        id_unidad,
        cantidad_stock,
        stock_minimo,
        costo_unitario_promedio,
        nivel_toxicidad,
        estadoCalculado, // Actualizamos el estado
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
  obtenerDatosFormulario,
};
