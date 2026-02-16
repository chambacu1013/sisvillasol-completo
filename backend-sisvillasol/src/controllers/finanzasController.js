const pool = require("../config/db");

// 1. OBTENER RESUMEN (KPIs) - Filtrado por Año
const obtenerResumenFinanciero = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    // A. INGRESOS (VENTAS)
    const ventasRes = await pool.query(
      "SELECT SUM(precio_total) as total FROM sisvillasol.ventas WHERE EXTRACT(YEAR FROM fecha_venta) = $1",
      [anio],
    );
    const totalIngresos = Number(ventasRes.rows[0].total || 0);

    // B. GASTOS DE MANO DE OBRA (TAREAS)
    const tareasRes = await pool.query(
      "SELECT SUM(costo_mano_obra) as total FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1",
      [anio],
    );
    const totalManoObra = Number(tareasRes.rows[0].total || 0);

    // C. GASTOS DE INSUMOS (CONSUMO) - ¡NUEVO! 🧪
    // OJO: Usamos 'id_tarea_consumo' para unir
    const insumosRes = await pool.query(
      `SELECT SUM(ci.costo_calculado) as total 
       FROM sisvillasol.consumo_insumos ci
       JOIN sisvillasol.tareas t ON ci.id_tarea_consumo = t.id_tarea
       WHERE EXTRACT(YEAR FROM t.fecha_programada) = $1`,
      [anio],
    );
    const totalInsumos = Number(insumosRes.rows[0].total || 0);

    // D. TOTALES REALES
    const totalGastos = totalManoObra + totalInsumos; // <--- AHORA SÍ ES REAL
    const gananciaNeta = totalIngresos - totalGastos;

    // E. MEJOR Y PEOR LOTE
    const queryRanking = (orden) => `
            SELECT l.nombre_lote, c.nombre_variedad, SUM(v.precio_total) as total 
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1 
            GROUP BY l.nombre_lote, c.nombre_variedad
            ORDER BY total ${orden} LIMIT 1
    `;

    const mejorLoteRes = await pool.query(queryRanking("DESC"), [anio]);
    const peorLoteRes = await pool.query(queryRanking("ASC"), [anio]);

    res.json({
      ingresos: totalIngresos,
      gastos: totalGastos, // Enviamos la suma completa
      ganancia: gananciaNeta,
      mejorLote: mejorLoteRes.rows[0] || {
        nombre_lote: "N/A",
        nombre_variedad: "",
        total: 0,
      },
      peorLote: peorLoteRes.rows[0] || {
        nombre_lote: "N/A",
        nombre_variedad: "",
        total: 0,
      },
    });
  } catch (error) {
    console.error("Error en KPIs:", error.message);
    res.status(500).send("Error calculando finanzas");
  }
};

// 2. DATOS GRÁFICA BARRAS - Filtrado por Año
const obtenerGraficaAnual = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    // 1. INGRESOS POR MES
    const ingresosRes = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_venta) as mes, SUM(precio_total) as total
       FROM sisvillasol.ventas WHERE EXTRACT(YEAR FROM fecha_venta) = $1 GROUP BY mes`,
      [anio],
    );

    // 2. MANO DE OBRA POR MES
    const manoObraRes = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_programada) as mes, SUM(costo_mano_obra) as total
       FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1 GROUP BY mes`,
      [anio],
    );

    // 3. INSUMOS POR MES (¡EL QUE FALTABA!) 🧪
    const insumosRes = await pool.query(
      `SELECT EXTRACT(MONTH FROM t.fecha_programada) as mes, SUM(ci.costo_calculado) as total
       FROM sisvillasol.consumo_insumos ci
       JOIN sisvillasol.tareas t ON ci.id_tarea_consumo = t.id_tarea
       WHERE EXTRACT(YEAR FROM t.fecha_programada) = $1
       GROUP BY mes`,
      [anio],
    );

    const datosGrafica = [];
    const mesesNombres = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    for (let i = 1; i <= 12; i++) {
      const ingreso = ingresosRes.rows.find((r) => Number(r.mes) === i);
      const manoObra = manoObraRes.rows.find((r) => Number(r.mes) === i);
      const insumo = insumosRes.rows.find((r) => Number(r.mes) === i); // Buscamos insumo del mes

      // Sumamos Mano de Obra + Insumos
      const totalCostosMes =
        (manoObra ? Number(manoObra.total) : 0) +
        (insumo ? Number(insumo.total) : 0);

      datosGrafica.push({
        name: mesesNombres[i - 1],
        Ingresos: ingreso ? Number(ingreso.total) : 0,
        Costos: totalCostosMes, // Ahora incluye ambos gastos
      });
    }
    res.json(datosGrafica);
  } catch (error) {
    console.error("Error en Gráfica:", error.message);
    res.status(500).send("Error gráfica");
  }
};

