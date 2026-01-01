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
} = require("../controllers/actividadesController");

const verificarToken = require("../middleware/authMiddleware");

// RUTAS
router.get("/", verificarToken, obtenerActividades);
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);
router.get("/info-lotes", verificarToken, obtenerLotesDetallados);
router.get("/insumos", verificarToken, obtenerInsumos);
router.put("/finalizar/:id", verificarToken, finalizarTarea);
router.post("/", verificarToken, crearActividad);
router.put("/:id", verificarToken, actualizarTarea);
router.delete("/:id", verificarToken, eliminarActividad);

module.exports = router;
