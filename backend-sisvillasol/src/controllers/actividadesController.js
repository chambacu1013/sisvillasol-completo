const pool = require("../config/db");

// --- FUNCIÓN DE MANTENIMIENTO AUTOMÁTICO (MEJORADA 🧠) ---
const actualizarEstadosLotes = async () => {
  try {
    // 1. CASTIGO 😡: Si hay tareas viejas (> 4 días), poner en RIESGO
    const castigo = await pool.query(`
            UPDATE sisvillasol.lotes l
            SET estado_sanitario = 'RIESGO'
            FROM sisvillasol.tareas t
            WHERE l.id_lote = t.id_lote_tarea
            AND t.estado = 'PENDIENTE' 
            AND t.fecha_programada::DATE < (CURRENT_DATE - INTERVAL '4 days')
            AND l.estado_sanitario = 'OPTIMO'
        `);

    if (castigo.rowCount > 0) {
      console.log(
        `⚠️ ALERTA: ${castigo.rowCount} lotes pasaron a RIESGO por descuido.`
      );
    }

    // 2. PREMIO 😇: Si YA NO hay tareas viejas, volver a OPTIMO
    const premio = await pool.query(`
            UPDATE sisvillasol.lotes l
            SET estado_sanitario = 'OPTIMO'
            WHERE l.estado_sanitario = 'RIESGO'
            AND NOT EXISTS (
                SELECT 1 FROM sisvillasol.tareas t
                WHERE t.id_lote_tarea = l.id_lote
                AND t.estado = 'PENDIENTE'
                AND t.fecha_programada::DATE < (CURRENT_DATE - INTERVAL '4 days')
            );
        `);

    if (premio.rowCount > 0) {
      console.log(`✅ EXCELENTE: ${premio.rowCount} lotes volvieron a OPTIMO.`);
    }
  } catch (error) {
    console.error("Error actualizando estados de lotes:", error);
  }
};

