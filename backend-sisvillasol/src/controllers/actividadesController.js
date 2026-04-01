const pool = require("../config/db");

// 1. OBTENER TAREAS
const obtenerActividades = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT 
                t.id_tarea, 
                t.descripcion, 
                t.fecha_programada, 
                t.fecha_ejecucion,
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
            ORDER BY 
                t.fecha_programada DESC,
                CASE 
                    WHEN t.jornada = 'MANANA' THEN 1 
                    WHEN t.jornada = 'COMPLETA' THEN 2 
                    WHEN t.jornada = 'TARDE' THEN 3 
                    ELSE 4 
                END ASC
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
      ],
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
    fecha_ejecucion,
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
                 jornada = $8,
                 fecha_ejecucion = $9  
             WHERE id_tarea = $10`,
      [
        id_tipo_actividad,
        descripcion,
        fecha_programada,
        id_lote,
        id_usuario,
        estado,
        costo_mano_obra || 0,
        jornada || "COMPLETA",
        fecha_ejecucion || null,
        id,
      ],
    );
    res.json({ mensaje: "¡Tarea actualizada! 📝" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando la tarea");
  }
};

// 4. DATOS FORMULARIO
const obtenerDatosFormulario = async (req, res) => {
  try {
    const lotes = await pool.query(`
        SELECT l.id_lote, l.nombre_lote, c.nombre_variedad, 
        ce.clasificacion as estado_sanitario 
        FROM sisvillasol.lotes l
        LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
        LEFT JOIN sisvillasol.catalogo_estados_lote ce ON l.id_estado_actual = ce.id_estado
        ORDER BY l.nombre_lote ASC
    `);
    const usuarios = await pool.query(
      "SELECT id_usuario, nombre, apellido FROM sisvillasol.usuarios WHERE estado = true AND id_rol = 2 ORDER BY nombre ASC",
    );
    const tipos = await pool.query(
      "SELECT * FROM sisvillasol.tipos_actividad ORDER BY nombre_tipo_actividad ASC",
    );

    res.json({ lotes: lotes.rows, usuarios: usuarios.rows, tipos: tipos.rows });
  } catch (error) {
    console.error("Error en obtenerDatosFormulario:", error);
    res.status(500).send("Error cargando listas");
  }
};

// 5. OBTENER HISTORIAL POR LOTE (Para el Mapa) 🗺️
const getHistorialPorLote = async (req, res) => {
  const { id_lote } = req.params;
  try {
    const query = `
            SELECT 
                t.id_tarea, 
                t.fecha_ejecucion,
                t.descripcion,
                ta.nombre_tipo_actividad,                
                u.nombre || ' ' || u.apellido as nombre_agricultor,
                (SELECT json_agg(json_build_object('nombre', i.nombre, 'cantidad', ci.cantidad_usada, 'unidad', un.nombre_unidad))
                 FROM sisvillasol.consumo_insumos ci
                 JOIN sisvillasol.insumos i ON ci.id_insumo_consumo = i.id_insumo
                 LEFT JOIN sisvillasol.unidades un ON i.id_unidad = un.id_unidad
                 WHERE ci.id_tarea_consumo = t.id_tarea) AS insumos_usados
            FROM sisvillasol.tareas t
            LEFT JOIN sisvillasol.usuarios u ON t.id_usuario_asignado = u.id_usuario
            LEFT JOIN sisvillasol.tipos_actividad ta ON t.id_tipo_actividad_tarea = ta.id_tipo_actividad
            WHERE t.id_lote_tarea = $1 
            AND t.estado = 'HECHO'
            ORDER BY t.fecha_ejecucion DESC
        `;
    const response = await pool.query(query, [id_lote]);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo historial del lote" });
  }
};

// 6. INFO LOTES
const obtenerLotesDetallados = async (req, res) => {
  try {
    const response = await pool.query(`
            SELECT l.id_lote, l.nombre_lote, l.area_hectareas,
            ce.clasificacion as estado_sanitario, ce.nombre_estado, -- NUEVO
            l.ubicacion, l.cantidad_arboles,
            c.nombre_variedad, c.nombre_cientifico, c.dias_estimados_cosecha
            FROM sisvillasol.lotes l
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            LEFT JOIN sisvillasol.catalogo_estados_lote ce ON l.id_estado_actual = ce.id_estado
            ORDER BY l.nombre_lote ASC
        `);
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error consultando lotes");
  }
};

// 7. FINALIZAR TAREA (CÁLCULO DE COSTOS 💵✅)
const finalizarTarea = async (req, res) => {
  const { id } = req.params;
  const { insumosUsados, jornada, fecha_ejecucion } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const fechaReal = fecha_ejecucion || new Date();
    await client.query(
      `UPDATE sisvillasol.tareas SET estado = 'HECHO', jornada = $1, fecha_ejecucion = $2 WHERE id_tarea = $3`,
      [jornada || "COMPLETA", fechaReal, id],
    );

    if (insumosUsados && insumosUsados.length > 0) {
      for (const item of insumosUsados) {
        const insumoInfo = await client.query(
          "SELECT costo_unitario_promedio, cantidad_stock FROM sisvillasol.insumos WHERE id_insumo = $1",
          [item.id_insumo],
        );

        if (!insumoInfo.rows[0])
          throw new Error(`Insumo ${item.id_insumo} no encontrado`);

        // 1. Obtenemos el Valor Total de la Bodega y el Stock Actual
        const valorTotalInventario =
          parseFloat(insumoInfo.rows[0].costo_unitario_promedio) || 0;
        const stockAntes = parseFloat(insumoInfo.rows[0].cantidad_stock) || 0;
        const cantidadUsada = parseFloat(item.cantidad) || 0;

        let costoTotalCalculado = 0;

        if (stockAntes > 0) {
          // 2. Aquí está tu magia original: Calculamos a cómo sale cada unidad (Ej: 720.000 / 120 = 6.000)
          const precioUnitarioReal = valorTotalInventario / stockAntes;
          // 3. Multiplicamos por lo usado (Ej: 6.000 * 17 = 102.000)
          costoTotalCalculado = precioUnitarioReal * cantidadUsada;
        }

        console.log(
          `📊 Gasto ID ${item.id_insumo}: Usado=${cantidadUsada} | Costo Final Calculado=${costoTotalCalculado}`,
        );

        // 4. Guardamos el historial del gasto
        await client.query(
          `INSERT INTO sisvillasol.consumo_insumos (id_tarea_consumo, id_insumo_consumo, cantidad_usada, costo_calculado) VALUES ($1, $2, $3, $4)`,
          [id, item.id_insumo, cantidadUsada, costoTotalCalculado],
        );

        // 5. Restamos el stock Y le restamos el dinero al inventario
        const nuevoValorInventario = Math.max(
          0,
          valorTotalInventario - costoTotalCalculado,
        );

        const updateStock = await client.query(
          `UPDATE sisvillasol.insumos 
           SET cantidad_stock = cantidad_stock - $1,
               costo_unitario_promedio = $2 
           WHERE id_insumo = $3 
           RETURNING cantidad_stock, stock_minimo, estado_insumo`,
          [cantidadUsada, nuevoValorInventario, item.id_insumo],
        );

        const prod = updateStock.rows[0];
        // Lógica del semáforo
        if (prod && prod.estado_insumo !== "FUERA DE MERCADO") {
          let nuevoEstado =
            parseFloat(prod.cantidad_stock) <= parseFloat(prod.stock_minimo)
              ? "BAJO STOCK"
              : "NORMAL";
          if (nuevoEstado !== prod.estado_insumo) {
            await client.query(
              `UPDATE sisvillasol.insumos SET estado_insumo = $1 WHERE id_insumo = $2`,
              [nuevoEstado, item.id_insumo],
            );
          }
        }
      }
    }
    await client.query("COMMIT");
    res.json({
      mensaje: "Tarea finalizada y stock actualizado CORRECTAMENTE 📉✅",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al finalizar:", error);
    res.status(500).send("Error finalizando tarea");
  } finally {
    client.release();
  }
};

// 8. OBTENER INSUMOS POR TAREA
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

// 9. CORREGIR CANTIDAD INSUMO (TAMBIÉN CORRIGE EL COSTO CONTABLE 💵✅)
const corregirCantidadInsumo = async (req, res) => {
  const { id_tarea, id_insumo, nueva_cantidad } = req.body;
  if (!id_tarea || !id_insumo)
    return res.status(400).json({ message: "Faltan datos (IDs)" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Ver qué teníamos antes
    const resAntigua = await client.query(
      `SELECT cantidad_usada, costo_calculado FROM sisvillasol.consumo_insumos 
       WHERE id_tarea_consumo = $1 AND id_insumo_consumo = $2`,
      [id_tarea, id_insumo],
    );

    if (resAntigua.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Insumo no encontrado en esta tarea" });
    }

    const cantidadAnterior = parseFloat(resAntigua.rows[0].cantidad_usada);
    const costoAnterior = parseFloat(resAntigua.rows[0].costo_calculado);

    // 2. Averiguamos a cómo pagó la unidad en ese momento exacto
    let precioUnitarioReal = 0;
    if (cantidadAnterior > 0) {
      precioUnitarioReal = costoAnterior / cantidadAnterior;
    }

    const cantidadNueva = parseFloat(nueva_cantidad);
    const nuevoCostoCalculado = cantidadNueva * precioUnitarioReal;

    const diferenciaCantidad = cantidadNueva - cantidadAnterior; // Ej: subió 3 unidades
    const diferenciaCosto = nuevoCostoCalculado - costoAnterior; // Ej: cuesta 18.000 pesos más

    // 3. Actualizar registro de consumo
    await client.query(
      `UPDATE sisvillasol.consumo_insumos 
       SET cantidad_usada = $1, costo_calculado = $2 
       WHERE id_tarea_consumo = $3 AND id_insumo_consumo = $4`,
      [cantidadNueva, nuevoCostoCalculado, id_tarea, id_insumo],
    );

    // 4. Actualizar Bodega (Restamos el stock extra y el dinero extra)
    await client.query(
      `UPDATE sisvillasol.insumos 
       SET cantidad_stock = cantidad_stock - $1,
           costo_unitario_promedio = costo_unitario_promedio - $2
       WHERE id_insumo = $3`,
      [diferenciaCantidad, diferenciaCosto, id_insumo],
    );

    await client.query("COMMIT");
    res.json({
      message: "Cantidad y costos corregidos en bodega exitosamente",
    });
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
  obtenerDatosFormulario,
  obtenerLotesDetallados,
  finalizarTarea,
  getHistorialPorLote,
  obtenerInsumosPorTarea,
  corregirCantidadInsumo,
};
