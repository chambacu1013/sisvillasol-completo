const pool = require("../config/db");

// 1. ASIGNAR TAREA (Don Jaime crea la orden)
const crearTarea = async (req, res) => {
  // Recibimos los IDs de las otras tablas
  const {
    id_lote_tarea,
    id_usuario_asignado,
    id_tipo_actividad_tarea,
    descripcion,
    fecha_programada,
  } = req.body;

  try {
    const response = await pool.query(
      `INSERT INTO sisvillasol.tareas (id_lote_tarea, id_usuario_asignado, 
            id_tipo_actividad_tarea, descripcion, fecha_programada, estado, origen)
             VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', 'CALENDARIO')
             RETURNING *`,
      [
        id_lote_tarea,
        id_usuario_asignado,
        id_tipo_actividad_tarea,
        descripcion,
        fecha_programada,
      ]
    );

    res.json({
      mensaje: "¡Tarea programada exitosamente! 📅",
      tarea: response.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error asignando la tarea");
  }
};

// 2. VER MIS TAREAS (Para que Franklin vea SU lista en el celular)
const obtenerMisTareas = async (req, res) => {
  // El ID del usuario viene DENTRO del Token (gracias al Vigilante)
  const id_usuario = req.user.id;
  const rol_usuario = req.user.rol;

  try {
    let querySQL = "";
    let params = [];

    // Lógica Inteligente:
    // Si soy ADMIN (Rol 1), veo TODAS las tareas.
    // Si soy AGRICULTOR (Rol 2), solo veo LAS MÍAS.
    if (rol_usuario === 1) {
      querySQL = `
                SELECT t.*,tp.nombre_tipo_actividad, l.nombre_lote,
                 u.nombre || ' ' || u.apellido as responsable 
                FROM sisvillasol.tareas t
                JOIN sisvillasol.tipos_actividad tp ON t.id_tipo_actividad_tarea = tp.id_tipo_actividad
                JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
                JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
                ORDER BY t.fecha_programada DESC
            `;
    } else {
      querySQL = `
                SELECT t.*,tp.nombre_tipo_actividad, l.nombre_lote 
                FROM sisvillasol.tareas t
                JOIN sisvillasol.tipos_actividad tp ON t.id_tipo_actividad_tarea = tp.id_tipo_actividad
                JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
                WHERE t.id_usuario_asignado = $1
                ORDER BY t.fecha_programada ASC
            `;
      params = [id_usuario];
    }

    const response = await pool.query(querySQL, params);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando las tareas");
  }
};
// 3. FINALIZAR TAREA (Franklin reporta que terminó y qué gastó)
const finalizarTarea = async (req, res) => {
  const { id_tarea, insumos_usados } = req.body;
  // insumos_usados será una lista así: [{ id_insumo: 2, cantidad: 1.5 }, { id_insumo: 5, cantidad: 2 }]

  // Iniciamos una "Transacción" (O todo se guarda bien, o no se guarda nada)
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Inicio de la transacción

    // A. Actualizar la tarea a 'HECHO' y poner la fecha de hoy
    await client.query(
      `UPDATE sisvillasol.tareas 
             SET estado = 'HECHO', fecha_ejecucion = NOW() 
             WHERE id_tarea = $1`,
      [id_tarea]
    );

    // B. Recorrer la lista de insumos que Franklin dijo que usó
    if (insumos_usados && insumos_usados.length > 0) {
      for (const insumo of insumos_usados) {
        // 1. PRIMERO: Averiguar cuánto cuesta ese insumo HOY
        const infoInsumo = await client.query(
          "SELECT costo_unitario_promedio FROM sisvillasol.insumos WHERE id_insumo = $1",
          [insumo.id_insumo]
        );
        const precioActual = infoInsumo.rows[0].costo_unitario_promedio;

        // 2. CALCULAR el costo total de este chorrito
        const costoTotal = precioActual * insumo.cantidad;
        // 3. Guardar el registro en la tabla histórica
        await client.query(
          `INSERT INTO sisvillasol.consumo_insumos (id_tarea_consumo, id_insumo_consumo, cantidad_usada, costo_calculado)
                     VALUES ($1, $2, $3, $4)`,
          [id_tarea, insumo.id_insumo, insumo.cantidad, costoTotal]
        );

        // 2. RESTAR del inventario (La magia del sistema) 📉
        await client.query(
          `UPDATE sisvillasol.insumos 
                     SET cantidad_stock = cantidad_stock - $1 
                     WHERE id_insumo = $2`,
          [insumo.cantidad, insumo.id_insumo]
        );
      }
    }

    await client.query("COMMIT"); // ¡Confirmar cambios!
    res.json({ mensaje: "¡Labor registrada y bodega actualizada! ✅🚜" });
  } catch (error) {
    await client.query("ROLLBACK"); // Si algo falla, deshacer todo
    console.error(error);
    res.status(500).send("Error finalizando la tarea");
  } finally {
    client.release(); // Soltar la conexión
  }
};
module.exports = { crearTarea, obtenerMisTareas, finalizarTarea };
