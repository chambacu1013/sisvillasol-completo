const { Router } = require("express");
const router = Router();

// IMPORTAR (Desestructuración)
const {
  obtenerActividades,
  crearActividad,
  actualizarTarea,
  obtenerDatosFormulario,
  obtenerLotesDetallados,
  finalizarTarea,
  getHistorialPorLote,
  obtenerInsumosPorTarea,
  corregirCantidadInsumo,
} = require("../controllers/actividadesController");

const verificarToken = require("../middleware/authMiddleware");

// 1. RUTAS ESPECÍFICAS (Deben ir PRIMERO)
router.get("/info-lotes", verificarToken, obtenerLotesDetallados);
router.get("/insumos-tarea/:id_tarea", verificarToken, obtenerInsumosPorTarea);
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);
// ----------------------------------------
router.put("/corregir-insumo", verificarToken, corregirCantidadInsumo);
// 2. Rutas GENERALES (Raíz)
router.get("/", verificarToken, obtenerActividades);
router.post("/", verificarToken, crearActividad);

// 3. Rutas con PARÁMETROS /:id (Siempre deben ir AL FINAL)
router.get("/historial-lote/:id_lote", verificarToken, getHistorialPorLote);
router.put("/finalizar/:id", verificarToken, finalizarTarea);
router.put("/:id", verificarToken, actualizarTarea);

module.exports = router;
