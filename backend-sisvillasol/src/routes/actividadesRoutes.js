const { Router } = require("express");
const router = Router();

// IMPORTAR (Desestructuración)
const {
  obtenerActividades,
  crearActividad,
  actualizarTarea,
  eliminarActividad,
  obtenerDatosFormulario,
  obtenerLotesDetallados,
  obtenerInsumos,
  finalizarTarea,
  getHistorial,
} = require("../controllers/actividadesController");

const verificarToken = require("../middleware/authMiddleware");
// RUTAS
router.get("/historial", verificarToken, getHistorial);
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);
router.get("/info-lotes", verificarToken, obtenerLotesDetallados);
router.get("/insumos", verificarToken, obtenerInsumos);

// 2. Rutas GENERALES (Raíz)
router.get("/", verificarToken, obtenerActividades);
router.post("/", verificarToken, crearActividad);

// 3. Rutas con PARÁMETROS /:id (Siempre deben ir AL FINAL)
// Si pones estas arriba, el sistema podría confundir la palabra "historial" con un ID.
router.put("/finalizar/:id", verificarToken, finalizarTarea);
router.put("/:id", verificarToken, actualizarTarea);
router.delete("/:id", verificarToken, eliminarActividad);

module.exports = router;
