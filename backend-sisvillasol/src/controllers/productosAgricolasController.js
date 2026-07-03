const pool = require("../config/db");

/*=====================================================
OBTENER TODOS LOS PRODUCTOS
=====================================================*/

const obtenerProductos = async (req, res) => {
  try {
    const response = await pool.query(`
      SELECT
        id,
        nombre,
        unidad,
        activo
      FROM sisvillasol.productos_agricolas
      WHERE activo = TRUE
      ORDER BY nombre ASC
    `);

    res.json(response.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error obteniendo productos agrícolas.",
    });
  }
};

/*=====================================================
OBTENER UN PRODUCTO
=====================================================*/

const obtenerProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await pool.query(
      `
      SELECT
        id,
        nombre,
        unidad,
        activo
      FROM sisvillasol.productos_agricolas
      WHERE id = $1
      `,
      [id],
    );

    if (response.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Producto no encontrado.",
      });
    }

    res.json(response.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error consultando producto.",
    });
  }
};

/*=====================================================
CREAR PRODUCTO
=====================================================*/

const crearProducto = async (req, res) => {
  const { nombre, unidad } = req.body;

  try {
    const existe = await pool.query(
      `
      SELECT id
      FROM sisvillasol.productos_agricolas
      WHERE UPPER(nombre)=UPPER($1)
      `,
      [nombre],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        mensaje: "El producto ya existe.",
      });
    }

    await pool.query(
      `
      INSERT INTO sisvillasol.productos_agricolas
      (
        nombre,
        unidad
      )
      VALUES
      ($1,$2)
      `,
      [nombre, unidad],
    );

    res.json({
      mensaje: "Producto registrado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error registrando producto.",
    });
  }
};

/*=====================================================
ACTUALIZAR PRODUCTO
=====================================================*/

const actualizarProducto = async (req, res) => {
  const { id } = req.params;

  const { nombre, unidad, activo } = req.body;

  try {
    const existe = await pool.query(
      `
      SELECT id
      FROM sisvillasol.productos_agricolas
      WHERE UPPER(nombre)=UPPER($1)
      AND id<>$2
      `,
      [nombre, id],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        mensaje: "Ya existe otro producto con ese nombre.",
      });
    }

    await pool.query(
      `
      UPDATE sisvillasol.productos_agricolas

      SET

      nombre=$1,
      unidad=$2,
      activo=$3

      WHERE id=$4
      `,
      [nombre, unidad, activo, id],
    );

    res.json({
      mensaje: "Producto actualizado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error actualizando producto.",
    });
  }
};
/*=====================================================
DESACTIVAR PRODUCTO
=====================================================*/

const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await pool.query(
      `
      UPDATE sisvillasol.productos_agricolas

      SET activo = FALSE

      WHERE id = $1

      RETURNING id
      `,
      [id],
    );

    if (response.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Producto no encontrado.",
      });
    }

    res.json({
      mensaje: "Producto desactivado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error desactivando producto.",
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
