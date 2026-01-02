const pool = require("../config/db");

// 1. OBTENER TAREAS
const obtenerActividades = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT 
                t.id_tarea,
                t.descripcion,
                t.fecha_programada,
                t.estado,
                t.costo_mano_obra,
                t.origen, 
                t.jornada,
                t.id_lote_tarea,
                t.id_usuario_asignado, 
                t.id_tipo_actividad_tarea,
                l.nombre_lote,
                c.nombre_variedad,
                ta.nombre_tipo_actividad,
                u.nombre as nombre_responsable,
                u.apellido as apellido_responsable
            FROM sisvillasol.tareas t
            LEFT JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            LEFT JOIN sisvillasol.tipos_actividad ta ON t.id_tipo_actividad_tarea = ta.id_tipo_actividad
            LEFT JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
            ORDER BY t.fecha_programada ASC
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
            (id_tipo_actividad_tarea, descripcion, fecha_programada, id_lote_tarea, id_usuario_asignado, estado, origen, costo_mano_obra,jornada)
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

// 3. ACTUALIZAR TAREA (¡ESTA ES LA CRÍTICA!)
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
             SET id_tipo_actividad_tarea = $1, 
                 descripcion = $2, 
                 fecha_programada = $3, 
                 id_lote_tarea = $4, 
                 id_usuario_asignado = $5,
                 estado = $6,
                 costo_mano_obra = $7,
                  jornada = $8
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

// 5. DATOS FORMULARIO
const obtenerDatosFormulario = async (req, res) => {
  try {
    const lotes = await pool.query(`
    SELECT 
                l.id_lote, 
                l.nombre_lote, 
                c.nombre_variedad
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            ORDER BY l.nombre_lote ASC
`);
    // Usuarios
    const usuarios = await pool.query(
      "SELECT id_usuario, nombre, apellido FROM sisvillasol.usuarios WHERE estado = true ORDER BY nombre ASC"
    );

    const tipos = await pool.query(
      "SELECT * FROM sisvillasol.tipos_actividad ORDER BY nombre_tipo_actividad ASC"
    );

    res.json({
      lotes: lotes.rows,
      usuarios: usuarios.rows,
      tipos: tipos.rows, // <--- ¡AQUÍ ESTÁ LA CLAVE!
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando listas");
  }
};
//historial completo de actividades
const getHistorial = async (req, res) => {
  try {
    const query = `
            SELECT 
                t.id_tarea, 
                t.descripcion, 
                t.fecha_programada, 
                t.fecha_ejecucion, 
                t.estado,
                t.jornada,
                u.nombre AS nombre_agricultor,
                l.nombre_lote,
                c.nombre_variedad,
                ta.nombre_tipo_actividad,
                -- Aquí traemos los insumos usados como una lista JSON
                (
                    SELECT json_agg(json_build_object(
                        'nombre', i.nombre, 
                        'cantidad', ci.cantidad_usada, 
                        'unidad', un.nombre_unidad
                    ))
                    FROM sisvillasol.consumo_insumos ci
                    JOIN sisvillasol.insumos i ON ci.id_insumo_consumo = i.id_insumo
                    JOIN sisvillasol.unidades un ON i.id_unidad = un.id_unidad
                    WHERE ci.id_tarea_consumo = t.id_tarea
                ) AS insumos_usados
            FROM sisvillasol.tareas t
            JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
            JOIN sisvillasol.lotes l ON t.id_lote_tarea = l.id_lote
            JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            JOIN sisvillasol.tipos_actividad ta ON t.id_tipo_actividad_tarea = ta.id_tipo_actividad
            ORDER BY t.fecha_ejecucion DESC, t.fecha_programada DESC;
        `;

    const response = await pool.query(query);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo el historial" });
  }
};
// 5. OBTENER INFORMACIÓN DETALLADA DE LOTES (NUEVO)
const obtenerLotesDetallados = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT 
                l.id_lote, 
                l.nombre_lote, 
                l.area_hectareas, 
                l.estado_sanitario, 
                l.ubicacion,
                c.nombre_variedad, 
                c.nombre_cientifico, 
                c.dias_estimados_cosecha
            FROM sisvillasol.lotes l
            JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            ORDER BY l.nombre_lote ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando lotes");
  }
};
// 6. OBTENER INSUMOS (Con nombre de unidad)
const obtenerInsumos = async (req, res) => {
  try {
    // Hacemos JOIN para traer el nombre de la unidad (Ej: 'Litros') en vez del ID
    const response = await pool.query(`
            SELECT 
                i.id_insumo, 
                i.nombre, 
                i.cantidad_stock, 
                u.nombre_unidad 
            FROM sisvillasol.insumos i
            JOIN sisvillasol.unidades u ON i.id_unidad = u.id_unidad
            ORDER BY i.nombre ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando insumos");
  }
};
// 7. FINALIZAR TAREA (Con tu estructura SQL exacta)
const finalizarTarea = async (req, res) => {
  const { id } = req.params; // ID de la tarea
  const { insumosUsados, jornada } = req.body; // Array: [{id_insumo: 1, cantidad: 5}, ...]

  const client = await pool.connect(); // Iniciamos transacción

  try {
    await client.query("BEGIN");

    // 1. Marcar tarea como HECHO
    await client.query(
      `UPDATE sisvillasol.tareas SET estado = 'HECHO',
       jornada = $1, fecha_ejecucion = NOW() WHERE id_tarea = $2`,
      [jornada || "COMPLETA", id]
    );

    // 2. Procesar Insumos (Si hubo gasto)
    if (insumosUsados && insumosUsados.length > 0) {
      for (const item of insumosUsados) {
        // A. Consultar costo actual para guardar el histórico
        const insumoInfo = await client.query(
          "SELECT costo_unitario_promedio FROM sisvillasol.insumos WHERE id_insumo = $1",
          [item.id_insumo]
        );

        const costoUnitario = insumoInfo.rows[0]?.costo_unitario_promedio || 0;
        const costoTotalCalculado = costoUnitario * item.cantidad;

        // B. Insertar en tu tabla 'consumo_insumos' (Nombres corregidos)
        await client.query(
          `INSERT INTO sisvillasol.consumo_insumos 
                    (id_tarea_consumo, id_insumo_consumo, cantidad_usada, costo_calculado) 
                    VALUES ($1, $2, $3, $4)`,
          [id, item.id_insumo, item.cantidad, costoTotalCalculado]
        );

        // C. Descontar del inventario (cantidad_stock)
        await client.query(
          `UPDATE sisvillasol.insumos 
                     SET cantidad_stock = cantidad_stock - $1 
                     WHERE id_insumo = $2`,
          [item.cantidad, item.id_insumo]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ mensaje: "Tarea finalizada y stock actualizado 📉✅" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al finalizar:", error);
    res.status(500).send("Error finalizando tarea");
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
  obtenerInsumos,
  finalizarTarea,
  getHistorial,
};
