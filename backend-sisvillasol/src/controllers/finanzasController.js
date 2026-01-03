const pool = require("../config/db");

// 1. OBTENER RESUMEN (KPIs + Lotes con Cultivo)
const obtenerResumenFinanciero = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear(); // Si no llega año, usa el actual

  try {
    // A. INGRESOS (Filtrado por año)
    const ventasRes = await pool.query(
      "SELECT SUM(precio_total) as total FROM sisvillasol.ventas WHERE EXTRACT(YEAR FROM fecha_venta) = $1",
      [anio]
    );
    const totalIngresos = Number(ventasRes.rows[0].total || 0);

    // B. GASTOS MANO DE OBRA (Filtrado por año)
    const tareasRes = await pool.query(
      "SELECT SUM(costo_mano_obra) as total FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1",
      [anio]
    );
    const totalManoObra = Number(tareasRes.rows[0].total || 0);

    const gananciaNeta = totalIngresos - totalManoObra;

    // C. MEJOR LOTE (Filtrado por año)
    const mejorLoteRes = await pool.query(
      `
            SELECT l.nombre_lote, c.nombre_variedad, SUM(v.precio_total) as total 
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1  -- <--- FILTRO AÑO
            GROUP BY l.nombre_lote, c.nombre_variedad
            ORDER BY total DESC LIMIT 1
        `,
      [anio]
    );

    // D. PEOR LOTE (Filtrado por año)
    const peorLoteRes = await pool.query(
      `
            SELECT l.nombre_lote, c.nombre_variedad, SUM(v.precio_total) as total 
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1 -- <--- FILTRO AÑO
            GROUP BY l.nombre_lote, c.nombre_variedad
            ORDER BY total ASC LIMIT 1
        `,
      [anio]
    );

    res.json({
      ingresos: totalIngresos,
      gastos: totalManoObra,
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
    console.error(error);
    res.status(500).send("Error calculando finanzas");
  }
};

// 2. DATOS GRÁFICA (Esta ya la tenías bien, la dejo igual para que no se pierda)
const obtenerGraficaAnual = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    const ingresosRes = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_venta) as mes, SUM(precio_total) as total
       FROM sisvillasol.ventas WHERE EXTRACT(YEAR FROM fecha_venta) = $1 GROUP BY mes`,
      [anio]
    );

    const gastosRes = await pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_programada) as mes, SUM(costo_mano_obra) as total
       FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1 GROUP BY mes`,
      [anio]
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
      const ingresoMes = ingresosRes.rows.find((r) => Number(r.mes) === i);
      const gastoMes = gastosRes.rows.find((r) => Number(r.mes) === i);
      datosGrafica.push({
        name: mesesNombres[i - 1],
        Ingresos: ingresoMes ? Number(ingresoMes.total) : 0,
        Costos: gastoMes ? Number(gastoMes.total) : 0,
      });
    }
    res.json(datosGrafica);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error gráfica");
  }
};

// 3. OBTENER VENTAS (¡AHORA FILTRADA POR AÑO!)
const obtenerVentas = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    const response = await pool.query(
      `
            SELECT v.*, l.nombre_lote, c.nombre_variedad
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            LEFT JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1 -- <--- FILTRO AÑO AQUI
            ORDER BY v.fecha_venta DESC
        `,
      [anio]
    );
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error ventas");
  }
};

// 4. CREAR VENTA (Sin cambios)
const crearVenta = async (req, res) => {
  const { id_lote, fecha_venta, cliente, kilos_vendidos, precio_total } =
    req.body;
  try {
    await pool.query(
      `INSERT INTO sisvillasol.ventas (id_lote, fecha_venta, cliente, kilos_vendidos, precio_total)
             VALUES ($1, $2, $3, $4, $5)`,
      [id_lote, fecha_venta, cliente, kilos_vendidos, precio_total]
    );
    res.json({ mensaje: "Venta registrada 💰" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
};

// 5. ACTUALIZAR VENTA (Sin cambios)
const actualizarVenta = async (req, res) => {
  const { id } = req.params;
  const { id_lote, fecha_venta, cliente, kilos_vendidos, precio_total } =
    req.body;
  try {
    await pool.query(
      `UPDATE sisvillasol.ventas 
             SET id_lote = $1, fecha_venta = $2, cliente = $3, kilos_vendidos = $4, precio_total = $5
             WHERE id_venta = $6`,
      [id_lote, fecha_venta, cliente, kilos_vendidos, precio_total, id]
    );
    res.json({ mensaje: "Venta actualizada 📝" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
};

// 6. ELIMINAR VENTA (Sin cambios)
const eliminarVenta = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sisvillasol.ventas WHERE id_venta = $1", [
      id,
    ]);
    res.json({ mensaje: "Venta eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
};

// 7. TORTAS (DISTRIBUCIÓN) - ¡AHORA FILTRADAS!
const obtenerDistribucionFinanciera = async (req, res) => {
  const { year } = req.query;
  const anio = year || new Date().getFullYear();

  try {
    // 1. DISTRIBUCIÓN DE VENTAS POR CULTIVO (Filtrado por año)
    const cultivosQuery = await pool.query(
      `
            SELECT 
                c.nombre_variedad as name, 
                SUM(v.precio_total) as value
            FROM sisvillasol.ventas v
            JOIN sisvillasol.lotes l ON v.id_lote = l.id_lote
            JOIN sisvillasol.cultivos c ON l.id_cultivo_actual = c.id_cultivo
            WHERE EXTRACT(YEAR FROM v.fecha_venta) = $1 -- <--- FILTRO AÑO
            GROUP BY c.nombre_variedad
        `,
      [anio]
    );

    const cultivosData = cultivosQuery.rows.map((dato) => ({
      name: dato.name,
      value: Number(dato.value),
    }));

    // 2. DISTRIBUCIÓN DE GASTOS (Filtrado por año)
    // A. Mano de Obra
    const manoObra = await pool.query(
      "SELECT SUM(costo_mano_obra) as total FROM sisvillasol.tareas WHERE EXTRACT(YEAR FROM fecha_programada) = $1",
      [anio]
    );

    // B. Insumos (OJO: Aquí asumimos que consumo_insumos se une con tareas para saber la fecha)
    // Si tu tabla consumo_insumos tiene "id_tarea", esto funciona perfecto.
    const insumos = await pool.query(
      `
        SELECT SUM(ci.costo_calculado) as total 
        FROM sisvillasol.consumo_insumos ci
        JOIN sisvillasol.tareas t ON ci.id_tarea = t.id_tarea
        WHERE EXTRACT(YEAR FROM t.fecha_programada) = $1
      `,
      [anio]
    );

    // Si 'insumos' da error porque no existe id_tarea, avísame, pero es lo estándar.

    const gastosData = [
      { name: "Mano de Obra", value: parseFloat(manoObra.rows[0].total || 0) },
      { name: "Insumos", value: parseFloat(insumos.rows[0].total || 0) },
    ];

    res.json({
      cultivos: cultivosData,
      gastos: gastosData,
    });
  } catch (error) {
    console.error(error);
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