// 1. OBTENER TAREAS
const obtenerActividades = async (req, res) => {
  try {
    await actualizarEstadosLotes(); // Auditoría automática

    const response = await pool.query(`
            SELECT 
                t.id_tarea, t.descripcion, t.fecha_programada, t.estado,
                t.costo_mano_obra, t.origen, t.jornada,
                t.id_lote_tarea, t.id_usuario_asignado, t.id_tipo_actividad_tarea,
                l.nombre_lote, c.nombre_variedad,
                ta.nombre_tipo_actividad,
                u.nombre as nombre_responsable, u.apellido as apellido_responsable
            FROM sisvillasol.tareas t
            LEFT JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            LEFT JOIN sisvillasol.tipos_actividad ta ON t.id_tipo_actividad_tarea = ta.id_tipo_actividad
            LEFT JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
            ORDER BY t.fecha_programada DESC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al consultar tareas");
  }
};

// 2. CREAR TAREA
const crearActividad = async (req, res) => {
  const {
    id_tipo_actividad,
    descripcion,
    fecha_programada,
    id_lote,
    id_usuario,
    costo_mano_obra,
    estado,
    origen,
    jornada,
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO sisvillasol.tareas 
            (id_tipo_actividad_tarea, descripcion, fecha_programada, id_lote_tarea, id_usuario_asignado, estado, origen, costo_mano_obra, jornada)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id_tipo_actividad,
        descripcion,
        fecha_programada,
        id_lote,
        id_usuario,
        estado || "PENDIENTE",
        origen || "CALENDARIO",
        costo_mano_obra || 0,
        jornada || "COMPLETA",
      ]
    );
    res.json({ mensaje: "¡Tarea asignada exitosamente! 📅" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error guardando la tarea");
  }
};

// 3. ACTUALIZAR TAREA
const actualizarTarea = async (req, res) => {
  const { id } = req.params;
  const {
    id_tipo_actividad,
    descripcion,
    fecha_programada,
    id_lote,
    id_usuario,
    estado,
    costo_mano_obra,
    jornada,
  } = req.body;
  try {
    await pool.query(
      `UPDATE sisvillasol.tareas 
             SET id_tipo_actividad_tarea = $1, descripcion = $2, fecha_programada = $3, id_lote_tarea = $4, id_usuario_asignado = $5, estado = $6, costo_mano_obra = $7, jornada = $8
             WHERE id_tarea = $9`,
      [
        id_tipo_actividad,
        descripcion,
        fecha_programada,
        id_lote,
        id_usuario,
        estado,
        costo_mano_obra || 0,
        jornada || "COMPLETA",
        id,
      ]
    );
    await actualizarEstadosLotes();
    res.json({ mensaje: "¡Tarea actualizada! 📝" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando la tarea");
  }
};

// 4. ELIMINAR ACTIVIDAD
const eliminarActividad = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sisvillasol.tareas WHERE id_tarea = $1", [
      id,
    ]);
    res.json({ mensaje: "Tarea eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error eliminando tarea");
  }
};

// 5. DATOS FORMULARIO (SOLO LO NECESARIO PARA TAREAS: Lotes, Usuarios, Tipos)
const obtenerDatosFormulario = async (req, res) => {
  try {
    await actualizarEstadosLotes();

    const lotes = await pool.query(`
        SELECT l.id_lote, l.nombre_lote, c.nombre_variedad, l.estado_sanitario
        FROM sisvillasol.lotes l
        LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
        ORDER BY l.nombre_lote ASC
    `);
    const usuarios = await pool.query(
      "SELECT id_usuario, nombre, apellido FROM sisvillasol.usuarios WHERE estado = true AND id_rol = 2 ORDER BY nombre ASC"
    );
    const tipos = await pool.query(
      "SELECT * FROM sisvillasol.tipos_actividad ORDER BY nombre_tipo_actividad ASC"
    );

    res.json({ lotes: lotes.rows, usuarios: usuarios.rows, tipos: tipos.rows });
  } catch (error) {
    console.error("Error en obtenerDatosFormulario:", error);
    res.status(500).send("Error cargando listas");
  }
};

// 6. HISTORIAL
const getHistorial = async (req, res) => {
  try {
    const query = `
            SELECT t.id_tarea, t.descripcion, t.fecha_programada, t.fecha_ejecucion, t.estado, t.jornada,
                u.nombre AS nombre_agricultor, l.nombre_lote, c.nombre_variedad, ta.nombre_tipo_actividad,
                (SELECT json_agg(json_build_object('nombre', i.nombre, 'cantidad', ci.cantidad_usada, 'unidad', un.nombre_unidad))
                 FROM sisvillasol.consumo_insumos ci
                 JOIN sisvillasol.insumos i ON ci.id_insumo_consumo = i.id_insumo
                 JOIN sisvillasol.unidades un ON i.id_unidad = un.id_unidad
                 WHERE ci.id_tarea_consumo = t.id_tarea) AS insumos_usados
            FROM sisvillasol.tareas t
            JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
            JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
            JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            JOIN sisvillasol.tipos_actividad ta ON t.id_tipo_actividad_tarea = ta.id_tipo_actividad
            ORDER BY t.fecha_ejecucion DESC, t.fecha_programada DESC;`;
    const response = await pool.query(query);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo el historial" });
  }
};

// 7. INFO LOTES (Se mantiene porque el Mapa de actividades usa esto)
const obtenerLotesDetallados = async (req, res) => {
  try {
    await actualizarEstadosLotes();
    const response = await pool.query(`
            SELECT l.id_lote, l.nombre_lote, l.area_hectareas, l.estado_sanitario, l.ubicacion,
                c.nombre_variedad, c.nombre_cientifico, c.dias_estimados_cosecha
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            ORDER BY l.nombre_lote ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando lotes");
  }
};

// 8. FINALIZAR TAREA (Esta SÍ se queda, es el puente entre Tareas e Insumos)
const finalizarTarea = async (req, res) => {
  const { id } = req.params;
  const { insumosUsados, jornada, fecha_ejecucion } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const fechaReal = fecha_ejecucion || new Date();
    await client.query(
      `UPDATE sisvillasol.tareas SET estado = 'HECHO', jornada = $1, fecha_ejecucion = $2 WHERE id_tarea = $3`,
      [jornada || "COMPLETA", fechaReal, id]
    );

    if (insumosUsados && insumosUsados.length > 0) {
      for (const item of insumosUsados) {
        const insumoInfo = await client.query(
          "SELECT costo_unitario_promedio FROM sisvillasol.insumos WHERE id_insumo = $1",
          [item.id_insumo]
        );
        const costoUnitario = insumoInfo.rows[0]?.costo_unitario_promedio || 0;
        const costoTotalCalculado = costoUnitario * item.cantidad;

        await client.query(
          `INSERT INTO sisvillasol.consumo_insumos (id_tarea_consumo, id_insumo_consumo, cantidad_usada, costo_calculado) VALUES ($1, $2, $3, $4)`,
          [id, item.id_insumo, item.cantidad, costoTotalCalculado]
        );
        await client.query(
          `UPDATE sisvillasol.insumos SET cantidad_stock = cantidad_stock - $1 WHERE id_insumo = $2`,
          [item.cantidad, item.id_insumo]
        );
      }
    }
    await client.query("COMMIT");
    await actualizarEstadosLotes();
    res.json({ mensaje: "Tarea finalizada y stock actualizado 📉✅" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al finalizar:", error);
    res.status(500).send("Error finalizando tarea");
  } finally {
    client.release();
  }
};
// NUEVA FUNCION: Obtener insumos usados en una tarea específica
const obtenerInsumosPorTarea = async (req, res) => {
  const { id_tarea } = req.params;
  try {
    const query = `
            SELECT 
                i.id_insumo, 
                i.nombre AS nombre_insumo, 
                ci.cantidad_usada, 
                un.nombre_unidad AS unidad_medida, 
                c.nombre_categoria
            FROM sisvillasol.consumo_insumos ci
            JOIN sisvillasol.insumos i ON ci.id_insumo_consumo = i.id_insumo
            JOIN sisvillasol.categorias c ON i.id_categoria_insumo = c.id_categoria
            LEFT JOIN sisvillasol.unidades un ON i.id_unidad = un.id_unidad
            WHERE ci.id_tarea_consumo = $1
        `;
    const response = await pool.query(query, [id_tarea]);
    res.json(response.rows);
  } catch (error) {
    console.error("Error en obtenerInsumosPorTarea:", error);
    res.status(500).send("Error del servidor");
  }
};

// NUEVA FUNCIÓN: Lógica para corregir cantidad y ajustar stock
const corregirCantidadInsumo = async (req, res) => {
  const { id_tarea, id_insumo, nueva_cantidad } = req.body;
  // Validación básica
  if (!id_tarea || !id_insumo) {
    return res.status(400).json({ message: "Faltan datos (IDs)" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Obtener la cantidad que había antes
    const resAntigua = await client.query(
      `SELECT cantidad_usada FROM sisvillasol.consumo_insumos 
             WHERE id_tarea_consumo = $1 AND id_insumo_consumo = $2`,
      [id_tarea, id_insumo]
    );

    if (resAntigua.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Insumo no encontrado en esta tarea" });
    }

    const cantidadAnterior = parseFloat(resAntigua.rows[0].cantidad_usada);
    const cantidadNueva = parseFloat(nueva_cantidad);

    // 2. Calcular la diferencia
    // Si antes era 5 y ahora es 8, diferencia es 3 (hay que restar 3 más al stock)
    // Si antes era 5 y ahora es 2, diferencia es -3 (hay que devolver 3 al stock)
    const diferencia = cantidadNueva - cantidadAnterior;

    // 3. Actualizar el registro del consumo
    await client.query(
      `UPDATE sisvillasol.consumo_insumos 
             SET cantidad_usada = $1 
             WHERE id_tarea_consumo = $2 AND id_insumo_consumo = $3`,
      [cantidadNueva, id_tarea, id_insumo]
    );

    // 4. Actualizar el Stock en Bodega (restamos la diferencia)
    // Si la diferencia es negativa (devolución), -- se convierte en +
    await client.query(
      `UPDATE sisvillasol.insumos 
             SET cantidad_stock = cantidad_stock - $1 
             WHERE id_insumo = $2`,
      [diferencia, id_insumo]
    );

    await client.query("COMMIT");
    res.json({ message: "Cantidad corregida y stock ajustado exitosamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error corrigiendo insumo:", error);
    res.status(500).send("Error al corregir insumo");
  } finally {
    client.release();
  }
};
module.exports = {
  obtenerActividades,
  crearActividad,
  actualizarTarea,
  eliminarActividad,
  obtenerDatosFormulario,
  obtenerLotesDetallados,
  finalizarTarea,
  getHistorial,
  actualizarEstadosLotes,
  obtenerInsumosPorTarea,
  corregirCantidadInsumo,
};
