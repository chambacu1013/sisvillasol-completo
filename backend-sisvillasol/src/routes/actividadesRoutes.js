const { Router } = require("express");
const router = Router();

// IMPORTAR (Desestructuración)
const {
  obtenerActividades,
  crearActividad,
  actualizarTarea,
  eliminarActividad,
  obtenerDatosFormulario, // <--- La tienes importada aquí, ¡pero faltaba usarla abajo!
  obtenerLotesDetallados,
  finalizarTarea,
  getHistorial,
} = require("../controllers/actividadesController");

const verificarToken = require("../middleware/authMiddleware");

// 1. RUTAS ESPECÍFICAS (Deben ir PRIMERO)
router.get("/historial", verificarToken, getHistorial);
router.get("/info-lotes", verificarToken, obtenerLotesDetallados);

// --- ESTA ES LA LÍNEA QUE TE FALTABA --- 🚨
// Sin esto, el frontend recibe un error 404 y explota al intentar leer las listas
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);
// ----------------------------------------

// 2. Rutas GENERALES (Raíz)
router.get("/", verificarToken, obtenerActividades);
router.post("/", verificarToken, crearActividad);

// 3. Rutas con PARÁMETROS /:id (Siempre deben ir AL FINAL)
router.put("/finalizar/:id", verificarToken, finalizarTarea);
router.put("/:id", verificarToken, actualizarTarea);
router.delete("/:id", verificarToken, eliminarActividad);

module.exports = router;