// 3. OBTENER VENTAS - Filtrado por Año
const obtenerVentas = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();
  try {
    const ventas = await pool.query(
      `
            SELECT v.*, l.nombre_lote, c.nombre_variedad
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1 
            ORDER BY v.fecha_venta DESC
        `,
      [anio],
    );
    //Kilos vendidos por lote
    const kilosPorLote = await pool.query(`
    SELECT 
        l.nombre_lote, c.nombre_variedad,
        COALESCE(SUM(v.kilos_vendidos), 0) as total_kilos
    FROM sisvillasol.lotes l
    LEFT JOIN sisvillasol.ventas v ON l.id_lote = v.id_lote
    LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
    GROUP BY l.nombre_lote, c.nombre_variedad
    ORDER BY total_kilos DESC
`);
    res.json({
      ventas: ventas.rows,
      kilosPorLote: kilosPorLote.rows,
    });
  } catch (error) {
    console.error("Error en Ventas:", error.message);
    res.status(500).send("Error ventas");
  }
};

// 4. CREAR VENTA
const crearVenta = async (req, res) => {
  const { id_lote, fecha_venta, cliente, kilos_vendidos, precio_total } =
    req.body;
  try {
    await pool.query(
      `INSERT INTO sisvillasol.ventas (id_lote, fecha_venta, cliente, kilos_vendidos, precio_total)
       VALUES ($1, $2, $3, $4, $5)`,
      [id_lote, fecha_venta, cliente, kilos_vendidos, precio_total],
    );
    res.json({ mensaje: "Venta registrada 💰" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creando venta");
  }
};

// 5. ACTUALIZAR VENTA
const actualizarVenta = async (req, res) => {
  const { id } = req.params;
  const { id_lote, fecha_venta, cliente, kilos_vendidos, precio_total } =
    req.body;
  try {
    await pool.query(
      `UPDATE sisvillasol.ventas 
       SET id_lote = $1, fecha_venta = $2, cliente = $3, kilos_vendidos = $4, precio_total = $5
       WHERE id_venta = $6`,
      [id_lote, fecha_venta, cliente, kilos_vendidos, precio_total, id],
    );
    res.json({ mensaje: "Venta actualizada 📝" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error actualizando venta");
  }
};

// 6. ELIMINAR VENTA
const eliminarVenta = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sisvillasol.ventas WHERE id_venta = $1", [
      id,
    ]);
    res.json({ mensaje: "Venta eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error eliminando venta");
  }
};

// 7. TORTAS (DISTRIBUCIÓN) - Corregida y Optimizada
const obtenerDistribucionFinanciera = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    // 1. CULTIVOS
    const cultivosQuery = await pool.query(
      `
            SELECT c.nombre_variedad as name, SUM(v.precio_total) as value
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1
            GROUP BY c.nombre_variedad
        `,
      [anio],
    );

    const cultivosData = cultivosQuery.rows.map((dato) => ({
      name: dato.name,
      value: Number(dato.value),
    }));

    // 2. MANO DE OBRA
    const manoObra = await pool.query(
      "SELECT SUM(costo_mano_obra) as total FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1",
      [anio],
    );

    // 3. INSUMOS
    const insumosRes = await pool.query(
      `
            SELECT SUM(ci.costo_calculado) as total 
            FROM sisvillasol.consumo_insumos ci
            JOIN sisvillasol.tareas t ON ci.id_tarea_consumo = t.id_tarea
            WHERE EXTRACT(YEAR FROM t.fecha_programada) = $1
        `,
      [anio],
    );
    const totalInsumos = Number(insumosRes.rows[0].total || 0);

    const gastosData = [
      { name: "Mano de Obra", value: Number(manoObra.rows[0].total || 0) },
      { name: "Insumos", value: totalInsumos },
    ];

    res.json({
      cultivos: cultivosData,
      gastos: gastosData,
    });
  } catch (error) {
    console.error("🔥 Error FATAL en tortas:", error.message);
    res.status(500).send("Error en reportes de torta");
  }
};

module.exports = {
  obtenerResumenFinanciero,
  obtenerGraficaAnual,
  obtenerVentas,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  obtenerDistribucionFinanciera,
};
