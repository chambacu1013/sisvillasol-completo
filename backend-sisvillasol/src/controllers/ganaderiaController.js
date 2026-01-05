const pool = require("../config/db");

// 1. OBTENER RESUMEN (DASHBOARD)
const obtenerDashboard = async (req, res) => {
  try {
    // Animales Activos
    const animales = await pool.query(
      "SELECT * FROM sisvillasol.ganado WHERE estado = 'ACTIVO' ORDER BY id_animal DESC"
    );

    // Últimos registros de leche
    const leche = await pool.query(
      "SELECT * FROM sisvillasol.produccion_leche ORDER BY fecha DESC LIMIT 7"
    );

    // Historial Insumos
    const insumos = await pool.query(
      "SELECT * FROM sisvillasol.consumo_ganaderia ORDER BY fecha DESC LIMIT 10"
    );

    // Historial Pastoreo
    const pastoreo = await pool.query(
      "SELECT * FROM sisvillasol.pastoreo ORDER BY fecha_entrada DESC LIMIT 5"
    );

    res.json({
      animales: animales.rows,
      leche: leche.rows,
      insumos: insumos.rows,
      pastoreo: pastoreo.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en ganadería");
  }
};

// 2. REGISTRAR ANIMAL
const crearAnimal = async (req, res) => {
  const { numero, raza, fecha_ingreso } = req.body;
  try {
    await pool.query(
      "INSERT INTO sisvillasol.ganado (numero_animal, raza, fecha_ingreso) VALUES ($1, $2, $3)",
      [numero, raza, fecha_ingreso]
    );
    res.json({ message: "Animal registrado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
// 7. ACTUALIZAR ANIMAL
const actualizarAnimal = async (req, res) => {
  const { id } = req.params;
  const { numero, raza, fecha_ingreso } = req.body;
  try {
    await pool.query(
      "UPDATE sisvillasol.ganado SET numero_animal=$1, raza=$2, fecha_ingreso=$3 WHERE id_animal=$4",
      [numero, raza, fecha_ingreso, id]
    );
    res.json({ message: "Animal actualizado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// 8. ELIMINAR ANIMAL
const eliminarAnimal = async (req, res) => {
  const { id } = req.params;
  try {
    // Opcional: Verificar si tiene ventas o leche antes de borrar para no romper integridad
    await pool.query("DELETE FROM sisvillasol.ganado WHERE id_animal = $1", [
      id,
    ]);
    res.json({ message: "Animal eliminado" });
  } catch (error) {
    res
      .status(500)
      .send(
        "No se puede eliminar: El animal tiene registros asociados (leche o ventas)."
      );
  }
};
// 3. REGISTRAR LECHE
const registrarLeche = async (req, res) => {
  const { fecha, cantidad, precio } = req.body;
  try {
    await pool.query(
      "INSERT INTO sisvillasol.produccion_leche (fecha, cantidad_litros, precio_litro) VALUES ($1, $2, $3)",
      [fecha, cantidad, precio]
    );
    res.json({ message: "Producción guardada" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
// 9. ACTUALIZAR LECHE
const actualizarLeche = async (req, res) => {
  const { id } = req.params;
  const { fecha, cantidad, precio } = req.body;
  try {
    await pool.query(
      "UPDATE sisvillasol.produccion_leche SET fecha=$1, cantidad_litros=$2, precio_litro=$3 WHERE id_leche=$4",
      [fecha, cantidad, precio, id]
    );
    res.json({ message: "Registro actualizado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// 10. ELIMINAR LECHE
const eliminarLeche = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "DELETE FROM sisvillasol.produccion_leche WHERE id_leche = $1",
      [id]
    );
    res.json({ message: "Registro eliminado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
// 4. REGISTRAR GASTO (SAL/MELAZA)
const registrarInsumo = async (req, res) => {
  const { fecha, tipo, cantidad, costo } = req.body;
  try {
    const fechaFinal = fecha || new Date().toISOString().split("T")[0];
    await pool.query(
      "INSERT INTO sisvillasol.consumo_ganaderia (fecha, tipo_insumo, cantidad_kg, costo_total) VALUES ($1, $2, $3, $4)",
      [fechaFinal, tipo, cantidad, costo]
    );
    res.json({ message: "Gasto registrado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
// 11. ACTUALIZAR INSUMO (NUEVA)
const actualizarInsumo = async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo, cantidad, costo } = req.body;
  try {
    await pool.query(
      "UPDATE sisvillasol.consumo_ganaderia SET fecha=$1, tipo_insumo=$2, cantidad_kg=$3, costo_total=$4 WHERE id_consumo=$5",
      [fecha, tipo, cantidad, costo, id]
    );
    res.json({ message: "Registro actualizado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// 12. ELIMINAR INSUMO (NUEVA)
const eliminarInsumo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "DELETE FROM sisvillasol.consumo_ganaderia WHERE id_consumo = $1",
      [id]
    );
    res.json({ message: "Registro eliminado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
// 5. VENDER ANIMAL
const venderAnimal = async (req, res) => {
  const { id_animal, precio, peso, comprador } = req.body;
  try {
    // Insertar venta
    await pool.query(
      "INSERT INTO sisvillasol.ventas_ganado (id_animal, precio_venta, peso_kg, comprador) VALUES ($1, $2, $3, $4)",
      [id_animal, precio, peso, comprador]
    );
    // Actualizar estado del animal a VENDIDO
    await pool.query(
      "UPDATE sisvillasol.ganado SET estado = 'VENDIDO' WHERE id_animal = $1",
      [id_animal]
    );

    res.json({ message: "Venta registrada exitosamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// 6. REGISTRAR PASTOREO
const registrarPastoreo = async (req, res) => {
  const { lote, entrada, salida } = req.body;
  try {
    await pool.query(
      "INSERT INTO sisvillasol.pastoreo (numero_lote, fecha_entrada, fecha_salida) VALUES ($1, $2, $3)",
      [lote, entrada, salida]
    );
    res.json({ message: "Movimiento de pastoreo registrado" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  obtenerDashboard,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal,
  registrarLeche,
  actualizarLeche,
  eliminarLeche,
  registrarInsumo,
  actualizarInsumo,
  eliminarInsumo,
  venderAnimal,
  registrarPastoreo,
};
