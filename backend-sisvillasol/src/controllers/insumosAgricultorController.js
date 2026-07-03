const pool = require("../config/db");

/*=====================================================
OBTENER FACTURAS + KPIs
=====================================================*/

const obtenerFacturas = async (req, res) => {
  const { anio } = req.query;

  try {
    const params = [];
    let where = "";

    if (anio) {
      where = "WHERE EXTRACT(YEAR FROM fecha) = $1";
      params.push(anio);
    }

    /*=========================================
    FACTURAS
    =========================================*/

    const facturas = await pool.query(
      `
      SELECT *
      FROM sisvillasol.insumos_agricultor
      ${where}
      ORDER BY fecha DESC, id DESC
      `,
      params,
    );

    /*=========================================
    KPI GENERAL
    =========================================*/

    const kpiGeneral = await pool.query(
      `
      SELECT
          COUNT(*)::INTEGER AS facturas,
          COALESCE(SUM(total),0)::NUMERIC AS total_invertido,
          COALESCE(AVG(total),0)::NUMERIC AS promedio
      FROM sisvillasol.insumos_agricultor
      ${where}
      `,
      params,
    );

    /*=========================================
    TOTAL PRODUCTOS
    =========================================*/

    const totalProductos = await pool.query(
      `
      SELECT
          COALESCE(SUM(d.cantidad),0)::NUMERIC AS productos

      FROM sisvillasol.insumos_agricultor_detalle d

      INNER JOIN sisvillasol.insumos_agricultor f
          ON f.id=d.factura_id

      ${anio ? "WHERE EXTRACT(YEAR FROM f.fecha) = $1" : ""}
      `,
      params,
    );
    /*=========================================
FACTURACIÓN MENSUAL
=========================================*/

    const graficoMensual = await pool.query(
      `
  SELECT

      EXTRACT(MONTH FROM fecha)::INTEGER AS mes,

      COALESCE(SUM(total),0)::NUMERIC AS total

  FROM sisvillasol.insumos_agricultor

 ${anio ? "WHERE EXTRACT(YEAR FROM fecha)=$1" : ""}

  GROUP BY mes

  ORDER BY mes
  `,
      params,
    );
    res.json({
      kpis: {
        totalAnual: Number(kpiGeneral.rows[0].total_invertido),

        facturas: Number(kpiGeneral.rows[0].facturas),

        productos: Number(totalProductos.rows[0].productos),

        promedio: Number(kpiGeneral.rows[0].promedio),
      },
      graficoMensual: graficoMensual.rows,

      facturas: facturas.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error consultando facturas.",
    });
  }
};

/*=====================================================
OBTENER AÑOS DISPONIBLES
=====================================================*/

const obtenerAnios = async (req, res) => {
  try {
    const response = await pool.query(`
      SELECT DISTINCT
        EXTRACT(YEAR FROM fecha)::INTEGER AS anio
      FROM sisvillasol.insumos_agricultor
      ORDER BY anio DESC
    `);

    res.json(response.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error obteniendo años.",
    });
  }
};
/*=====================================================
OBTENER UNA FACTURA CON SU DETALLE
=====================================================*/

const obtenerFactura = async (req, res) => {
  const { id } = req.params;

  try {
    const factura = await pool.query(
      `SELECT *
       FROM sisvillasol.insumos_agricultor
       WHERE id=$1`,
      [id],
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Factura no encontrada",
      });
    }

    const detalle = await pool.query(
      `SELECT   d.id,
        d.producto_id, p.nombre AS producto,
        p.unidad, d.cantidad,  d.valor_unitario,
        d.subtotal
        FROM sisvillasol.insumos_agricultor_detalle d
        INNER JOIN sisvillasol.productos_agricolas p
            ON p.id = d.producto_id
        WHERE d.factura_id = $1
        ORDER BY d.id;`,
      [id],
    );

    const facturaCompleta = {
      ...factura.rows[0],
      detalle: detalle.rows,
    };

    res.json(facturaCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error obteniendo factura");
    if (error.code === "23505") {
      res.status(400).send("El número de factura ya está registrado.");
    }
  }
};

