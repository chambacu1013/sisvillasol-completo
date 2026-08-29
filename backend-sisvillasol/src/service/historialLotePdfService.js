const PDFDocument = require("pdfkit");

/**
 * Genera el PDF del historial de actividades de un lote.
 *
 * @param {Object} lote
 * @param {Array} historial
 * @returns {PDFDocument}
 */
const generarHistorialLotePDF = (lote, historial) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 40,
    bufferPages: true,
  });

  // =========================================================
  // ENCABEZADO
  // =========================================================

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("FINCA VILLASOL", { align: "center" });

  doc
    .moveDown(0.3)
    .fontSize(14)
    .text("Historial de Actividades del Lote", { align: "center" });

  doc.moveDown(1);

  // =========================================================
  // INFORMACIÓN DEL LOTE
  // =========================================================

  doc.font("Helvetica-Bold").fontSize(10).text("Información del lote");

  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(10);

  doc.text(`Lote: ${lote.nombre_lote || "Sin información"}`);
  doc.text(`Cultivo: ${lote.nombre_variedad || "Sin cultivo"}`);
  doc.text(`Área: ${lote.area_hectareas ?? "N/A"} Has`);
  doc.text(`Número de árboles: ${lote.cantidad_arboles ?? "N/A"}`);
  doc.text(`Estado actual: ${lote.nombre_estado || "Sin estado"}`);

  doc.moveDown(1);

  // =========================================================
  // TÍTULO DEL HISTORIAL
  // =========================================================

  doc.font("Helvetica-Bold").fontSize(12).text("Historial de labores");

  doc.moveDown(0.5);

  // =========================================================
  // TABLA
  // =========================================================

  const columnas = {
    fecha: 40,
    actividad: 100,
    detalle: 190,
    agricultor: 330,
    insumos: 450,
  };

  const anchos = {
    fecha: 55,
    actividad: 85,
    detalle: 135,
    agricultor: 115,
    insumos: 115,
  };

  const dibujarEncabezado = () => {
    const y = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Fecha", columnas.fecha, y, {
        width: anchos.fecha,
      })
      .text("Actividad", columnas.actividad, y, {
        width: anchos.actividad,
      })
      .text("Detalle", columnas.detalle, y, {
        width: anchos.detalle,
      })
      .text("Agricultor", columnas.agricultor, y, {
        width: anchos.agricultor,
      })
      .text("Insumos", columnas.insumos, y, {
        width: anchos.insumos,
      });

    doc.moveDown(0.8);

    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();

    doc.moveDown(0.5);
  };

  dibujarEncabezado();

  // =========================================================
  // REGISTROS
  // =========================================================

  if (!historial || historial.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .text("No hay registros de actividades para este lote.", {
        align: "center",
      });

    return doc;
  }

  historial.forEach((fila) => {
    // Fecha
    const fecha = fila.fecha_ejecucion
      ? new Date(fila.fecha_ejecucion).toLocaleDateString("es-CO", {
          timeZone: "UTC",
        })
      : "Sin fecha";

    // Actividad
    const actividad = fila.nombre_tipo_actividad || "Sin actividad";

    // Detalle
    const detalle = fila.descripcion || "Sin detalle";

    // Agricultor
    const agricultor = fila.nombre_agricultor || "Sin agricultor";

    // Insumos
    let insumos = "Ninguno";

    if (Array.isArray(fila.insumos_usados) && fila.insumos_usados.length > 0) {
      insumos = fila.insumos_usados
        .map((insumo) => {
          return `${insumo.nombre}: ${insumo.cantidad} ${insumo.unidad || ""}`.trim();
        })
        .join(", ");
    }

    // -------------------------------------------------------
    // Altura necesaria para esta fila
    // -------------------------------------------------------

    const yInicial = doc.y;

    const alturaFecha = doc.heightOfString(fecha, {
      width: anchos.fecha,
      font: "Helvetica",
      fontSize: 8,
    });

    const alturaActividad = doc.heightOfString(actividad, {
      width: anchos.actividad,
      font: "Helvetica",
      fontSize: 8,
    });

    const alturaDetalle = doc.heightOfString(detalle, {
      width: anchos.detalle,
      font: "Helvetica",
      fontSize: 8,
    });

    const alturaAgricultor = doc.heightOfString(agricultor, {
      width: anchos.agricultor,
      font: "Helvetica",
      fontSize: 8,
    });

    const alturaInsumos = doc.heightOfString(insumos, {
      width: anchos.insumos,
      font: "Helvetica",
      fontSize: 8,
    });

    const alturaFila =
      Math.max(
        alturaFecha,
        alturaActividad,
        alturaDetalle,
        alturaAgricultor,
        alturaInsumos,
      ) + 8;

    // -------------------------------------------------------
    // Salto de página
    // -------------------------------------------------------

    if (yInicial + alturaFila > 750) {
      doc.addPage();

      doc.font("Helvetica-Bold").fontSize(12).text("Historial de labores");

      doc.moveDown(0.5);

      dibujarEncabezado();
    }

    const y = doc.y;

    // -------------------------------------------------------
    // Dibujar fila
    // -------------------------------------------------------

    doc
      .font("Helvetica")
      .fontSize(8)
      .text(fecha, columnas.fecha, y, {
        width: anchos.fecha,
      })
      .text(actividad, columnas.actividad, y, {
        width: anchos.actividad,
      })
      .text(detalle, columnas.detalle, y, {
        width: anchos.detalle,
      })
      .text(agricultor, columnas.agricultor, y, {
        width: anchos.agricultor,
      })
      .text(insumos, columnas.insumos, y, {
        width: anchos.insumos,
      });

    doc.y = y + alturaFila;

    doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor("#dddddd").stroke();

    doc.moveDown(0.3);
  });

  // =========================================================
  // PIE DE PÁGINA
  // =========================================================

  const rango = doc.bufferedPageRange();

  for (let i = 0; i < rango.count; i++) {
    doc.switchToPage(i);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#666666")
      .text(
        `Finca Villasol - Historial del lote ${lote.nombre_lote || ""}`,
        40,
        760,
        {
          width: 530,
          align: "center",
        },
      );
  }

  return doc;
};

module.exports = {
  generarHistorialLotePDF,
};