/*=====================================================
CREAR FACTURA
=====================================================*/

const crearFactura = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      numero_factura,
      fecha,
      hora,
      proveedor,
      cliente,
      documento,
      agricultor,
      lote,
      direccion,
      ciudad,
      forma_pago,
      medio_pago,
      total,
      observaciones,
      detalle,
    } = req.body;

    await client.query("BEGIN");

    const factura = await client.query(
      `INSERT INTO sisvillasol.insumos_agricultor
      (
      numero_factura,
      fecha,
      hora,
      proveedor,
      cliente,
      documento,
      agricultor,
      lote,
      direccion,
      ciudad,
      forma_pago,
      medio_pago,
      total,
      observaciones
      )

      VALUES
      (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )

      RETURNING id`,

      [
        numero_factura,
        fecha,
        hora,
        proveedor,
        cliente,
        documento,
        agricultor,
        lote,
        direccion,
        ciudad,
        forma_pago,
        medio_pago,
        total,
        observaciones,
      ],
    );

    const facturaId = factura.rows[0].id;

    for (const item of detalle) {
      await client.query(
        `INSERT INTO sisvillasol.insumos_agricultor_detalle
        (
        factura_id,
        producto_id,
        cantidad,
        valor_unitario,
        subtotal
    )
    VALUES
    ($1,$2,$3,$4,$5)`,

        [
          facturaId,
          item.producto_id,
          item.cantidad,
          item.valor_unitario,
          item.subtotal,
        ],
      );
    }

    await client.query("COMMIT");

    res.json({
      mensaje: "Factura registrada correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).send("Error registrando factura");
  } finally {
    client.release();
  }
};

/*=====================================================
ACTUALIZAR FACTURA
=====================================================*/

const actualizarFactura = async (req, res) => {
  const client = await pool.connect();

  const { id } = req.params;

  try {
    const {
      numero_factura,
      fecha,
      hora,
      proveedor,
      cliente,
      documento,
      agricultor,
      lote,
      direccion,
      ciudad,
      forma_pago,
      medio_pago,
      total,
      observaciones,
      detalle,
    } = req.body;

    await client.query("BEGIN");

    await client.query(
      `UPDATE sisvillasol.insumos_agricultor

      SET

      numero_factura=$1,
      fecha=$2,
      hora=$3,
      proveedor=$4,
      cliente=$5,
      documento=$6,
      agricultor=$7,
      lote=$8,
      direccion=$9,
      ciudad=$10,
      forma_pago=$11,
      medio_pago=$12,
      total=$13,
      observaciones=$14

      WHERE id=$15`,

      [
        numero_factura,
        fecha,
        hora,
        proveedor,
        cliente,
        documento,
        agricultor,
        lote,
        direccion,
        ciudad,
        forma_pago,
        medio_pago,
        total,
        observaciones,
        id,
      ],
    );

    await client.query(
      `DELETE
       FROM sisvillasol.insumos_agricultor_detalle
       WHERE factura_id=$1`,
      [id],
    );

    for (const item of detalle) {
      await client.query(
        `INSERT INTO sisvillasol.insumos_agricultor_detalle
        (
        factura_id,
        producto_id,
        cantidad,
        valor_unitario,
        subtotal
    )
    VALUES
    ($1,$2,$3,$4,$5)`,

        [
          id,
          item.producto_id,
          item.cantidad,
          item.valor_unitario,
          item.subtotal,
        ],
      );
    }

    await client.query("COMMIT");

    res.json({
      mensaje: "Factura actualizada correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).send("Error actualizando factura");
  } finally {
    client.release();
  }
};

/*=====================================================
ELIMINAR FACTURA
=====================================================*/

const eliminarFactura = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE
       FROM sisvillasol.insumos_agricultor
       WHERE id=$1`,

      [id],
    );

    res.json({
      mensaje: "Factura eliminada",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send("Error eliminando factura");
  }
};

module.exports = {
  obtenerFacturas,
  obtenerAnios,
  obtenerFactura,
  crearFactura,
  actualizarFactura,
  eliminarFactura,
};
